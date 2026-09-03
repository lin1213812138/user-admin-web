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

const config: ArchiveConfig<Api.DataManage.BusinessWarehouse> = {
  archive: 'warehouse',
  cacheKey: 'data-manage-business-warehouse',
  titleI18nKey: 'page.dataManage.business.warehouse.title',
  searchItems,
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.business.warehouse.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.business.warehouse.name'), visible: true, sortable: false },
      { key: 'address', title: $t('page.dataManage.business.warehouse.address'), visible: true, sortable: false },
      { key: 'manager', title: $t('page.dataManage.business.warehouse.manager'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.business.warehouse.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.warehouse.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.business.warehouse.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.warehouse.form.namePlaceholder')
    },
    { key: 'address', label: $t('page.dataManage.business.warehouse.address'), type: 'input', span: 24 },
    { key: 'manager', label: $t('page.dataManage.business.warehouse.manager'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', address: '', manager: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
