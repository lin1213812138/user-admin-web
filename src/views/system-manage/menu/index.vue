<script setup lang="ts">
import { computed, ref } from 'vue';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { $t } from '@/locales';
import { fetchDeleteMenu, fetchGetMenuList } from '@/service/api/system-manage';
import MenuOperateDrawer from './modules/menu-operate-drawer.vue';

type MenuItem = Api.SystemManage.Menu;

/** build a nested tree from the flat menu list (for the operate drawer's parent selector) */
function buildMenuTree(list: MenuItem[]): MenuItem[] {
  const map = new Map<number, MenuItem>();
  list.forEach(item => map.set(item.id, { ...item, children: [] }));

  const tree: MenuItem[] = [];
  map.forEach(item => {
    const parent = item.parentId !== 0 ? map.get(item.parentId) : undefined;
    if (parent) {
      parent.children!.push(item);
    } else {
      tree.push(item);
    }
  });

  return tree;
}

const { data, loading, columns, columnConfigs, getData, persistColumns } = useVxeTable<
  Api.SystemManage.MenuList,
  MenuItem
>({
  api: () => fetchGetMenuList({}) as Promise<Api.SystemManage.MenuList>,
  transform: r => ({ records: r, total: r.length }),
  columns: () =>
    [
      {
        key: 'menuName',
        title: $t('page.manage.menu.menuName'),
        type: 'detail',
        // mark this column as the vxe-table tree-node column so it renders
        // the indent and ▷ expand arrow; required because vxe-table does not
        // auto-pick a tree-node column.
        treeNode: true,
        visible: true,
        minWidth: 200,
        sortable: false
      },
      {
        key: 'menuType',
        title: $t('page.manage.menu.type'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      {
        key: 'icon',
        title: $t('page.manage.menu.icon'),
        visible: true,
        width: 120,
        align: 'center',
        sortable: false
      },
      {
        key: 'routePath',
        title: $t('page.manage.menu.routePath'),
        visible: true,
        minWidth: 180,
        sortable: false
      },
      {
        key: 'componentPath',
        title: $t('page.manage.menu.componentPath'),
        visible: true,
        minWidth: 180,
        sortable: false
      },
      {
        key: 'sort',
        title: $t('page.manage.menu.sort'),
        visible: true,
        width: 80,
        align: 'center',
        sortable: false
      },
      {
        key: 'status',
        title: $t('page.manage.menu.status'),
        type: 'status',
        visible: true,
        width: 100,
        fixed: 'right',
        align: 'center',
        sortable: false
      },
      {
        key: 'createTime',
        title: $t('page.manage.menu.createTime'),
        visible: true,
        width: 170,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'system-manage-menu'
});

const drawerVisible = ref(false);
const operateType = ref<'add' | 'edit'>('add');
const editingId = ref<number | null>(null);
const subParentId = ref<number | null>(null);
const configVisible = ref(false);

function openDrawer(mode: 'add' | 'edit', row?: MenuItem) {
  operateType.value = mode;
  editingId.value = row ? row.id : null;
  drawerVisible.value = true;
}

function openSubDrawer(row: MenuItem) {
  operateType.value = 'add';
  editingId.value = null;
  subParentId.value = row.id;
  drawerVisible.value = true;
}

async function handleDelete(ids: number[]) {
  await fetchDeleteMenu(ids);
  window.$message?.success($t('common.deleteSuccess'));
  getData();
}

// Tree rendering config for vxe-table v4:
// - `rowField`: required to key tree nodes; without it vxe only iterates the
//   top-level array and ignores nested `children`.
// - `childrenField` + `expandAll`: render the nested `children` (built from
//   `parentId` via `buildMenuTree`) and expand every level by default.
// Note: vxe-table does NOT auto-pick a tree-node column. The column that
// carries the indent and ▷ arrow is designated by `treeNode: true` on the
// column itself — see the `menuName` column in `columns` below. The `Table`
// wrapper forwards that flag to `<vxe-column :tree-node>`.
const treeConfig = computed(() => ({
  rowField: 'id',
  childrenField: 'children',
  expandAll: true
}));

/** nested menu tree derived from the flat data, fed to the operate drawer */
const menuTree = computed<MenuItem[]>(() => buildMenuTree(data.value));

const menuTypeTag: Record<Api.SystemManage.MenuType, 'warning' | 'success'> = {
  catalog: 'warning',
  menu: 'success'
};

const menuTypeLabel: Record<Api.SystemManage.MenuType, string> = {
  catalog: $t('page.manage.menu.catalog'),
  menu: $t('page.manage.menu.menu')
};
</script>

<template>
  <div class="h-full w-full flex flex-col gap-12px p-16px">
    <div class="flex-1 min-h-0">
      <Table
        :columns="columns"
        :data="menuTree"
        :loading="loading"
        :pagination="null"
        :tree-config="treeConfig"
        :show-action="true"
        :show-seq="true"
        :action-width="180"
        @refresh="getData"
      >
        <template #operation-left>
          <NSpace justify="start" wrap>
            <NButton size="small" type="primary" ghost @click="openDrawer('add')">
              <template #icon>
                <icon-ic-round-plus class="text-icon" />
              </template>
              {{ $t('common.add') }}
            </NButton>
          </NSpace>
        </template>
        <template #operation-right>
          <NSpace justify="end" wrap>
            <NButton size="small" @click="configVisible = true">
              <template #icon>
                <icon-mdi-cog class="text-icon" />
              </template>
              {{ $t('common.columnSetting') }}
            </NButton>
            <NButton size="small" @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
            </NButton>
          </NSpace>
        </template>
        <template #menuType="{ row }">
          <NTag size="small" :type="menuTypeTag[(row as MenuItem).menuType]">
            {{ menuTypeLabel[(row as MenuItem).menuType] }}
          </NTag>
        </template>
        <template #icon="{ row }">
          <IconRenderer v-if="row.icon" :icon="row.icon" class="text-icon" />
          <span v-else>-</span>
        </template>
        <template #action="{ row }">
          <NButton size="small" type="primary" text @click="openSubDrawer(row)">
            {{ $t('page.manage.menu.addSubMenu') }}
          </NButton>
          <NButton size="small" type="primary" text @click="openDrawer('edit', row)">
            {{ $t('common.edit') }}
          </NButton>
          <NPopconfirm @positive-click="handleDelete([row.id])">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </template>
      </Table>

      <TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" @confirm="persistColumns" />
    </div>

    <MenuOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingId"
      :parent-id="subParentId"
      :tree-data="menuTree"
      @submitted="getData"
    />
  </div>
</template>
