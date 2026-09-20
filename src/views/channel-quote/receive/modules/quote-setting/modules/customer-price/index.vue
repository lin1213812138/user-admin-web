<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { Table } from '@/components/Table';
import type { VxeColumnRenderColumn } from '@/components/Table';

defineOptions({
  name: 'QuoteSettingCustomerPricePanel'
});

/**
 * 列结构对齐老系统「客户报价」：客户 / 报价类型 / 其他费用 / 报价备注 /
 * 最新编辑 / 编辑时间 / 创建时间 / 状态 / 操作（勾选列由表格自带）
 */
const columns = computed<VxeColumnRenderColumn[]>(() => [
  {
    key: 'customer',
    title: $t('page.channelQuote.quoteSetting.customerPrice.customer'),
    minWidth: 160,
    sortable: false
  },
  {
    key: 'priceType',
    title: $t('page.channelQuote.quoteSetting.customerPrice.priceType'),
    minWidth: 130,
    sortable: false
  },
  {
    key: 'otherFee',
    title: $t('page.channelQuote.quoteSetting.customerPrice.otherFee'),
    width: 120,
    align: 'right',
    sortable: false
  },
  {
    key: 'note',
    title: $t('page.channelQuote.quoteSetting.customerPrice.note'),
    minWidth: 160,
    sortable: false
  },
  {
    key: 'latestEdit',
    title: $t('page.channelQuote.quoteSetting.customerPrice.latestEdit'),
    minWidth: 130,
    sortable: false
  },
  {
    key: 'editTime',
    title: $t('page.channelQuote.quoteSetting.customerPrice.editTime'),
    width: 170,
    sortable: false
  },
  {
    key: 'createTime',
    title: $t('page.channelQuote.quoteSetting.customerPrice.createTime'),
    width: 170,
    sortable: false
  },
  {
    key: 'status',
    title: $t('common.status'),
    type: 'status',
    width: 100,
    align: 'center',
    sortable: false
  }
]);
</script>

<template>
  <Table
    :columns="columns"
    :data="[]"
    :pagination="{ current: 1, size: 50, total: 0 }"
    show-checkbox
    show-action
    :action-width="120"
  >
    <template #operation-left>
      <LButton type="primary">
        <template #icon>
          <icon-ic-round-plus class="text-icon" />
        </template>
        {{ $t('page.channelQuote.quoteSetting.actions.addPrice') }}
      </LButton>
      <LButton type="error" ghost>
        <template #icon>
          <icon-mdi-delete class="text-icon" />
        </template>
        {{ $t('page.channelQuote.quoteSetting.actions.deletePrice') }}
      </LButton>
    </template>
  </Table>
</template>

<style scoped></style>
