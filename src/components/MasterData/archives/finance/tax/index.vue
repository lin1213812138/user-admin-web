<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/components/MasterData/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.FinanceTax> = {
  archive: 'tax',
  cacheKey: 'data-manage-finance-tax',
  titleI18nKey: 'page.dataManage.finance.tax.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      { key: 'name', title: $t('page.dataManage.finance.tax.name'), type: 'detail', visible: true, sortable: false },
      {
        key: 'rate',
        title: $t('page.dataManage.finance.tax.rate'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: true
      },
      { key: 'taxType', title: $t('page.dataManage.finance.tax.taxType'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'name',
      label: $t('page.dataManage.finance.tax.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.tax.form.namePlaceholder')
    },
    { key: 'rate', label: $t('page.dataManage.finance.tax.rate'), type: 'number', required: true, span: 12 },
    { key: 'taxType', label: $t('page.dataManage.finance.tax.taxType'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ name: '', rate: 0.13, taxType: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
