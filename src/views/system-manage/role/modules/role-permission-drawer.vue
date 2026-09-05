<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { VxeTablePropTypes } from 'vxe-table';
import { $t } from '@/locales';
import { fetchAssignRoleMenu, fetchGetMenuList, fetchGetRoleMenuTree } from '@/service/api/system-manage';
import { getMenuButtons, type ButtonPermission } from '@/constants/button-permissions';
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

/** 权限树节点，字段由菜单详情（/system/menu/list）补齐后用于表格展示 */
interface RoleMenuRow extends Api.SystemManage.RoleMenuNode {
  children?: RoleMenuRow[];
  menuType?: Api.SystemManage.MenuType;
  routePath?: string;
  permission?: string;
  icon?: string;
  /** vxe 树表勾选回填字段，配合 checkbox-config.checkField 使用 */
  checked?: boolean;
  /** 该菜单（界面）可分配的操作按钮权限 */
  buttons?: ButtonPermission[];
  /** 首页等必选菜单：默认勾选且不可取消 */
  home?: boolean;
}

const drawerVisible = computed({
  get: () => props.show,
  set: val => emit('update:show', val)
});

const title = computed(() =>
  props.row ? `${$t('page.manage.role.permission')} - ${props.row.roleName}` : $t('page.manage.role.permission')
);

const submitting = ref(false);
const loading = ref(false);
const tableRef = ref<{ setTreeExpand?: (rows: any[], expanded: boolean) => void } | null>(null);
/** 每个菜单 id 勾选的按钮权限码，独立于过滤/搜索，避免搜索后丢失 */
const rowButtonChecks = ref<Record<number, string[]>>({});

/** 完整权限树（权威数据源） */
const allRows = ref<RoleMenuRow[]>([]);
/** 当前表格渲染的行（按关键字过滤后的视图） */
const viewRows = ref<RoleMenuRow[]>([]);
/** 权威勾选集合，过滤掉的行也保留在这里，避免搜索时丢失勾选 */
const checkedIds = ref<number[]>([]);
const keyword = ref('');

const allIds = computed(() => collectIds(allRows.value));

const isAllChecked = computed(() => allIds.value.length > 0 && checkedIds.value.length >= allIds.value.length);

const menuTypeTag: Record<Api.SystemManage.MenuType, 'warning' | 'success'> = {
  catalog: 'warning',
  menu: 'success'
};

const menuTypeLabel = computed<Record<Api.SystemManage.MenuType, string>>(() => ({
  catalog: $t('page.manage.menu.catalog'),
  menu: $t('page.manage.menu.menu')
}));

const columns = computed<VxeColumnRenderColumn[]>(() => [
  { key: 'title', title: $t('page.manage.menu.menuName'), treeNode: true, minWidth: 220, sortable: false },
  { key: 'menuType', title: $t('page.manage.menu.type'), width: 90, align: 'center', sortable: false },
  { key: 'routePath', title: $t('page.manage.menu.routePath'), minWidth: 180, sortable: false },
  { key: 'permission', title: $t('page.manage.menu.permission'), minWidth: 180, sortable: false },
  { key: 'buttons', title: '操作权限', minWidth: 280, sortable: false }
]);

const expandedKeys = ref<number[]>([]);

/** 行高自适应：vxe 中 row-config.height=0 即「自适应」（>0 才是固定行高），让按钮较多的行自动撑高 */
const autoRowConfig = { height: 'auto' } as any;

const treeConfig = computed<VxeTablePropTypes.TreeConfig>(() => ({
  rowField: 'id',
  childrenField: 'children',
  expandRowKeys: expandedKeys.value,
  expandAll: false
}));

/**
 * checkStrictly: false -> 父子联动（勾父选子、子部分选时父半选），与原 NTree cascade 语义一致
 * checkField: 'checked' -> 用行上的 checked 字段回填初始勾选
 */
const checkboxConfig = computed<VxeTablePropTypes.CheckboxConfig>(() => ({
  checkStrictly: false,
  checkField: 'checked',
  // 首页等必选菜单禁用勾选（保持默认勾选，不可取消）
  checkMethod: (params: any) => !params?.row?.home
}));

function collectIds(rows: RoleMenuRow[]): number[] {
  const ids: number[] = [];

  function walk(list: RoleMenuRow[]) {
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
function collectExpandableIds(rows: RoleMenuRow[]): number[] {
  const ids: number[] = [];

  function walk(list: RoleMenuRow[]) {
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
function collectExpandableRows(rows: RoleMenuRow[]): RoleMenuRow[] {
  const result: RoleMenuRow[] = [];

  function walk(list: RoleMenuRow[]) {
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

/** 根据菜单 id 找出该菜单下可分配的所有按钮权限（用于勾选菜单时默认全选按钮） */
function getButtonsByMenuId(menuId: number): ButtonPermission[] {
  let result: ButtonPermission[] = [];

  function walk(rows: RoleMenuRow[]) {
    rows.forEach(row => {
      if (row.id === menuId) {
        result = row.buttons ?? [];
      }
      if (row.children?.length) {
        walk(row.children);
      }
    });
  }

  walk(allRows.value);

  return result;
}

/** 必选菜单（首页）id，加载后填充；这些菜单默认勾选且不可取消勾选 */
const HOME_IDS = ref<number[]>([]);

/** 确保必选菜单 id 始终在勾选集合内（首页默认必须要） */
function withHome(ids: number[]): number[] {
  const set = new Set(ids);
  HOME_IDS.value.forEach(id => set.add(id));
  return [...set];
}

/** 递归收集「首页」菜单节点 id（按 title 或 routePath 识别，不依赖固定 id） */
function findHomeIds(nodes: Api.SystemManage.RoleMenuNode[], menuMap: Map<number, Api.SystemManage.Menu>): number[] {
  const ids: number[] = [];

  function walk(list: Api.SystemManage.RoleMenuNode[]) {
    list.forEach(node => {
      const detail = menuMap.get(node.id);
      if (node.title === '首页' || detail?.routePath === '/home') {
        ids.push(node.id);
      }
      if (node.children?.length) {
        walk(node.children);
      }
    });
  }

  walk(nodes);

  return ids;
}

/** 拍平菜单列表（生产环境返回嵌套 children）为 id -> 菜单详情，用于补齐展示字段 */
function flattenMenus(list: Api.SystemManage.Menu[]): Map<number, Api.SystemManage.Menu> {
  const map = new Map<number, Api.SystemManage.Menu>();

  function walk(items: Api.SystemManage.Menu[]) {
    items.forEach(item => {
      map.set(item.id, item);
      if (item.children?.length) {
        walk(item.children);
      }
    });
  }

  walk(list);

  return map;
}

/**
 * 权限树是「可分配范围」的权威来源：只展示权限树中的菜单，
 * 展示字段从菜单详情补齐，取不到时留空（表格渲染为 -）。
 * 同时按菜单的 permission / routePath 从前端配置补齐该界面所需的按钮权限。
 */
function mergeRows(
  nodes: Api.SystemManage.RoleMenuNode[],
  menuMap: Map<number, Api.SystemManage.Menu>,
  checked: Set<number>
): RoleMenuRow[] {
  return nodes.map(node => {
    const detail = menuMap.get(node.id);
    const children = node.children?.length ? mergeRows(node.children, menuMap, checked) : undefined;

    return {
      ...node,
      title: detail?.menuName ?? node.title,
      children,
      menuType: detail?.menuType,
      routePath: detail?.routePath,
      permission: detail?.permission,
      icon: detail?.icon,
      buttons: getMenuButtons({ permission: detail?.permission, routePath: detail?.routePath }),
      checked: checked.has(node.id),
      // 首页（路由 /home）为必选菜单，不可取消勾选
      home: detail?.routePath === '/home' || node.title === '首页'
    };
  });
}

/** 按当前勾选集合递归生成行副本（不污染 allRows） */
function withChecked(row: RoleMenuRow, checked: Set<number>): RoleMenuRow {
  return {
    ...row,
    children: row.children?.length ? row.children.map(child => withChecked(child, checked)) : undefined,
    checked: checked.has(row.id)
  };
}

function matchKeyword(row: RoleMenuRow, kw: string): boolean {
  return [row.title, row.routePath, row.permission].some(field => field?.toLowerCase().includes(kw));
}

/** 命中节点保留其完整子树，未命中但有命中后代的祖先只保留通往命中节点的路径 */
function buildView(rows: RoleMenuRow[], kw: string, checked: Set<number>): RoleMenuRow[] {
  if (!kw) {
    return rows.map(row => withChecked(row, checked));
  }

  return rows.reduce<RoleMenuRow[]>((acc, row) => {
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

function syncTreeExpand() {
  nextTick(() => {
    const rows = collectExpandableRows(viewRows.value);
    tableRef.value?.setTreeExpand?.(rows, true);
  });
}

function applyView() {
  viewRows.value = buildView(allRows.value, keyword.value.trim().toLowerCase(), new Set(checkedIds.value));
  syncTreeExpand();
}

async function loadData() {
  if (!props.row) return;
  loading.value = true;
  try {
    const [treeResult, menuResult] = await Promise.allSettled([
      fetchGetRoleMenuTree(props.row.id) as Promise<Api.SystemManage.RoleMenuTree>,
      fetchGetMenuList({}) as Promise<Api.SystemManage.MenuList>
    ]);

    if (treeResult.status === 'rejected') {
      window.$message?.error($t('page.manage.role.loadMenuFailed'));
      drawerVisible.value = false;
      return;
    }

    // 菜单详情只用于补齐展示字段，失败时降级为只显示菜单名称
    const menuMap = menuResult.status === 'fulfilled' ? flattenMenus(menuResult.value) : new Map();
    const homeIds = findHomeIds(treeResult.value.menus ?? [], menuMap);
    HOME_IDS.value = homeIds;
    const checked = new Set(treeResult.value.checkedMenuIds ?? []);
    // 首页等必选菜单强制勾选
    homeIds.forEach(id => checked.add(id));
    allRows.value = mergeRows(treeResult.value.menus ?? [], menuMap, checked);
    checkedIds.value = withHome([...checked]);
    // 默认展开全部有子节点的菜单（受控展开，applyView 重建后不丢失）
    expandedKeys.value = collectExpandableIds(allRows.value);
    // 角色已分配的按钮权限需后端返回 checkedButtonCodes 才能回显，目前先清空
    rowButtonChecks.value = {};
    keyword.value = '';
    applyView();
  } finally {
    loading.value = false;
  }
}

function toggleCheckAll() {
  const all = isAllChecked.value ? [] : [...allIds.value];
  checkedIds.value = withHome(all);
  // 全选时所有菜单的按钮权限默认全选；取消全选时清空
  if (all.length) {
    all.forEach(id => {
      const btns = getButtonsByMenuId(id);
      if (btns.length) {
        rowButtonChecks.value[id] = btns.map(btn => btn.code);
      }
    });
  } else {
    rowButtonChecks.value = {};
  }
  applyView();
}

/**
 * 勾选变化时只更新「当前可见行」的勾选：
 * 过滤掉的行不在表格数据里，其勾选必须原样保留，否则搜索后提交会丢权限。
 */
function handleSelectionChange(records: Record<string, unknown>[], indeterminates: Record<string, unknown>[] = []) {
  const prevChecked = checkedIds.value;
  const prevSet = new Set(prevChecked);
  const visibleIds = new Set(collectIds(viewRows.value));
  // 半选父节点（部分子节点勾选）也要纳入，否则提交 menuIds 会丢失父菜单
  const selectedIds = new Set([...records, ...indeterminates].map(record => Number(record.id)));
  const next = prevChecked.filter(id => !visibleIds.has(id));

  visibleIds.forEach(id => {
    if (selectedIds.has(id)) {
      next.push(id);
    }
  });

  // 新勾选的菜单：按钮权限默认全选
  next.forEach(id => {
    if (!prevSet.has(id)) {
      const btns = getButtonsByMenuId(id);
      if (btns.length) {
        rowButtonChecks.value[id] = btns.map(btn => btn.code);
      }
    }
  });

  // 取消勾选的菜单：重建映射，剔除其按钮权限勾选（避免 delete 动态键）
  const cleaned: Record<number, string[]> = {};
  next.forEach(id => {
    const codes = rowButtonChecks.value[id];
    if (codes) {
      cleaned[id] = codes;
    }
  });
  rowButtonChecks.value = cleaned;

  checkedIds.value = withHome(next);
}

function handleButtonCheckChange(menuId: number, codes: (string | number)[]) {
  const stringCodes = codes.map(String);
  rowButtonChecks.value[menuId] = stringCodes;

  // 如果勾选了按钮但该菜单未被勾选，则自动勾选该菜单（按钮权限依附于菜单访问权限）
  if (stringCodes.length && !checkedIds.value.includes(menuId)) {
    checkedIds.value = withHome([...checkedIds.value, menuId]);
    applyView();
  }
}

async function handleSubmit() {
  if (!props.row) return;
  submitting.value = true;
  try {
    // 收集所有菜单勾选的按钮权限码（去重）
    const buttonCodes = [...new Set(Object.values(rowButtonChecks.value).flat())];
    await fetchAssignRoleMenu({ roleId: props.row.id, menuIds: checkedIds.value, buttonCodes });
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
    width="min(82vw, 1100px)"
    :loading="submitting"
    @submit="handleSubmit"
  >
    <div class="h-[calc(100vh_-_160px)] flex-col">
      <Table
        ref="tableRef"
        :columns="columns"
        :data="viewRows"
        :loading="loading"
        :pagination="null"
        :show-checkbox="true"
        :tree-config="treeConfig"
        :checkbox-config="checkboxConfig"
        :row-config="autoRowConfig"
        @selection-change="handleSelectionChange"
        @toggle-tree-expand="onToggleTreeExpand"
      >
        <template #operation-left>
          <NSpace justify="start" :size="8" wrap>
            <NButton size="small" tertiary :disabled="allIds.length === 0" @click="toggleCheckAll">
              {{ isAllChecked ? $t('common.unselectAll') : $t('common.selectAll') }}
            </NButton>
            <NInput
              v-model:value="keyword"
              size="small"
              clearable
              class="w-260px"
              :placeholder="$t('page.manage.role.searchMenuPlaceholder')"
            >
              <template #prefix>
                <icon-ic-round-search class="text-icon" />
              </template>
            </NInput>
            <span class="text-12px text-#909399">{{ $t('page.manage.role.permissionTip') }}</span>
          </NSpace>
        </template>

        <template #title="{ row: menuRow }">
          <div class="flex-y-center gap-6px">
            <IconRenderer
              v-if="(menuRow as RoleMenuRow).icon"
              :icon="(menuRow as RoleMenuRow).icon!"
              class="text-icon"
            />
            <span>{{ (menuRow as RoleMenuRow).title }}</span>
          </div>
        </template>

        <template #menuType="{ row: menuRow }">
          <NTag
            v-if="(menuRow as RoleMenuRow).menuType"
            size="small"
            :type="menuTypeTag[(menuRow as RoleMenuRow).menuType!]"
          >
            {{ menuTypeLabel[(menuRow as RoleMenuRow).menuType!] }}
          </NTag>
          <span v-else>-</span>
        </template>

        <template #routePath="{ row: menuRow }">
          <span>{{ (menuRow as RoleMenuRow).routePath || '-' }}</span>
        </template>

        <template #permission="{ row: menuRow }">
          <span>{{ (menuRow as RoleMenuRow).permission || '-' }}</span>
        </template>

        <template #buttons="{ row: menuRow }">
          <NCheckboxGroup
            v-if="
              getMenuButtons({
                permission: (menuRow as RoleMenuRow).permission,
                routePath: (menuRow as RoleMenuRow).routePath
              }).length
            "
            :value="rowButtonChecks[(menuRow as RoleMenuRow).id] || []"
            @update:value="val => handleButtonCheckChange((menuRow as RoleMenuRow).id, val)"
          >
            <NSpace :size="8" wrap>
              <NCheckbox
                v-for="btn in getMenuButtons({
                  permission: (menuRow as RoleMenuRow).permission,
                  routePath: (menuRow as RoleMenuRow).routePath
                })"
                :key="btn.code"
                :value="btn.code"
              >
                {{ btn.label }}
              </NCheckbox>
            </NSpace>
          </NCheckboxGroup>
          <span v-else>-</span>
        </template>
      </Table>
    </div>
  </CommonDrawer>
</template>
