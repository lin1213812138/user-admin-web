<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/components/MasterData/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.BasicCategory> = {
  archive: 'category',
  cacheKey: 'data-manage-basic-category',
  titleI18nKey: 'page.dataManage.basic.category.title',
  searchItems: baseSearch(),
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
