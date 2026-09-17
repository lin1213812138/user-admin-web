<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateCarrier,
  fetchDeleteCarrier,
  fetchGetCarrierList,
  fetchGetWeightRuleList,
  fetchUpdateCarrier
} from '@/service/api/data-manage-ship';
import { fetchGetTrackConfigList } from '@/service/api/track-config';

/** 名称搜索关键字 */
const keyword = ref('');

/** 计泡规则全量缓存：列表名称映射 + 表单下拉共用 */
const weightRuleOptions = ref<{ label: string; value: string }[]>([]);

async function loadWeightRuleOptions() {
  const { data: res, error } = await fetchGetWeightRuleList({ page: 1, size: 500, where: {} });
  if (error || !res) return;
  weightRuleOptions.value = res.list.map(item => ({ label: item.name, value: item._id }));
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

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
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
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-ship-carrier'
});

const columnConfigVisible = ref(false);

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

// ---- 抽屉 ----
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<Api.DataManageShip.Carrier>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<Api.DataManageShip.Carrier> {
  return {
    name: '',
    weightRuleId: undefined,
    trackConfigId: undefined,
    remoteGroupId: undefined,
    oilRate: undefined,
    feeCustom: undefined,
    cubicNum: undefined,
    weightOff: undefined,
    order: 0,
    note: ''
  };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.ship.carrier.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.ship.carrier.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.ship.carrier.name'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入网络名称'
  },
  {
    key: 'weightRuleId',
    label: $t('page.dataManage.ship.carrier.weightRule'),
    type: 'select',
    span: 12,
    options: weightRuleOptions.value,
    clearable: true,
    filterable: false
  },
  {
    key: 'trackConfigId',
    label: $t('page.dataManage.ship.carrier.trackConfig'),
    type: 'select',
    span: 12,
    options: trackConfigOptions.value,
    clearable: true,
    filterable: false
  },
  { key: 'order', label: $t('page.dataManage.ship.carrier.order'), type: 'number', span: 12 },
  { key: 'oilRate', label: $t('page.dataManage.ship.carrier.oilRate'), type: 'number', span: 12 },
  { key: 'feeCustom', label: $t('page.dataManage.ship.carrier.feeCustom'), type: 'number', span: 12 },
  { key: 'cubicNum', label: $t('page.dataManage.ship.carrier.cubicNum'), type: 'number', span: 12 },
  { key: 'weightOff', label: $t('page.dataManage.ship.carrier.weightOff'), type: 'number', span: 12 },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

/** 编辑回填：remoteGroupId 数据源页面暂不存在，原样带回保证不丢（trackConfigId 已接追踪网络下拉） */
function openEdit(row: Api.DataManageShip.Carrier) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    name: row.name,
    weightRuleId: row.weightRuleId,
    trackConfigId: row.trackConfigId,
    remoteGroupId: row.remoteGroupId,
    oilRate: row.oilRate,
    feeCustom: row.feeCustom,
    cubicNum: row.cubicNum,
    weightOff: row.weightOff,
    order: row.order ?? 0,
    note: row.note ?? ''
  };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  submitting.value = true;
  try {
    const { error } =
      drawerMode.value === 'create'
        ? await fetchCreateCarrier(formModel.value)
        : await fetchUpdateCarrier(formModel.value);

    if (error) return;

    drawerVisible.value = false;
    getData();
    window.$message?.success($t(drawerMode.value === 'create' ? 'common.createSuccess' : 'common.saveSuccess'));
  } finally {
    submitting.value = false;
  }
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
      :action-width="140"
      @refresh="getData"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
    >
      <template #search-action>
        <div class="flex flex-wrap items-center gap-12px">
          <NInput
            v-model:value="keyword"
            class="w-200px!"
            clearable
            placeholder="请输入网络名称"
            @keyup.enter="handleSearch"
          />
          <NButton size="small" type="primary" @click="handleSearch">
            <template #icon><icon-ic-round-search class="text-icon" /></template>
            {{ $t('common.search') }}
          </NButton>
          <NButton size="small" @click="handleReset">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
            {{ $t('common.reset') }}
          </NButton>
        </div>
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
      <template #operation-left>
        <NButton type="primary" ghost size="small" @click="openCreate">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </NButton>
        <NPopconfirm @positive-click="confirmBatchDelete">
          <template #trigger>
            <NButton size="small" type="error" ghost :disabled="checkedRows.length === 0">
              {{ $t('common.delete') }}
            </NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
      <template #operation-right="{ refresh }">
        <NButton size="small" @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </NButton>
        <TableColumnConfig
          v-model:visible="columnConfigVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
        <NPopconfirm @positive-click="confirmDelete(row)">
          <template #trigger>
            <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <Drawer
      v-model:show="drawerVisible"
      :title="drawerTitle"
      :loading="submitting"
      :confirm-text="$t('common.save')"
      @submit="handleDrawerSubmit"
    >
      <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
    </Drawer>
  </div>
</template>
