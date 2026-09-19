<script setup lang="ts">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import { fetchDeleteInputFormat, fetchGetInputFormatList, fetchPatchInputFormat } from '@/service/api/input-format';
import InputFormatDrawer from './input-format-drawer.vue';
import { buildInputFormatColumns } from './config';

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
  // 列配置见 ./config.ts（列持久化 cacheKey 仍由本页管理）
  columns: () => buildInputFormatColumns(),
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

/** 列表停用 / 启用：部分更新，name 必须随行回传（否则后端重名校验会误判，见 PatchParams 注释） */
async function handleToggleStatus(row: Api.InputFormat.OrderTemplate) {
  const { error } = await fetchPatchInputFormat({
    _id: row._id,
    name: row.name,
    status: row.status === 1 ? 0 : 1
  });
  if (error) return;

  window.$message?.success($t('common.updateSuccess'));
  getData();
}

/** 列表设为默认：后端会把其它格式的 isDefault 清 0 */
async function handleSetDefault(row: Api.InputFormat.OrderTemplate) {
  const { error } = await fetchPatchInputFormat({ _id: row._id, name: row.name, isDefault: 1 });
  if (error) return;

  window.$message?.success($t('common.updateSuccess'));
  getData();
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
      :action-width="200"
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
        <LButton type="primary" @click="openCreate">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </LButton>
      </template>
      <template #operation-right="{ refresh }">
        <LButton circle @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </LButton>
        <TableColumnConfig
          v-model:visible="configVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <LButton type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</LButton>
        <LButton type="primary" text :disabled="row.isDefault === 1" @click="handleSetDefault(row)">
          {{ $t('page.manage.setting.inputFormat.setDefault') }}
        </LButton>
        <LButton
          :type="row.status === 1 ? 'warning' : 'success'"
          :popconfirm="row.status === 1 ? $t('common.confirmDisable') : $t('common.confirmEnable')"
          text
          @positive-click="handleToggleStatus(row)"
        >
          {{ row.status === 1 ? $t('common.disable') : $t('common.enable') }}
        </LButton>
        <LButton type="error" text popconfirm @positive-click="confirmDelete(row)">
          {{ $t('common.delete') }}
        </LButton>
      </template>
    </Table>

    <InputFormatDrawer v-model:show="drawerVisible" :row="editRow" @submitted="getData" />
  </div>
</template>
