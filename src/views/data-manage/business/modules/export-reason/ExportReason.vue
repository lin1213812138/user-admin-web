<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/views/data-manage/components/MasterDataArchive.vue';
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

const config: ArchiveConfig<Api.DataManage.BusinessExportReason> = {
  archive: 'exportReason',
  cacheKey: 'data-manage-business-export-reason',
  titleI18nKey: 'page.dataManage.business.exportReason.title',
  searchItems,
  columns: () =>
    [
      { key: 'code', title: $t('page.dataManage.business.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.dataManage.business.name'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.business.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.business.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.form.namePlaceholder')
    },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', status: 1, remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
