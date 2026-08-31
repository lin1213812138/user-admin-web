<script setup lang="ts">
import { computed, ref } from 'vue';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { $t } from '@/locales';
import { fetchDeleteMenu, fetchGetMenuList } from '@/service/api/system-manage';
import MenuOperateDrawer from './modules/menu-operate-drawer.vue';

type MenuItem = Api.SystemManage.Menu;

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
  transform: r => {
    const tree = buildMenuTree(r);
    return { records: tree, total: tree.length };
  },
  columns: () =>
    [
      {
        key: 'menuName',
        title: $t('page.manage.menu.menuName'),
        type: 'detail',
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
const configVisible = ref(false);

function openDrawer(mode: 'add' | 'edit', row?: MenuItem) {
  operateType.value = mode;
  editingId.value = row ? row.id : null;
  drawerVisible.value = true;
}

async function handleDelete(ids: number[]) {
  await fetchDeleteMenu(ids);
  window.$message?.success($t('common.deleteSuccess'));
  getData();
}

const treeConfig = computed(() => ({ transform: true, rowField: 'id', parentField: 'parentId', expandAll: false }));

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
  <div class="h-full w-full p-16px">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="null"
      :tree-config="treeConfig"
      :show-action="true"
      :action-width="140"
      @refresh="getData"
    >
      <template #operation-left>
        <NButton type="primary" @click="openDrawer('add')">
          <template #icon>
            <SvgIcon icon="mdi:plus" />
          </template>
          {{ $t('common.add') }}
        </NButton>
      </template>
      <template #operation-right>
        <TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" @confirm="persistColumns" />
        <NButton quaternary type="primary" @click="getData">
          <template #icon>
            <SvgIcon icon="mdi:refresh" />
          </template>
          {{ $t('common.refresh') }}
        </NButton>
      </template>
      <template #menuType="{ row }">
        <NTag size="small" :type="menuTypeTag[(row as MenuItem).menuType]">
          {{ menuTypeLabel[(row as MenuItem).menuType] }}
        </NTag>
      </template>
      <template #icon="{ row }">
        <SvgIcon v-if="row.icon" :icon="row.icon" />
        <span v-else>-</span>
      </template>
      <template #action="{ row }">
        <NButton quaternary type="primary" @click="openDrawer('edit', row)">
          {{ $t('common.edit') }}
        </NButton>
        <NPopconfirm @positive-click="handleDelete([row.id])">
          <template #trigger>
            <NButton quaternary type="error">{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <MenuOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingId"
      :tree-data="data"
      @submitted="getData"
    />
  </div>
</template>
