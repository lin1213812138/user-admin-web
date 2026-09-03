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

const config: ArchiveConfig<Api.DataManage.BasicSupplier> = {
  archive: 'supplier',
  cacheKey: 'data-manage-basic-supplier',
  titleI18nKey: 'page.dataManage.basic.supplier.title',
  searchItems,
  columns: () =>
    [
      { key: 'code', title: $t('page.dataManage.basic.supplier.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.dataManage.basic.supplier.name'), visible: true, sortable: false },
      { key: 'contact', title: $t('page.dataManage.basic.supplier.contact'), visible: true, sortable: false },
      { key: 'phone', title: $t('page.dataManage.basic.supplier.phone'), visible: true, sortable: false },
      {
        key: 'level',
        title: $t('page.dataManage.basic.supplier.level'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.basic.supplier.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.supplier.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.basic.supplier.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.supplier.form.namePlaceholder')
    },
    { key: 'contact', label: $t('page.dataManage.basic.supplier.contact'), type: 'input', span: 12 },
    { key: 'phone', label: $t('page.dataManage.basic.supplier.phone'), type: 'input', span: 12 },
    { key: 'level', label: $t('page.dataManage.basic.supplier.level'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', contact: '', phone: '', level: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
