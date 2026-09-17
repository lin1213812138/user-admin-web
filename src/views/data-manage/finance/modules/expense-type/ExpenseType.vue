<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/views/data-manage/finance/components/MasterDataArchive.vue';
import type { ArchiveConfig } from '@/views/data-manage/components/types';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import { useArchiveStatusOptions } from '@/views/data-manage/components/shared';

const statusOptions = useArchiveStatusOptions();

const scopeOptions = [
  { label: '运单应收', value: 0 },
  { label: '运单应付', value: 1 },
  { label: '提单应付', value: 2 },
  { label: '杂支应付', value: 3 },
  { label: '杂支应收', value: 4 }
];

const searchItems: FormItemConfig[] = [
  {
    key: 'keyword',
    label: $t('common.keyword'),
    type: 'input',
    span: 6,
    placeholder: $t('page.dataManage.common.keywordPlaceholder')
  },
  { key: 'scope', label: '费用归类', type: 'select', span: 6, options: scopeOptions },
  { key: 'status', label: $t('common.status'), type: 'select', span: 6, options: statusOptions.value },
  { key: 'actions', label: ' ', slot: 'actions', span: 6 }
];

function scopeLabel(value?: number) {
  return scopeOptions.find(o => o.value === value)?.label ?? '--';
}

const config: ArchiveConfig<Api.DataManage.FinanceExpenseType> = {
  archive: 'expense-type',
  cacheKey: 'data-manage-finance-expense-type',
  titleI18nKey: 'page.dataManage.finance.expenseType.title',
  searchItems,
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.finance.expenseType.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.finance.expenseType.name'), visible: true, sortable: false },
      { key: 'scope', title: '费用归类', visible: true, width: 120, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.finance.expenseType.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.expenseType.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.finance.expenseType.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.expenseType.form.namePlaceholder')
    },
    { key: 'scope', label: '费用归类', type: 'select', required: true, span: 12, options: scopeOptions },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', scope: 0, status: 1, remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config">
    <template #scope="{ row }">
      <span>{{ scopeLabel(row.scope) }}</span>
    </template>
  </MasterDataArchive>
</template>
