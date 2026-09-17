<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/views/data-manage/basic/components/MasterDataArchive.vue';
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

const config: ArchiveConfig<Api.DataManage.BasicCountryRegion> = {
  archive: 'countryRegion',
  cacheKey: 'data-manage-basic-country-region',
  titleI18nKey: 'page.dataManage.basic.countryRegion.title',
  searchItems,
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.basic.countryRegion.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.basic.countryRegion.name'), visible: true, sortable: false },
      {
        key: 'phoneCode',
        title: $t('page.dataManage.basic.countryRegion.phoneCode'),
        visible: true,
        width: 140,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.basic.countryRegion.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.countryRegion.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.basic.countryRegion.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.countryRegion.form.namePlaceholder')
    },
    { key: 'phoneCode', label: $t('page.dataManage.basic.countryRegion.phoneCode'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', phoneCode: '', status: 1, remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
