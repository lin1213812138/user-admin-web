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

const config: ArchiveConfig<Api.DataManage.BasicGoods> = {
  archive: 'goods',
  cacheKey: 'data-manage-basic-goods',
  titleI18nKey: 'page.dataManage.basic.goods.title',
  searchItems,
  columns: () =>
    [
      { key: 'code', title: $t('page.dataManage.basic.goods.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.dataManage.basic.goods.name'), visible: true, sortable: false },
      { key: 'spec', title: $t('page.dataManage.basic.goods.spec'), visible: true, sortable: false },
      {
        key: 'unit',
        title: $t('page.dataManage.basic.goods.unit'),
        visible: true,
        width: 80,
        align: 'center',
        sortable: false
      },
      { key: 'categoryName', title: $t('page.dataManage.basic.goods.categoryName'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.basic.goods.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.goods.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.basic.goods.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.goods.form.namePlaceholder')
    },
    { key: 'spec', label: $t('page.dataManage.basic.goods.spec'), type: 'input', span: 12 },
    { key: 'unit', label: $t('page.dataManage.basic.goods.unit'), type: 'input', span: 12 },
    { key: 'categoryName', label: $t('page.dataManage.basic.goods.categoryName'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', spec: '', unit: '', categoryName: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
