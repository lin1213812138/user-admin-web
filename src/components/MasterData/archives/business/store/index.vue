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

const config: ArchiveConfig<Api.DataManage.BusinessStore> = {
  archive: 'store',
  cacheKey: 'data-manage-business-store',
  titleI18nKey: 'page.dataManage.business.store.title',
  searchItems,
  columns: () =>
    [
      { key: 'code', title: $t('page.dataManage.business.store.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.dataManage.business.store.name'), visible: true, sortable: false },
      { key: 'address', title: $t('page.dataManage.business.store.address'), visible: true, sortable: false },
      { key: 'owner', title: $t('page.dataManage.business.store.owner'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.business.store.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.store.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.business.store.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.store.form.namePlaceholder')
    },
    { key: 'address', label: $t('page.dataManage.business.store.address'), type: 'input', span: 24 },
    { key: 'owner', label: $t('page.dataManage.business.store.owner'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', address: '', owner: '', status: 1, remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
