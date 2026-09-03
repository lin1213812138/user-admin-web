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

const config: ArchiveConfig<Api.DataManage.BasicCustomer> = {
  archive: 'customer',
  cacheKey: 'data-manage-basic-customer',
  titleI18nKey: 'page.dataManage.basic.customer.title',
  searchItems,
  columns: () =>
    [
      { key: 'code', title: $t('page.dataManage.basic.customer.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.dataManage.basic.customer.name'), visible: true, sortable: false },
      { key: 'contact', title: $t('page.dataManage.basic.customer.contact'), visible: true, sortable: false },
      { key: 'phone', title: $t('page.dataManage.basic.customer.phone'), visible: true, sortable: false },
      {
        key: 'address',
        title: $t('page.dataManage.basic.customer.address'),
        visible: true,
        minWidth: 200,
        sortable: false
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.basic.customer.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.customer.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.basic.customer.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.customer.form.namePlaceholder')
    },
    { key: 'contact', label: $t('page.dataManage.basic.customer.contact'), type: 'input', span: 12 },
    { key: 'phone', label: $t('page.dataManage.basic.customer.phone'), type: 'input', span: 12 },
    { key: 'address', label: $t('page.dataManage.basic.customer.address'), type: 'input', span: 24 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', contact: '', phone: '', address: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
