<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { NInput, NSelect, NSwitch } from 'naive-ui';
import { fetchBatchUpdateTrackOp, fetchGetTrackOpList } from '@/service/api/operation-trace';

const { data, loading, columnConfigs, columns, getData, persistColumns, resetColumns } = useVxeTable<
  { records: Api.SystemManage.TrackOpItem[]; total: number },
  Api.SystemManage.TrackOpItem
>({
  // 真实接口 /track-op/query 固定返回 5 种操作节点，无分页，整表编辑后批量保存
  api: async () => {
    const { data: res, error } = await fetchGetTrackOpList();
    if (error || !res) return { records: [], total: 0 };
    return { records: res.list, total: res.list.length };
  },
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'opType',
        title: $t('page.manage.setting.operationTrace.col.opType'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'timeType',
        title: $t('page.manage.setting.operationTrace.col.timeType'),
        visible: true,
        minWidth: 180,
        sortable: false
      },
      {
        key: 'place',
        title: $t('page.manage.setting.operationTrace.col.place'),
        visible: true,
        minWidth: 180,
        sortable: false
      },
      {
        key: 'desc',
        title: $t('page.manage.setting.operationTrace.col.desc'),
        visible: true,
        minWidth: 240,
        sortable: false
      },
      {
        key: 'status',
        title: $t('page.manage.setting.operationTrace.col.status'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'operation-trace'
});

const configVisible = ref(false);
const saving = ref(false);

/** 操作节点固定枚举 0-运单预报 1-运单揽收 2-运单入库 3-运单发货出库 4-运单派送出库（下拉可编辑） */
const opTypeOptions = computed(() => [
  { label: $t('page.manage.setting.operationTrace.opTypeOption.forecast'), value: 0 },
  { label: $t('page.manage.setting.operationTrace.opTypeOption.pickup'), value: 1 },
  { label: $t('page.manage.setting.operationTrace.opTypeOption.inbound'), value: 2 },
  { label: $t('page.manage.setting.operationTrace.opTypeOption.outbound'), value: 3 },
  { label: $t('page.manage.setting.operationTrace.opTypeOption.delivery'), value: 4 }
]);

/** 时间格式 0-年月日 1-年月日时分 2-年月日时分秒（下拉可编辑） */
const timeTypeOptions = computed(() => [
  { label: $t('page.manage.setting.operationTrace.timeTypeOption.ymd'), value: 0 },
  { label: $t('page.manage.setting.operationTrace.timeTypeOption.ymdHm'), value: 1 },
  { label: $t('page.manage.setting.operationTrace.timeTypeOption.ymdHms'), value: 2 }
]);

/** 服务地点：固定占位项下拉（值即占位符原文，后端按占位符替换实际地点） */
const placeOptions = computed(() => [
  { label: $t('page.manage.setting.operationTrace.placeOption.waybillOrigin'), value: '[运单出发地]' },
  { label: $t('page.manage.setting.operationTrace.placeOption.destination'), value: '[目的地]' }
]);

/** 新增一行：本地追加空行（_id 留空，随批量保存整表提交，后端按 _id 是否存在做 upsert） */
function handleAddRow() {
  data.value.push({
    _id: '',
    opType: 0,
    timeType: 0,
    place: '',
    desc: '',
    status: 1,
    createDate: 0,
    updateDate: 0
  });
}

/** 批量保存：整表提交到 /track-op/update，成功后刷新列表 */
async function handleBatchSave() {
  saving.value = true;
  try {
    const { error } = await fetchBatchUpdateTrackOp(data.value);
    if (error) {
      window.$message?.error($t('page.manage.setting.operationTrace.saveFailed'));
      return;
    }
    window.$message?.success($t('page.manage.setting.operationTrace.saveSuccess'));
    getData();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="min-h-0 flex-1">
      <Table :columns="columns" :data="data" :loading="loading" :pagination="null" :show-seq="true" @refresh="getData">
        <template #operation-left>
          <LButton @click="handleAddRow">
            <template #icon><icon-mdi-plus class="text-icon" /></template>
            {{ $t('page.manage.setting.operationTrace.addRow') }}
          </LButton>
          <LButton type="primary" :loading="saving" @click="handleBatchSave">
            <template #icon><icon-mdi-content-save class="text-icon" /></template>
            {{ $t('page.manage.setting.operationTrace.batchSave') }}
          </LButton>
        </template>
        <template #operation-right>
          <NSpace justify="end" wrap>
            <LButton circle :tooltip="$t('common.refresh')" @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
            </LButton>
          </NSpace>
        </template>
        <template #opType="{ row }">
          <NSelect v-model:value="row.opType" :options="opTypeOptions" size="small" :consistent-menu-width="false" />
        </template>
        <template #timeType="{ row }">
          <NSelect
            v-model:value="row.timeType"
            :options="timeTypeOptions"
            size="small"
            :consistent-menu-width="false"
          />
        </template>
        <template #place="{ row }">
          <NSelect
            v-model:value="row.place"
            :options="placeOptions"
            size="small"
            :filterable="false"
            clearable
            :consistent-menu-width="false"
          />
        </template>
        <template #desc="{ row }">
          <NInput v-model:value="row.desc" size="small" />
        </template>
        <template #status="{ row }">
          <NSwitch v-model:value="row.status" :checked-value="1" :unchecked-value="0">
            <template #checked>是</template>
            <template #unchecked>否</template>
          </NSwitch>
        </template>
      </Table>
    </div>
    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />
  </div>
</template>
