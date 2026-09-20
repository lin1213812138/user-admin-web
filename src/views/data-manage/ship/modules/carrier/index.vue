<script setup lang="ts">
import { onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteCarrier, fetchGetCarrierList, fetchGetWeightRuleList } from '@/service/api/data-manage-ship';
import { fetchGetTrackConfigList } from '@/service/api/track-config';
import CarrierSearchForm from './CarrierSearchForm.vue';
import CarrierOperateDrawer from './CarrierOperateDrawer.vue';
import CarrierFeeExtDrawer from './CarrierFeeExtDrawer.vue';
import CarrierSyncDrawer from './CarrierSyncDrawer.vue';

/** 名称搜索关键字 */
const keyword = ref('');

/** 计泡规则全量缓存：列表名称映射 + 表单下拉共用（附带 材积除/计泡比率，供承运网络表单选择后自动带出） */
const weightRuleOptions = ref<{ label: string; value: string; cubicNum?: number; weightOff?: number }[]>([]);

async function loadWeightRuleOptions() {
  const { data: res, error } = await fetchGetWeightRuleList({ page: 1, size: 500, where: {} });
  if (error || !res) return;
  weightRuleOptions.value = res.list.map(item => ({
    label: item.name,
    value: item._id,
    cubicNum: item.cubicNum,
    weightOff: item.weightOff
  }));
}

/** 追踪网络全量缓存：列表名称映射 + 表单下拉共用（数据源=系统设置→轨迹抓取→追踪网络） */
const trackConfigOptions = ref<{ label: string; value: string }[]>([]);

async function loadTrackConfigOptions() {
  const { data: res, error } = await fetchGetTrackConfigList({ page: 1, size: 500 });
  if (error || !res) return;
  trackConfigOptions.value = res.list.map(item => ({ label: item.name, value: item._id }));
}

onMounted(() => {
  loadWeightRuleOptions();
  loadTrackConfigOptions();
});

/** 列表列展示计泡规则名称 */
function weightRuleLabel(id?: string) {
  return weightRuleOptions.value.find(item => item.value === id)?.label ?? '--';
}

/** 列表列展示追踪网络名称 */
function trackConfigLabel(id?: string) {
  return trackConfigOptions.value.find(item => item.value === id)?.label ?? '--';
}

/** 毫秒时间戳格式化展示 */
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columns, pagination, getData } = useVxeTable<
  Api.DataManageShip.ShipQueryResult<Api.DataManageShip.Carrier>,
  Api.DataManageShip.Carrier
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetCarrierList({
      page: current,
      size,
      keyword: keyword.value || undefined,
      where: {}
    });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.dataManage.ship.carrier.name'),
        type: 'detail',
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'weightRuleId',
        title: $t('page.dataManage.ship.carrier.weightRule'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'trackConfigId',
        title: $t('page.dataManage.ship.carrier.trackConfig'),
        visible: true,
        minWidth: 140,
        sortable: false
      },
      {
        key: 'oilRate',
        title: $t('page.dataManage.ship.carrier.oilRate'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: false
      },
      {
        key: 'feeCustom',
        title: $t('page.dataManage.ship.carrier.feeCustom'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: false
      },
      {
        key: 'cubicNum',
        title: $t('page.dataManage.ship.carrier.cubicNum'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: false
      },
      {
        key: 'weightOff',
        title: $t('page.dataManage.ship.carrier.weightOff'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: false
      },
      {
        key: 'order',
        title: $t('page.dataManage.ship.carrier.order'),
        visible: true,
        width: 90,
        align: 'center',
        sortable: false
      },
      {
        key: 'createDate',
        title: $t('page.dataManage.common.createTime'),
        visible: true,
        width: 170,
        align: 'center',
        sortable: false
      },
      {
        key: 'feeExt',
        title: $t('page.dataManage.ship.carrier.feeExt'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-ship-carrier'
});

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  keyword.value = '';
  pagination.current = 1;
  getData();
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

// ---- 勾选与删除（后端 delete 仅单 _id，批量 = 前端逐条） ----
const checkedRows = ref<Api.DataManageShip.Carrier[]>([]);

function handleSelectionChange(rows: Api.DataManageShip.Carrier[]) {
  checkedRows.value = rows;
}

async function confirmDelete(row: Api.DataManageShip.Carrier) {
  const { error } = await fetchDeleteCarrier(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteCarrier(row._id);
    if (error) return;
  }
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

const drawerRef = ref<InstanceType<typeof CarrierOperateDrawer> | null>(null);

/** 同步渠道抽屉：当前被同步的承运网络行 + 可见性 */
const syncDrawerVisible = ref(false);
const syncCarrier = ref<Api.DataManageShip.Carrier | null>(null);

function handleSyncChannel(row: Api.DataManageShip.Carrier) {
  syncCarrier.value = row;
  syncDrawerVisible.value = true;
}

/** 附加费弹窗：当前承运网络行 + 可见性 */
const feeExtDrawerVisible = ref(false);
const feeExtCarrier = ref<Api.DataManageShip.Carrier | null>(null);

function handleOpenFeeExt(row: Api.DataManageShip.Carrier) {
  feeExtCarrier.value = row;
  feeExtDrawerVisible.value = true;
}
</script>

<template>
  <div class="h-full w-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      show-checkbox
      show-action
      :action-width="150"
      @refresh="getData"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
    >
      <template #search-action>
        <CarrierSearchForm v-model:keyword="keyword" @search="handleSearch" @reset="handleReset" />
      </template>
      <template #weightRuleId="{ row }">
        <span>{{ weightRuleLabel(row.weightRuleId) }}</span>
      </template>
      <template #trackConfigId="{ row }">
        <span>{{ trackConfigLabel(row.trackConfigId) }}</span>
      </template>
      <template #createDate="{ row }">
        <span>{{ formatDateTime(row.createDate) }}</span>
      </template>
      <template #feeExt="{ row }">
        <LButton type="primary" text @click="handleOpenFeeExt(row)">
          {{ $t('page.dataManage.ship.carrier.feeExt') }}
        </LButton>
      </template>
      <template #operation-left>
        <LButton type="primary" @click="drawerRef?.openCreate()">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </LButton>
        <LButton type="error" popconfirm :disabled="checkedRows.length === 0" @positive-click="confirmBatchDelete">
          {{ $t('common.batchDelete') }}
        </LButton>
      </template>
      <template #operation-right="{ refresh }">
        <LButton circle @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </LButton>
      </template>
      <template #action="{ row }">
        <LButton type="primary" text @click="handleSyncChannel(row)">
          {{ $t('page.dataManage.ship.carrier.syncChannel') }}
        </LButton>
        <LButton type="primary" text @click="drawerRef?.openEdit(row)">{{ $t('common.edit') }}</LButton>
        <LButton type="error" text popconfirm @positive-click="confirmDelete(row)">{{ $t('common.delete') }}</LButton>
      </template>
    </Table>

    <CarrierOperateDrawer
      ref="drawerRef"
      :weight-rule-options="weightRuleOptions"
      :track-config-options="trackConfigOptions"
      @submitted="getData"
    />

    <CarrierSyncDrawer
      v-model:show="syncDrawerVisible"
      :carrier="syncCarrier"
      :weight-rule-options="weightRuleOptions"
    />

    <CarrierFeeExtDrawer v-model:show="feeExtDrawerVisible" :carrier="feeExtCarrier" />
  </div>
</template>
