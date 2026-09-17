<script setup lang="ts">
import { $t } from '@/locales';
import dayjs from 'dayjs';
import { fetchGetOpLogList } from '@/service/api/op-log';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';

defineOptions({ name: 'OpLogTab' });

interface Props {
  /** 详情客户（/op-log/query 的 keyword 只匹配 refNames，这里传客户名称） */
  customer: Api.SystemManage.Customer;
}

const props = defineProps<Props>();

const { data, loading, columns, getData } = useVxeTable<Api.SystemManage.OpLogList, Api.SystemManage.OpLog>({
  // 不分页：一次拉全量（size 取大值），表格内滚动
  api: async () => {
    const { data: res, error } = await fetchGetOpLogList({
      page: 1,
      size: 9999,
      keyword: props.customer.name?.trim() || undefined
    });

    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'creator',
        title: $t('page.manage.customer.detail.operator'),
        visible: true,
        width: 160,
        sortable: false
      },
      {
        key: 'name',
        title: $t('page.manage.customer.detail.operationLog'),
        visible: true,
        minWidth: 320,
        sortable: false
      },
      {
        key: 'createDate',
        title: $t('page.manage.customer.detail.operationTime'),
        visible: true,
        width: 180,
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'customer-detail-oplog'
});

function formatDate(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}
</script>

<template>
  <div class="h-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :show-seq="false"
      :show-checkbox="false"
      :show-action="false"
      @refresh="getData"
    >
      <template #createDate="{ row }">
        <span>{{ formatDate(row.createDate) }}</span>
      </template>
    </Table>
  </div>
</template>

<style scoped></style>
