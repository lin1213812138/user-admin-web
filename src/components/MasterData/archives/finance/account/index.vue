<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import type { FormItemConfig } from '@/components/Form/index.vue';
import { useArchiveStatusOptions } from '@/components/MasterData/shared';

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

const config: ArchiveConfig<Api.DataManage.FinanceAccount> = {
  archive: 'account',
  cacheKey: 'data-manage-finance-account',
  titleI18nKey: 'page.dataManage.finance.account.title',
  searchItems,
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.finance.account.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.finance.account.name'), visible: true, sortable: false },
      { key: 'accountType', title: $t('page.dataManage.finance.account.accountType'), visible: true, sortable: false },
      { key: 'bank', title: $t('page.dataManage.finance.account.bank'), visible: true, sortable: false },
      {
        key: 'balance',
        title: $t('page.dataManage.finance.account.balance'),
        visible: true,
        width: 120,
        align: 'right',
        sortable: true
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.finance.account.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.account.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.finance.account.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.account.form.namePlaceholder')
    },
    { key: 'accountType', label: $t('page.dataManage.finance.account.accountType'), type: 'input', span: 12 },
    { key: 'bank', label: $t('page.dataManage.finance.account.bank'), type: 'input', span: 12 },
    { key: 'balance', label: $t('page.dataManage.finance.account.balance'), type: 'number', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', accountType: '', bank: '', balance: 0, status: 1, remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
