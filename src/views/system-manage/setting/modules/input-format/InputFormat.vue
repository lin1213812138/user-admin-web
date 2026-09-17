<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteInputFormat, fetchGetInputFormatList } from '@/service/api/input-format';
import InputFormatDrawer from './input-format-drawer.vue';

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.InputFormat.List,
  Api.InputFormat.OrderTemplate
>({
  // 真实接口走 flat request，这里解包 { data, error }，失败时返回空列表（错误提示由 request 拦截器统一弹出）
  api: async ({ current, size }) => {
    // scene 必传：不传时后端会强制 status=1 并按角色可见格式过滤，管理端要看到全部（含停用）
    const { data: res, error } = await fetchGetInputFormatList({ scene: 1, page: current, size });

    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  // wms-user 返回 ret:{ list, total }，映射为表格需要的 records/total
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.manage.setting.inputFormat.name'),
        type: 'detail',
        visible: true,
        minWidth: 180,
        sortable: false
      },
      {
        key: 'customerEnable',
        title: $t('page.manage.setting.inputFormat.customerEnable'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      {
        key: 'isDefault',
        title: $t('page.manage.setting.inputFormat.isDefault'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      {
        key: 'order',
        title: $t('page.manage.setting.inputFormat.order'),
        visible: true,
        width: 80,
        align: 'center',
        sortable: false
      },
      { key: 'note', title: $t('common.remark'), visible: true, minWidth: 220, sortable: false },
      {
        key: 'status',
        title: $t('common.status'),
        type: 'status',
        visible: true,
        width: 100,
        fixed: 'right',
        align: 'center',
        sortable: false
      },
      {
        key: 'updateBy',
        title: $t('page.manage.setting.inputFormat.lastOperation'),
        visible: true,
        width: 100,
        fixed: 'right',
        align: 'center',
        sortable: false
      },
      {
        key: 'updateDate',
        title: $t('page.manage.setting.inputFormat.lastUpdateTime'),
        visible: true,
        width: 170,
        fixed: 'right',
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  // 新增两列：列配置缓存以缓存数组为准（useVxeTable 按缓存 map），升版本避免老缓存把新列挡住
  cacheKey: 'setting-input-format-v3'
});

const configVisible = ref(false);

/** 毫秒时间戳格式化展示（最后更新时间） */
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

/** 是 / 否标签：是-绿色、否-灰色 */
function flagTagType(value: Api.Common.EnableStatus) {
  return value === 1 ? 'success' : 'default';
}

function confirmDelete(row: Api.InputFormat.OrderTemplate) {
  window.$dialog?.warning({
    title: $t('common.delete'),
    content: $t('common.confirmDelete'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const { error } = await fetchDeleteInputFormat(row._id);

      // 失败提示由 request 拦截器统一弹出
      if (error) return;

      getData();
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

// ---- 新增/编辑交给独立组件 InputFormatDrawer（列表与表单解耦） ----
const drawerVisible = ref(false);
const editRow = ref<Api.InputFormat.OrderTemplate | null>(null);

function openCreate() {
  editRow.value = null;
  drawerVisible.value = true;
}
function openEdit(row: Api.InputFormat.OrderTemplate) {
  editRow.value = row;
  drawerVisible.value = true;
}
</script>

<template>
  <div class="h-full w-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      :show-checkbox="true"
      :show-action="true"
      :action-width="130"
      @refresh="getData"
      @page-change="handlePageChange"
    >
      <template #customerEnable="{ row }">
        <NTag size="small" :bordered="false" :type="flagTagType(row.customerEnable)">
          {{
            row.customerEnable === 1
              ? $t('page.manage.setting.inputFormat.yes')
              : $t('page.manage.setting.inputFormat.no')
          }}
        </NTag>
      </template>
      <template #isDefault="{ row }">
        <NTag size="small" :bordered="false" :type="flagTagType(row.isDefault)">
          {{
            row.isDefault === 1 ? $t('page.manage.setting.inputFormat.yes') : $t('page.manage.setting.inputFormat.no')
          }}
        </NTag>
      </template>
      <template #updateBy="{ row }">{{ row.updateBy || '--' }}</template>
      <template #updateDate="{ row }">{{ formatDateTime(row.updateDate) }}</template>
      <template #operation-left>
        <NButton size="small" type="primary" ghost @click="openCreate">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </NButton>
      </template>
      <template #operation-right="{ refresh }">
        <NButton size="small" @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </NButton>
        <TableColumnConfig
          v-model:visible="configVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
        <!-- 内置格式（buildIn=1）由客户端依赖，不提供删除入口 -->
        <NPopconfirm v-if="row.buildIn !== 1" @positive-click="confirmDelete(row)">
          <template #trigger>
            <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <InputFormatDrawer v-model:show="drawerVisible" :row="editRow" @submitted="getData" />
  </div>
</template>
