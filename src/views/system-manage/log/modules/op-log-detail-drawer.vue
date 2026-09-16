<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import SiteDrawer from '@/components/common/drawer.vue';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 详情行数据 */
  row?: Api.SystemManage.OpLog | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  row: null
});

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.show,
  set: val => emit('update:show', val)
});

const title = computed(() => $t('page.manage.opLog.detail'));

/** 操作端文案 */
const clientText = computed(() => {
  const map = ['TMS', 'PC', 'PDA', 'OMS'] as const;
  return props.row?.client === undefined ? '--' : map[props.row.client];
});

/** 操作类型文案 */
const opTypeText = computed(() => {
  const map = [
    $t('page.manage.opLog.opTypeOption.login'),
    $t('page.manage.opLog.opTypeOption.update'),
    $t('page.manage.opLog.opTypeOption.del'),
    $t('page.manage.opLog.opTypeOption.logout')
  ];
  return props.row?.opType === undefined ? '--' : (map[props.row.opType] ?? '--');
});

/** 操作时间（毫秒时间戳） */
const createDateText = computed(() =>
  props.row?.createDate ? dayjs(props.row.createDate).format('YYYY-MM-DD HH:mm:ss') : '--'
);

/** 关联实体名称（顿号分隔） */
const refNamesText = computed(() => props.row?.refNames?.join('、') || '--');

/** 变更明细表列 */
const detailColumns = computed(() => [
  { key: 'name', title: $t('page.manage.opLog.log.name'), width: 140 },
  { key: 'oldValue', title: $t('page.manage.opLog.log.oldValue'), minWidth: 120 },
  { key: 'newValue', title: $t('page.manage.opLog.log.newValue'), minWidth: 120 },
  { key: 'desc', title: $t('page.manage.opLog.log.desc'), minWidth: 100 }
]);

/** 变更明细表数据（空明细兜底空数组） */
const detailData = computed(() => props.row?.logs ?? []);
</script>

<template>
  <SiteDrawer v-model:show="drawerVisible" :title="title" :footer="false" width="640">
    <div class="flex flex-col gap-16px">
      <NDescriptions :column="2" label-placement="left" bordered size="small">
        <NDescriptionsItem :label="$t('page.manage.opLog.opName')">
          {{ row?.name || '--' }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.opLog.creator')">
          {{ row?.creator || '--' }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.opLog.client')">
          {{ clientText }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.opLog.opType')">
          {{ opTypeText }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.opLog.ip')">
          {{ row?.ip || '--' }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.opLog.createDate')">
          {{ createDateText }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.opLog.refNames')" :span="2">
          {{ refNamesText }}
        </NDescriptionsItem>
        <NDescriptionsItem :label="$t('page.manage.opLog.desc')" :span="2">
          {{ row?.desc || '--' }}
        </NDescriptionsItem>
      </NDescriptions>

      <div v-if="detailData.length" class="flex flex-col gap-8px">
        <div class="font-500">{{ $t('page.manage.opLog.logTitle') }}</div>
        <NDataTable
          size="small"
          :columns="detailColumns"
          :data="detailData"
          :bordered="true"
          :single-line="false"
          :scroll-x="480"
        />
      </div>
      <NEmpty v-else :description="$t('page.manage.opLog.noDetail')" />
    </div>
  </SiteDrawer>
</template>

<style scoped></style>
