<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/components/MasterData/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.BusinessLocation> = {
  archive: 'location',
  cacheKey: 'data-manage-business-location',
  titleI18nKey: 'page.dataManage.business.location.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.business.location.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.business.location.name'), visible: true, sortable: false },
      {
        key: 'warehouseName',
        title: $t('page.dataManage.business.location.warehouseName'),
        visible: true,
        sortable: false
      },
      {
        key: 'capacity',
        title: $t('page.dataManage.business.location.capacity'),
        visible: true,
        width: 120,
        align: 'right',
        sortable: true
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.business.location.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.location.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.business.location.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.location.form.namePlaceholder')
    },
    { key: 'warehouseName', label: $t('page.dataManage.business.location.warehouseName'), type: 'input', span: 12 },
    { key: 'capacity', label: $t('page.dataManage.business.location.capacity'), type: 'number', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', warehouseName: '', capacity: 0, status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
