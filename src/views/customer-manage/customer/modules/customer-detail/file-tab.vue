<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import dayjs from 'dayjs';
import { fetchDeleteCustomerFile, fetchGetCustomerFileList } from '@/service/api/customer-file';
import Upload from '@/components/Upload/index.vue';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';

defineOptions({ name: 'FileTab' });

interface Props {
  customerId: string;
}

const props = defineProps<Props>();

const keyword = ref('');

const { data, loading, columns, getData, resetColumns, persistColumns, columnConfigs } = useVxeTable<
  { list: Api.SystemManage.CustomerFileItem[]; total: number },
  Api.SystemManage.CustomerFileItem
>({
  // /file/query 走 queryAllCommon 全量返回，不分页（表格内滚动）；keyword 按文件名称过滤
  api: async () => {
    const { data: res, error } = await fetchGetCustomerFileList(props.customerId, keyword.value);
    const list = !error && res?.list ? res.list : [];

    return { list, total: list.length };
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      { key: 'name', title: $t('page.manage.customer.detail.fileName'), visible: true, minWidth: 240, sortable: false },
      {
        key: 'creator',
        title: $t('page.manage.customer.detail.uploader'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'createDate',
        title: $t('page.manage.customer.detail.uploadTime'),
        visible: true,
        width: 160,
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'customer-detail-file'
});

function formatDate(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '--';
}

const configVisible = ref(false);

/* ------------------------------ 批量上传 ------------------------------ */

/** 公共 Upload 组件 refId 模式：每个文件走 /upload/file 入 File 附件库，成功即刷新列表 */
function handleUploadSuccess() {
  getData();
}

async function handleDelete(row: Api.SystemManage.CustomerFileItem) {
  const { error } = await fetchDeleteCustomerFile(row._id);
  if (error) return;

  window.$message?.success($t('common.deleteSuccess'));
  getData();
}
</script>

<template>
  <div class="h-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :show-seq="true"
      :show-checkbox="false"
      :show-action="true"
      :action-width="110"
      @refresh="getData"
    >
      <template #operation-left>
        <Upload :ref-id="customerId" :dest="7" list-type="file" :max="50" @success="handleUploadSuccess">
          <NButton size="small" type="primary" ghost>
            <template #icon>
              <icon-mdi-upload class="text-icon" />
            </template>
            {{ $t('page.manage.customer.detail.batchUpload') }}
          </NButton>
        </Upload>
      </template>

      <template #name="{ row }">
        <a v-if="row.url" :href="row.url" target="_blank" rel="noopener noreferrer" class="text-primary">
          {{ row.name }}
        </a>
        <span v-else>{{ row.name }}</span>
      </template>

      <template #createDate="{ row }">
        <span>{{ formatDate(row.createDate) }}</span>
      </template>

      <template #action="{ row }">
        <a v-if="row.url" :href="row.url" target="_blank" rel="noopener noreferrer" class="text-primary">
          {{ $t('page.manage.customer.detail.download') }}
        </a>
        <NPopconfirm @positive-click="handleDelete(row)">
          <template #trigger>
            <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />
  </div>
</template>

<style scoped></style>
