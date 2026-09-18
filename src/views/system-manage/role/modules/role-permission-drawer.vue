<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { VxeTablePropTypes } from 'vxe-table';
import { $t } from '@/locales';
import { fetchUpdateRoleAuths } from '@/service/api/role';
import { getMenuPermissionTree, type MenuPermissionRow } from '@/constants/menu-permissions';
import { SUPER_ROLE_TYPE } from '@/constants/auth';
import CommonDrawer from '@/components/common/drawer.vue';
import { Table } from '@/components/Table';
import type { VxeColumnRenderColumn } from '@/components/Table';

defineOptions({
  name: 'RolePermissionDrawer'
});

interface Props {
  /** drawer visibility, use v-model:show */
  show?: boolean;
  /** role to assign menus */
  row?: Api.SystemManage.Role | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  row: null
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  submitted: [];
}>();

const drawerVisible = computed({
  get: () => props.show,
  set: val => emit('update:show', val)
});

const title = computed(() =>
  props.row ? `${$t('page.manage.role.permission')} - ${props.row.name}` : $t('page.manage.role.permission')
);

/** 当前角色是否为超管（roleType === SUPER_ROLE_TYPE=100）：权限树强制全选且只读 */
const isSuperRole = computed(() => props.row?.roleType === SUPER_ROLE_TYPE);

const submitting = ref(false);
const tableRef = ref<{ setTreeExpand?: (rows: any[], expanded: boolean) => void } | null>(null);
/** 每个菜单 id 勾选的按钮权限码，独立于过滤/搜索，避免搜索后丢失 */
const rowButtonChecks = ref<Record<number, string[]>>({});

/** 完整权限树（权威数据源）：由 src/constants/menu-permissions.ts 配置自动生成 */
const allRows = ref<MenuPermissionRow[]>([]);
/** 当前表格渲染的行（按关键字过滤后的视图） */
const viewRows = ref<MenuPermissionRow[]>([]);
/** 权威勾选集合，过滤掉的行也保留在这里，避免搜索时丢失勾选 */
const checkedIds = ref<number[]>([]);
const keyword = ref('');

/** 全表按钮权限码（表头全选 / 半选用） */
// const allButtonCodes = computed(() => collectButtonCodes());

const columns = computed<VxeColumnRenderColumn[]>(() => [
  {
    key: 'title',
    title: '菜单名称',
    treeNode: true,
    width: 200,
    sortable: false,
    headerSlot: 'nav-header'
  },
  { key: 'buttons', title: '按钮权限', minWidth: 320, sortable: false, headerSlot: 'button-header' }
]);

const expandedKeys = ref<number[]>([]);

/** 行高自适应：height=0 让 cellOpts.height 为空，vxe 改用实测内容高度（权限较多的行自动撑高） */
const autoRowConfig: VxeTablePropTypes.CellConfig = { height: 0 };

/**
 * 行主键固定为业务 id：vxe 的树展开状态按 rowid 索引缓存，
 * 勾选/搜索会整体重建行对象，没有 keyField 时 rowid 会整批换新导致展开态丢失（表现为瞬间收起再展开）。
 */
const rowConfig: VxeTablePropTypes.RowConfig = { keyField: 'id' };

const treeConfig = computed<VxeTablePropTypes.TreeConfig>(() => ({
  rowField: 'id',
  childrenField: 'children',
  expandRowKeys: expandedKeys.value,
  expandAll: false,
  // showLine 是 vxe 逐行实测内容高度的开关（calcCellHeight 条件），连接线本身用下方 CSS 隐藏
  showLine: true
}));

/**
 * checkStrictly: false -> 父子联动（勾父选子、子部分选时父半选），与原 NTree cascade 语义一致
 * checkField: 'checked' -> 用行上的 checked 字段回填初始勾选
 */
const checkboxConfig = computed<VxeTablePropTypes.CheckboxConfig>(() => ({
  checkStrictly: false,
  checkField: 'checked',
  // 首页等必选菜单禁用勾选（保持默认勾选，不可取消）；超管角色权限树强制只读
  checkMethod: (params: any) => !params?.row?.home && !isSuperRole.value
}));

function collectIds(rows: MenuPermissionRow[]): number[] {
  const ids: number[] = [];

  function walk(list: MenuPermissionRow[]) {
    list.forEach(row => {
      ids.push(row.id);
      if (row.children?.length) {
        walk(row.children);
      }
    });
  }

  walk(rows);

  return ids;
}

/** 收集所有拥有子节点的菜单 id，用作树形默认展开 */
function collectExpandableIds(rows: MenuPermissionRow[]): number[] {
  const ids: number[] = [];

  function walk(list: MenuPermissionRow[]) {
    list.forEach(row => {
      if (row.children?.length) {
        ids.push(row.id);
        walk(row.children);
      }
    });
  }

  walk(rows);

  return ids;
}

/** 收集所有拥有子节点的菜单行对象，供 vxe setTreeExpand 使用 */
function collectExpandableRows(rows: MenuPermissionRow[]): MenuPermissionRow[] {
  const result: MenuPermissionRow[] = [];

  function walk(list: MenuPermissionRow[]) {
    list.forEach(row => {
      if (row.children?.length) {
        result.push(row);
        walk(row.children);
      }
    });
  }

  walk(rows);

  return result;
}

/** 按行 id 找出菜单行（用于取该行的按钮 / 子模块权限） */
function getRowByMenuId(menuId: number): MenuPermissionRow | undefined {
  let result: MenuPermissionRow | undefined;

  function walk(rows: MenuPermissionRow[]) {
    rows.forEach(row => {
      if (row.id === menuId) {
        result = row;
      }
      if (row.children?.length) {
        walk(row.children);
      }
    });
  }

  walk(allRows.value);

  return result;
}

/** 收集配置中标记为必选（首页）的菜单 id */
function collectHomeIds(rows: MenuPermissionRow[]): number[] {
  const ids: number[] = [];

  function walk(list: MenuPermissionRow[]) {
    list.forEach(row => {
      if (row.home) {
        ids.push(row.id);
      }
      if (row.children?.length) {
        walk(row.children);
      }
    });
  }

  walk(rows);

  return ids;
}

/** 必选菜单（首页）id，配置生成后填充；这些菜单默认勾选且不可取消勾选 */
const HOME_IDS = ref<number[]>([]);

/** 确保必选菜单 id 始终在勾选集合内（首页默认必须要） */
function withHome(ids: number[]): number[] {
  const set = new Set(ids);
  HOME_IDS.value.forEach(id => set.add(id));
  return [...set];
}

/** 收集全树所有菜单节点（含子模块）的按钮权限码，供表头全选 / 半选计算 */
// function collectButtonCodes(): string[] {
//   const codes: string[] = [];

//   function walk(rows: MenuPermissionRow[]) {
//     rows.forEach(row => {
//       row.buttons.forEach(item => codes.push(item.code));
//       if (row.children?.length) {
//         walk(row.children);
//       }
//     });
//   }

//   walk(allRows.value);

//   return [...new Set(codes)];
// }

// interface HeaderCheckState {
//   checked: boolean;
//   indeterminate: boolean;
//   disabled: boolean;
// }

/** 表头复选框状态：按某一列权限码的勾选覆盖面计算全选 / 半选 */
// function headerCheckState(allCodes: string[], checks: Record<number, string[]>): HeaderCheckState {
//   const checkedCodes = new Set(Object.values(checks).flat());
//   const checkedCount = allCodes.filter(code => checkedCodes.has(code)).length;

//   return {
//     checked: allCodes.length > 0 && checkedCount === allCodes.length,
//     indeterminate: checkedCount > 0 && checkedCount < allCodes.length,
//     disabled: allCodes.length === 0
//   };
// }

// const buttonHeaderState = computed(() => headerCheckState(allButtonCodes.value, rowButtonChecks.value));

// /** 表头全选：把全树所有菜单节点（含子模块）的按钮权限码写入，取消时整体清空 */
// function toggleAllButtons(checked: boolean) {
//   const next: Record<number, string[]> = {};

//   function walk(rows: MenuPermissionRow[]) {
//     rows.forEach(row => {
//       const codes = row.buttons.map(item => item.code);
//       if (checked && codes.length) {
//         next[row.id] = codes;
//       }
//       if (row.children?.length) {
//         walk(row.children);
//       }
//     });
//   }

//   walk(allRows.value);
//   rowButtonChecks.value = next;
// }

/** 按当前勾选集合递归生成行副本（不污染 allRows） */
function withChecked(row: MenuPermissionRow, checked: Set<number>): MenuPermissionRow {
  return {
    ...row,
    children: row.children?.length ? row.children.map(child => withChecked(child, checked)) : undefined,
    checked: checked.has(row.id)
  };
}

function matchKeyword(row: MenuPermissionRow, kw: string): boolean {
  return [row.title, row.routePath, row.permission].some(field => field?.toLowerCase().includes(kw));
}

/** 命中节点保留其完整子树，未命中但有命中后代的祖先只保留通往命中节点的路径 */
function buildView(rows: MenuPermissionRow[], kw: string, checked: Set<number>): MenuPermissionRow[] {
  if (!kw) {
    return rows.map(row => withChecked(row, checked));
  }

  return rows.reduce<MenuPermissionRow[]>((acc, row) => {
    if (matchKeyword(row, kw)) {
      acc.push(withChecked(row, checked));
      return acc;
    }

    const children = row.children?.length ? buildView(row.children, kw, checked) : [];
    if (children.length) {
      acc.push({ ...withChecked(row, checked), children });
    }

    return acc;
  }, []);
}

/**
 * 打开抽屉时把所有可展开节点展开一次（仅此一次）。
 * 之后的行重建（勾选 / 搜索）不再强制展开：rowid 固定为业务 id 后，
 * vxe 会按 rowid 自动恢复展开态，用户手动折叠的节点不会再被覆盖。
 */
function syncTreeExpand() {
  nextTick(() => {
    const rows = collectExpandableRows(viewRows.value);
    tableRef.value?.setTreeExpand?.(rows, true);
  });
}

function applyView() {
  viewRows.value = buildView(allRows.value, keyword.value.trim().toLowerCase(), new Set(checkedIds.value));
}

/**
 * 打开抽屉时由静态配置（src/constants/menu-permissions.ts）生成权限树：
 * 菜单默认全部勾选（首页必选不可取消），按钮权限与子模块权限默认不勾选。
 */
function loadData() {
  allRows.value = getMenuPermissionTree();
  HOME_IDS.value = collectHomeIds(allRows.value);
  // 角色已存权限码（菜单 permission 码 + 按钮 code），用于回显预勾选
  const authSet = new Set((props.row?.auths ?? []).map(String));

  const checked: number[] = [];
  const btnChecks: Record<number, string[]> = {};

  // 递归：菜单 id 在 authSet、或任一后代命中 → 该菜单勾选（父级随子级联动，提交/回显可往返）
  // 不能用 Array.some：回调首次返回 true 即短路，后续兄弟行（含整棵子树）不再遍历，回显会大面积丢失
  function walk(rows: MenuPermissionRow[]): boolean {
    let anyMatched = false;
    rows.forEach(row => {
      // 菜单勾选基于 permission 码（兼容老数据：仍认数字 id）
      let matched = (row.permission && authSet.has(row.permission)) || authSet.has(String(row.id));
      if (row.children?.length && walk(row.children)) {
        matched = true;
      }
      if (matched) {
        checked.push(row.id);
        anyMatched = true;
        // 只有菜单/子模块本身被勾选，才回显其按钮权限；按钮权限依附于菜单访问权限
        if (row.buttons.length) {
          const hit = row.buttons.filter(b => authSet.has(b.code)).map(b => b.code);
          if (hit.length) btnChecks[row.id] = hit;
        }
      }
    });
    return anyMatched;
  }
  walk(allRows.value);

  checkedIds.value = withHome(checked);
  rowButtonChecks.value = btnChecks;

  // 超管角色：权限树强制全选（所有菜单节点 + 按钮），保证 auths 完整、后端 authMap 校验通过
  if (isSuperRole.value) {
    const allIds: number[] = [];
    const allBtn: Record<number, string[]> = {};
    function walkAll(rows: MenuPermissionRow[]) {
      rows.forEach(row => {
        allIds.push(row.id);
        if (row.buttons.length) allBtn[row.id] = row.buttons.map(b => b.code);
        if (row.children?.length) walkAll(row.children);
      });
    }
    walkAll(allRows.value);
    checkedIds.value = withHome(allIds);
    rowButtonChecks.value = allBtn;
  }

  // 默认展开全部有子节点的菜单（受控展开，applyView 重建后不丢失）
  expandedKeys.value = collectExpandableIds(allRows.value);
  keyword.value = '';
  applyView();
  // 打开抽屉时展开全部（仅这一次）；之后勾选/搜索重建的数据由 vxe 按 rowid 恢复展开态
  syncTreeExpand();
}

/**
 * 勾选变化时只更新「当前可见行」的勾选：
 * 过滤掉的行不在表格数据里，其勾选必须原样保留，否则搜索后提交会丢权限。
 */
function handleSelectionChange(records: Record<string, unknown>[], indeterminates: Record<string, unknown>[] = []) {
  const prevChecked = checkedIds.value;
  const prevSet = new Set(prevChecked);
  const visibleIds = new Set(collectIds(viewRows.value));
  // 半选父节点（部分子节点勾选）也要纳入，否则提交会丢失父菜单的 permission
  const selectedIds = new Set([...records, ...indeterminates].map(record => Number(record.id)));
  // 全选态节点（不含半选）：只有它们才触发「按钮默认全选」
  const fullSelectedIds = new Set(records.map(record => Number(record.id)));
  const next = prevChecked.filter(id => !visibleIds.has(id));

  visibleIds.forEach(id => {
    if (selectedIds.has(id)) {
      next.push(id);
    }
  });

  // 新勾选且处于全选态的菜单：按钮权限默认全选。
  // 仅因子模块联动而半选的父菜单不触发，否则只勾一个子模块就会把整个父菜单的按钮全部勾上。
  next.forEach(id => {
    if (!prevSet.has(id) && fullSelectedIds.has(id)) {
      const row = getRowByMenuId(id);
      if (row?.buttons.length) {
        rowButtonChecks.value[id] = row.buttons.map(btn => btn.code);
      }
    }
  });

  // 取消勾选的菜单：重建映射，剔除其按钮勾选（避免 delete 动态键）
  const cleanedButtons: Record<number, string[]> = {};
  next.forEach(id => {
    if (rowButtonChecks.value[id]) {
      cleanedButtons[id] = rowButtonChecks.value[id];
    }
  });
  rowButtonChecks.value = cleanedButtons;

  checkedIds.value = withHome(next);
}

function handleButtonCheckChange(menuId: number, codes: (string | number)[]) {
  const stringCodes = codes.map(String);
  rowButtonChecks.value[menuId] = stringCodes;

  // 如果勾选了按钮但该菜单未被勾选，则自动勾选该菜单（按钮权限依附于菜单访问权限）
  if (stringCodes.length && !checkedIds.value.includes(menuId)) {
    checkedIds.value = withHome([...checkedIds.value, menuId]);
    applyView();
    return;
  }

  // 如果该菜单所有按钮都被取消，且菜单当前处于勾选状态，则联动取消该菜单勾选；
  // vxe 父子联动会自动处理父级（无其他子级勾选时父级同步取消）。
  if (!stringCodes.length && checkedIds.value.includes(menuId)) {
    checkedIds.value = withHome(checkedIds.value.filter(id => id !== menuId));
    applyView();
  }
}

async function handleSubmit() {
  if (!props.row) return;
  submitting.value = true;
  try {
    // 只输出带 ':' 的权限码：勾选节点的 permission（菜单 + 子模块，子模块也是树上的普通节点）+ 按钮码；数字菜单 id 不落库
    const auths = new Set<string>();
    const addCodes = (codes: string[]) =>
      codes.forEach(code => {
        if (code.includes(':')) auths.add(code);
      });
    checkedIds.value.forEach(id => {
      const row = getRowByMenuId(id);
      if (row?.permission) addCodes([row.permission]);
    });
    Object.values(rowButtonChecks.value).forEach(addCodes);

    await fetchUpdateRoleAuths({ _id: props.row._id, auths: [...auths] });
    window.$message?.success($t('common.updateSuccess'));
    drawerVisible.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

function onToggleTreeExpand({ row, expanded }: { row: { id: number }; expanded: boolean }) {
  if (expanded) {
    if (!expandedKeys.value.includes(row.id)) {
      expandedKeys.value = [...expandedKeys.value, row.id];
    }
  } else {
    expandedKeys.value = expandedKeys.value.filter(id => id !== row.id);
  }
}

watch(
  () => props.show,
  val => {
    if (val) {
      loadData();
    }
  }
);

watch(keyword, () => {
  applyView();
});
</script>

<template>
  <CommonDrawer
    v-model:show="drawerVisible"
    :title="title"
    width="min(92vw, 1000px)"
    :loading="submitting"
    @submit="handleSubmit"
  >
    <div class="h-[calc(100vh_-_160px)] flex-col">
      <Table
        ref="tableRef"
        :columns="columns"
        :data="viewRows"
        :row-config="rowConfig"
        :pagination="null"
        :show-checkbox="true"
        :tree-config="treeConfig"
        :checkbox-config="checkboxConfig"
        :cell-config="autoRowConfig"
        :show-overflow="false"
        @selection-change="handleSelectionChange"
        @toggle-tree-expand="onToggleTreeExpand"
      >
        <template #operation-left>
          <NSpace justify="start" :size="8" wrap>
            <NInput
              v-model:value="keyword"
              size="small"
              clearable
              class="w-300px!"
              :placeholder="$t('page.manage.role.searchMenuPlaceholder')"
            >
              <template #prefix>
                <icon-ic-round-search class="text-icon" />
              </template>
            </NInput>
            <span class="text-12px text-#909399">{{ $t('page.manage.role.permissionTip') }}</span>
          </NSpace>
        </template>

        <!--
 <template #nav-header>
          <span>导航菜单</span>
        </template>
-->

        <!--
 <template #button-header>
          <div class="flex-y-center gap-6px">
            <span>按钮权限</span>
            <NCheckbox
              :checked="buttonHeaderState.checked"
              :indeterminate="buttonHeaderState.indeterminate"
              :disabled="isSuperRole || buttonHeaderState.disabled"
              @update:checked="checked => toggleAllButtons(checked)"
            />
          </div>
        </template>
-->

        <template #title="{ row: menuRow }">
          <div class="flex-y-center gap-6px">
            <IconRenderer
              v-if="(menuRow as MenuPermissionRow).icon"
              :icon="(menuRow as MenuPermissionRow).icon!"
              class="text-icon"
            />
            <span>{{ (menuRow as MenuPermissionRow).title }}</span>
          </div>
        </template>

        <template #buttons="{ row: menuRow }">
          <NCheckboxGroup
            v-if="(menuRow as MenuPermissionRow).buttons.length"
            :value="rowButtonChecks[(menuRow as MenuPermissionRow).id] || []"
            :disabled="isSuperRole"
            @update:value="val => handleButtonCheckChange((menuRow as MenuPermissionRow).id, val)"
          >
            <NSpace :size="8" wrap>
              <NCheckbox v-for="btn in (menuRow as MenuPermissionRow).buttons" :key="btn.code" :value="btn.code">
                {{ btn.label }}
              </NCheckbox>
            </NSpace>
          </NCheckboxGroup>
          <span v-else>--</span>
        </template>
      </Table>
    </div>
  </CommonDrawer>
</template>

<style scoped>
/* 仅借 tree-config.showLine 触发 vxe 行高实测，视觉上隐藏树形引导线（测量对象是 .vxe-cell--wrapper，不受影响） */
:deep(.vxe-tree--line-wrapper) {
  display: none;
}
</style>
