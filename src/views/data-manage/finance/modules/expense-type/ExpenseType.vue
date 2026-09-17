<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/views/data-manage/finance/components/MasterDataArchive.vue';
import type { ArchiveConfig } from '@/views/data-manage/components/types';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import { useArchiveStatusOptions } from '@/views/data-manage/components/shared';

const statusOptions = useArchiveStatusOptions();

const searchItems: FormItemConfig[] = [
  {
    key: 'keyword',
    label: $t('common.keyword'),
    type: 'input',
    span: 8,
    placeholder: $t('page.dataManage.common.keywordPlaceholder')
  },
  { key: 'status', label: $t('common.status'), type: 'select', span: 8, options: statusOptions.value },
  { key: 'actions', label: ' ', slot: 'actions', span: 8 }
];

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
      { key: 'name', title: $t('page.dataManage.finance.expenseType.name'), visible: true, sortable: false }
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
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', status: 1, remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
