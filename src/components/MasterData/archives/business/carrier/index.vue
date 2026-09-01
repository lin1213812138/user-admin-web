<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/components/MasterData/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.BusinessCarrier> = {
  archive: 'carrier',
  cacheKey: 'data-manage-business-carrier',
  titleI18nKey: 'page.dataManage.business.carrier.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.business.carrier.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.business.carrier.name'), visible: true, sortable: false },
      { key: 'contact', title: $t('page.dataManage.business.carrier.contact'), visible: true, sortable: false },
      { key: 'phone', title: $t('page.dataManage.business.carrier.phone'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.business.carrier.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.carrier.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.business.carrier.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.carrier.form.namePlaceholder')
    },
    { key: 'contact', label: $t('page.dataManage.business.carrier.contact'), type: 'input', span: 12 },
    { key: 'phone', label: $t('page.dataManage.business.carrier.phone'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', contact: '', phone: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
