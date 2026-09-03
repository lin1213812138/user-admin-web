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

const config: ArchiveConfig<Api.DataManage.FinanceSettlement> = {
  archive: 'settlement',
  cacheKey: 'data-manage-finance-settlement',
  titleI18nKey: 'page.dataManage.finance.settlement.title',
  searchItems,
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.dataManage.finance.settlement.name'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'period', title: $t('page.dataManage.finance.settlement.period'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'name',
      label: $t('page.dataManage.finance.settlement.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.settlement.form.namePlaceholder')
    },
    { key: 'period', label: $t('page.dataManage.finance.settlement.period'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ name: '', period: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
