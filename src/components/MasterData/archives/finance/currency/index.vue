<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/components/MasterData/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.FinanceCurrency> = {
  archive: 'currency',
  cacheKey: 'data-manage-finance-currency',
  titleI18nKey: 'page.dataManage.finance.currency.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.finance.currency.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.finance.currency.name'), visible: true, sortable: false },
      {
        key: 'rate',
        title: $t('page.dataManage.finance.currency.rate'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: true
      },
      {
        key: 'symbol',
        title: $t('page.dataManage.finance.currency.symbol'),
        visible: true,
        width: 80,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.finance.currency.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.currency.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.finance.currency.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.currency.form.namePlaceholder')
    },
    { key: 'rate', label: $t('page.dataManage.finance.currency.rate'), type: 'number', span: 12 },
    { key: 'symbol', label: $t('page.dataManage.finance.currency.symbol'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', rate: 1, symbol: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
