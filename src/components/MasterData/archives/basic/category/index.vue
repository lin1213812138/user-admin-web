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

const config: ArchiveConfig<Api.DataManage.BasicCategory> = {
  archive: 'category',
  cacheKey: 'data-manage-basic-category',
  titleI18nKey: 'page.dataManage.basic.category.title',
  searchItems,
  columns: () =>
    [
      { key: 'code', title: $t('page.dataManage.basic.category.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.dataManage.basic.category.name'), visible: true, sortable: false },
      {
        key: 'sort',
        title: $t('page.dataManage.basic.category.sort'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: true
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.basic.category.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.category.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.basic.category.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.category.form.namePlaceholder')
    },
    { key: 'sort', label: $t('page.dataManage.basic.category.sort'), type: 'number', required: true, span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', sort: 0, status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
