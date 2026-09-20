<script setup lang="ts">
/**
 * 承运网络 · 同步渠道（侧滑抽屉）
 *
 * 把当前承运网络的 燃油费 / 报关费 / 计泡规则 / 偏远 批量同步到所选类型的渠道：
 * - 新值来源：打开时选中的承运网络行（同一抽屉内所有渠道共用）；
 * - 原值来源：渠道自身（/channel/query、/channel-out/query 传 scene 走 fillName 回填名称）；
 * - 渠道范围：仅取 carrierId 关联当前承运网络的渠道（与「附加费同步到渠道」抽屉同口径）；
 * - 勾选框决定该字段是否同步；「移除」仅从本次待同步列表剔除（不删除渠道）；
 * - 计泡比无勾选框：渠道侧计泡比跟随「计泡规则」联动变化，仅对照展示（取承运网络 weightOff）。
 * 落库接口：POST /carrier/sync（fields 为字段名数组，值由后端从承运网络文档 pick）。
 */
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import CommonDrawer from '@/components/common/drawer.vue';
import { Table } from '@/components/Table';
import type { VxeColumnRenderColumn } from '@/components/Table';
import { fetchGetChannelList } from '@/service/api/channel';
import { fetchGetChannelOutList } from '@/service/api/channel-out';
import { fetchGetRemoteGroupList } from '@/service/api/remote-group';
import { fetchSyncCarrierChannel } from '@/service/api/data-manage-ship';

defineOptions({
  name: 'CarrierSyncDrawer'
});

type SyncField = Api.DataManageShip.CarrierSyncField;
type SyncChannel = Api.DataManageShip.CarrierSyncChannel;

/** 可同步字段（与后端 /carrier/sync 的 fields 对齐，数组顺序即提交顺序） */
const SYNC_FIELDS: SyncField[] = ['oilRate', 'feeCustom', 'weightRuleId', 'remoteGroupId'];

/** 行内可标记差异的字段（4 个可同步字段 + 计泡比：计泡比不可独立同步，但同样对照提示差异） */
interface SyncChanged {
  oilRate: boolean;
  feeCustom: boolean;
  weightRuleId: boolean;
  weightRuleWeightOff: boolean;
  remoteGroupId: boolean;
}

/** 抽屉行：渠道原值已格式化为展示文本，勾选状态与差异标记随行维护 */
interface SyncRow {
  _id: string;
  name: string;
  oriOilRate: string;
  oriFeeCustom: string;
  oriWeightRule: string;
  oriWeightOff: string;
  oriRemoteGroup: string;
  /** 该字段「承运网络新值 ≠ 渠道原值」→ 新值单元格标特别色 */
  changed: SyncChanged;
  checked: Record<SyncField, boolean>;
}

interface Props {
  /** 抽屉可见性，use v-model:show */
  show?: boolean;
  /** 被同步的承运网络行（新值来源） */
  carrier?: Api.DataManageShip.Carrier | null;
  /** 计泡规则选项（父页面已加载，用于把承运网络 weightRuleId 映射为规则名称） */
  weightRuleOptions: { label: string; value: string; cubicNum?: number; weightOff?: number }[];
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  carrier: null
});

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.show,
  set: value => emit('update:show', value)
});

/** 抽屉标题：同步到收货渠道 - <承运网络名称>（与「动作 - 对象名」的既有口径一致） */
const drawerTitle = computed(() =>
  props.carrier?.name
    ? `${$t('page.dataManage.ship.carrier.sync.title')} - ${props.carrier.name}`
    : $t('page.dataManage.ship.carrier.sync.title')
);

/** 0-收货渠道 1-发货渠道（与后端 channelType 对齐）；默认收货渠道 */
const channelType = ref<0 | 1>(0);
const loading = ref(false);
const saving = ref(false);
const rows = ref<SyncRow[]>([]);

// ---- 偏远名称映射（打开时按需加载一次） ----
const remoteGroupOptions = ref<{ label: string; value: string }[]>([]);
const remoteGroupLoaded = ref(false);

async function loadRemoteGroups() {
  if (remoteGroupLoaded.value) return;
  const { data, error } = await fetchGetRemoteGroupList({ page: 1, size: 500 });
  if (error || !data) return;
  remoteGroupOptions.value = data.list.map(item => ({ label: item.name, value: item._id }));
  remoteGroupLoaded.value = true;
}

function remoteGroupLabel(id?: string | null) {
  return remoteGroupOptions.value.find(item => item.value === id)?.label;
}

function weightRuleLabel(id?: string | null) {
  return props.weightRuleOptions.find(item => item.value === id)?.label;
}

// ---- 展示格式化：原值空 → '--'，新值空 → '无' ----
function fmtOri(value?: number | string | null) {
  return value === null || value === undefined || value === '' ? '--' : String(value);
}

function fmtNew(value?: number | string | null) {
  return value === null || value === undefined || value === '' ? $t('common.none') : String(value);
}

/** 空值归一：null / undefined / '' 视为同一（比较差异前先归一） */
function normValue(value?: number | string | null) {
  return value === null || value === undefined || value === '' ? '' : String(value);
}

/** 新值与原值是否不同（空值等价、数字与同值字符串等价） */
function isChanged(ori?: number | string | null, next?: number | string | null) {
  return normValue(ori) !== normValue(next);
}

/** 新值文案（统一来自被同步的承运网络） */
function newValueText(field: SyncField): string {
  const carrier = props.carrier;
  if (!carrier) return '--';
  if (field === 'oilRate') return fmtNew(carrier.oilRate);
  if (field === 'feeCustom') return fmtNew(carrier.feeCustom);
  if (field === 'weightRuleId') return fmtNew(weightRuleLabel(carrier.weightRuleId));
  return fmtNew(remoteGroupLabel(carrier.remoteGroupId));
}

// ---- 渠道列表（仅取关联当前承运网络的渠道；收货 / 发货渠道归一为同一行结构） ----
function toRow(item: SyncChannel): SyncRow {
  const carrier = props.carrier;

  return {
    _id: item._id,
    name: item.name,
    oriOilRate: fmtOri(item.oilRate),
    oriFeeCustom: fmtOri(item.feeCustom),
    oriWeightRule: fmtOri(item.weightRuleName),
    oriWeightOff: fmtOri(item.weightRuleWeightOff),
    oriRemoteGroup: fmtOri(item.remoteGroup),
    // 差异标记：计泡比以「承运网络 weightOff vs 渠道计泡规则的 weightOff」对照
    changed: {
      oilRate: !!carrier && isChanged(item.oilRate, carrier.oilRate),
      feeCustom: !!carrier && isChanged(item.feeCustom, carrier.feeCustom),
      weightRuleId: !!carrier && isChanged(item.weightRuleId, carrier.weightRuleId),
      weightRuleWeightOff: !!carrier && isChanged(item.weightRuleWeightOff, carrier.weightOff),
      remoteGroupId: !!carrier && isChanged(item.remoteGroupId, carrier.remoteGroupId)
    },
    checked: { oilRate: true, feeCustom: true, weightRuleId: true, remoteGroupId: true }
  };
}

async function loadChannels() {
  const carrier = props.carrier;
  rows.value = [];
  if (!carrier) return;

  loading.value = true;
  try {
    if (channelType.value === 0) {
      // 仅取关联该承运网络的收货渠道（scene=1 由 service 固定，保留 fillName 回填）
      const { data, error } = await fetchGetChannelList({ page: 1, size: 500, where: { carrierId: carrier._id } });
      rows.value = error || !data ? [] : data.list.map(toRow);
    } else {
      // 仅取关联该承运网络的发货渠道（scene=1 保留 weightRuleName / remoteGroup 回填）
      const { data, error } = await fetchGetChannelOutList({ page: 1, size: 500, scene: 1, carrierId: carrier._id });
      rows.value = error || !data ? [] : data.list.map(toRow);
    }
  } finally {
    loading.value = false;
  }
}

function handleChannelTypeChange(value: string | number) {
  const next: 0 | 1 = value === 1 ? 1 : 0;
  if (next === channelType.value) return;
  channelType.value = next;
  loadChannels();
}

function removeRow(row: SyncRow) {
  rows.value = rows.value.filter(item => item !== row);
}

// ---- 字段列级全选：表头勾选框 ↔ 单元格勾选框联动 ----
/** 每个可同步字段的汇总勾选态（表头「全选 / 半选」），单次遍历 O(4n) */
const fieldCheckState = computed(() => {
  const total = rows.value.length;
  const state = {} as Record<SyncField, { checked: boolean; indeterminate: boolean }>;

  SYNC_FIELDS.forEach(field => {
    const checkedCount = rows.value.filter(row => row.checked[field]).length;
    state[field] = {
      checked: total > 0 && checkedCount === total,
      indeterminate: checkedCount > 0 && checkedCount < total
    };
  });

  return state;
});

/** 表头勾选：全选 / 全不选该字段列的所有渠道 */
function toggleFieldAll(field: SyncField, checked: boolean) {
  rows.value.forEach(row => {
    row.checked[field] = checked;
  });
}

// ---- 行级勾选：行勾选框 ↔ 该行单元格勾选框联动 ----
/** 行勾选态：4 个字段全勾 → 勾选；部分勾选 → 半选；全不勾 → 未勾（vxe 行框不支持行级半选，故用自绘列） */
function rowCheckState(row: SyncRow) {
  const checkedCount = SYNC_FIELDS.filter(field => row.checked[field]).length;
  return {
    checked: checkedCount === SYNC_FIELDS.length,
    indeterminate: checkedCount > 0 && checkedCount < SYNC_FIELDS.length
  };
}

/** 行勾选：整行 4 个字段全选 / 全不选 */
function toggleRowAll(row: SyncRow, checked: boolean) {
  SYNC_FIELDS.forEach(field => {
    row.checked[field] = checked;
  });
}

/** 表头行勾选态的汇总（全表所有行） */
const rowAllState = computed(() => {
  const total = rows.value.length;
  const fullCount = rows.value.filter(row => SYNC_FIELDS.every(field => row.checked[field])).length;
  const anyCount = rows.value.filter(row => SYNC_FIELDS.some(field => row.checked[field])).length;

  return {
    checked: total > 0 && fullCount === total,
    indeterminate: anyCount > 0 && fullCount < total
  };
});

/** 表头行框：全表所有行 4 个字段全选 / 全不选 */
function toggleAllRows(checked: boolean) {
  rows.value.forEach(row => toggleRowAll(row, checked));
}

// ---- 表格列（行勾选列与新值列的表头用 headerSlot 渲染勾选框，单元格用插槽渲染「勾选框 + 值」） ----
const columns = computed<VxeColumnRenderColumn[]>(() => [
  {
    key: 'rowCheck',
    title: '',
    width: 50,
    fixed: 'left',
    align: 'center',
    sortable: false,
    headerSlot: 'rowCheckHeader'
  },
  { key: 'name', title: $t('page.channelQuote.receive.name'), minWidth: 140, sortable: false },
  {
    key: 'oriOilRate',
    title: $t('page.dataManage.ship.carrier.sync.oriOilRate'),
    width: 90,
    align: 'center',
    sortable: false
  },
  {
    key: 'newOilRate',
    title: $t('page.dataManage.ship.carrier.sync.newOilRate'),
    width: 120,
    sortable: false,
    headerSlot: 'newOilRateHeader'
  },
  {
    key: 'oriFeeCustom',
    title: $t('page.dataManage.ship.carrier.sync.oriFeeCustom'),
    width: 90,
    align: 'center',
    sortable: false
  },
  {
    key: 'newFeeCustom',
    title: $t('page.dataManage.ship.carrier.sync.newFeeCustom'),
    width: 120,
    sortable: false,
    headerSlot: 'newFeeCustomHeader'
  },
  {
    key: 'oriWeightRule',
    title: $t('page.dataManage.ship.carrier.sync.oriWeightRule'),
    width: 110,
    align: 'center',
    sortable: false
  },
  {
    key: 'newWeightRule',
    title: $t('page.dataManage.ship.carrier.sync.newWeightRule'),
    width: 130,
    sortable: false,
    headerSlot: 'newWeightRuleHeader'
  },
  {
    key: 'oriWeightOff',
    title: $t('page.dataManage.ship.carrier.sync.oriWeightOff'),
    width: 90,
    align: 'center',
    sortable: false
  },
  {
    key: 'newWeightOff',
    title: $t('page.dataManage.ship.carrier.sync.newWeightOff'),
    width: 90,
    align: 'center',
    sortable: false
  },
  {
    key: 'oriRemoteGroup',
    title: $t('page.dataManage.ship.carrier.sync.oriRemoteGroup'),
    width: 90,
    align: 'center',
    sortable: false
  },
  {
    key: 'newRemoteGroup',
    title: $t('page.dataManage.ship.carrier.sync.newRemoteGroup'),
    width: 120,
    sortable: false,
    headerSlot: 'newRemoteGroupHeader'
  }
]);

// ---- 保存：仅提交「未被移除且至少勾选一个字段」的渠道 ----
async function handleSave() {
  const carrier = props.carrier;
  if (!carrier) return;

  const list = rows.value
    .map(row => ({ _id: row._id, fields: SYNC_FIELDS.filter(field => row.checked[field]) }))
    .filter(item => item.fields.length > 0);

  if (list.length === 0) {
    window.$message?.warning($t('page.dataManage.ship.carrier.sync.needField'));
    return;
  }

  saving.value = true;
  try {
    const { error } = await fetchSyncCarrierChannel({ _id: carrier._id, channelType: channelType.value, list });
    if (error) return;

    window.$message?.success($t('common.saveSuccess'));
    drawerVisible.value = false;
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.show,
  async value => {
    if (!value) return;
    channelType.value = 0;
    rows.value = [];
    await Promise.all([loadRemoteGroups(), loadChannels()]);
  }
);
</script>

<template>
  <CommonDrawer
    v-model:show="drawerVisible"
    :title="drawerTitle"
    width="min(94vw, 75%)"
    :loading="saving"
    :confirm-text="$t('common.save')"
    @submit="handleSave"
  >
    <div class="h-[calc(100vh_-_160px)] flex-col">
      <Table
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="null"
        show-action
        :show-seq="true"
        :action-width="80"
        action-align="center"
      >
        <template #operation-left>
          <NRadioGroup :value="channelType" :disabled="saving" @update:value="handleChannelTypeChange">
            <NRadioButton :value="1">{{ $t('page.channelQuote.ship.title') }}</NRadioButton>
            <NRadioButton :value="0">{{ $t('page.channelQuote.receive.title') }}</NRadioButton>
          </NRadioGroup>
          <LButton type="error">
            <template #icon><icon-ic-round-delete class="text-icon" /></template>
            {{ $t('common.batchDelete') }}
          </LButton>
        </template>

        <!-- 行勾选框：与整行单元格勾选框联动（全选 / 半选 / 全不选） -->
        <template #rowCheckHeader>
          <NCheckbox
            :checked="rowAllState.checked"
            :indeterminate="rowAllState.indeterminate"
            @update:checked="checked => toggleAllRows(checked)"
          />
        </template>

        <template #rowCheck="{ row }">
          <NCheckbox
            :checked="rowCheckState(row).checked"
            :indeterminate="rowCheckState(row).indeterminate"
            @update:checked="checked => toggleRowAll(row, checked)"
          />
        </template>

        <!-- 表头全选框：与下列单元格勾选框联动（全选 / 半选 / 全不选） -->
        <template #newOilRateHeader>
          <div class="flex items-center gap-6px">
            <NCheckbox
              :checked="fieldCheckState.oilRate.checked"
              :indeterminate="fieldCheckState.oilRate.indeterminate"
              @update:checked="checked => toggleFieldAll('oilRate', checked)"
            />
            <span>{{ $t('page.dataManage.ship.carrier.sync.newOilRate') }}</span>
          </div>
        </template>

        <template #newOilRate="{ row }">
          <div class="flex items-center gap-6px">
            <NCheckbox :checked="row.checked.oilRate" @update:checked="checked => (row.checked.oilRate = checked)" />
            <span :class="row.changed.oilRate ? 'rounded bg-error-50 px-4px py-1px font-600 text-error-600' : ''">
              {{ newValueText('oilRate') }}
            </span>
          </div>
        </template>

        <template #newFeeCustomHeader>
          <div class="flex items-center gap-6px">
            <NCheckbox
              :checked="fieldCheckState.feeCustom.checked"
              :indeterminate="fieldCheckState.feeCustom.indeterminate"
              @update:checked="checked => toggleFieldAll('feeCustom', checked)"
            />
            <span>{{ $t('page.dataManage.ship.carrier.sync.newFeeCustom') }}</span>
          </div>
        </template>

        <template #newFeeCustom="{ row }">
          <div class="flex items-center gap-6px">
            <NCheckbox
              :checked="row.checked.feeCustom"
              @update:checked="checked => (row.checked.feeCustom = checked)"
            />
            <span :class="row.changed.feeCustom ? 'rounded bg-error-50 px-4px py-1px font-600 text-error-600' : ''">
              {{ newValueText('feeCustom') }}
            </span>
          </div>
        </template>

        <template #newWeightRuleHeader>
          <div class="flex items-center gap-6px">
            <NCheckbox
              :checked="fieldCheckState.weightRuleId.checked"
              :indeterminate="fieldCheckState.weightRuleId.indeterminate"
              @update:checked="checked => toggleFieldAll('weightRuleId', checked)"
            />
            <span>{{ $t('page.dataManage.ship.carrier.sync.newWeightRule') }}</span>
          </div>
        </template>

        <template #newWeightRule="{ row }">
          <div class="flex items-center gap-6px">
            <NCheckbox
              :checked="row.checked.weightRuleId"
              @update:checked="checked => (row.checked.weightRuleId = checked)"
            />
            <span :class="row.changed.weightRuleId ? 'rounded bg-error-50 px-4px py-1px font-600 text-error-600' : ''">
              {{ newValueText('weightRuleId') }}
            </span>
          </div>
        </template>

        <template #newWeightOff="{ row }">
          <span
            :class="row.changed.weightRuleWeightOff ? 'rounded bg-error-50 px-4px py-1px font-600 text-error-600' : ''"
          >
            {{ carrier ? fmtNew(carrier.weightOff) : '--' }}
          </span>
        </template>

        <template #newRemoteGroupHeader>
          <div class="flex items-center gap-6px">
            <NCheckbox
              :checked="fieldCheckState.remoteGroupId.checked"
              :indeterminate="fieldCheckState.remoteGroupId.indeterminate"
              @update:checked="checked => toggleFieldAll('remoteGroupId', checked)"
            />
            <span>{{ $t('page.dataManage.ship.carrier.sync.newRemoteGroup') }}</span>
          </div>
        </template>

        <template #newRemoteGroup="{ row }">
          <div class="flex items-center gap-6px">
            <NCheckbox
              :checked="row.checked.remoteGroupId"
              @update:checked="checked => (row.checked.remoteGroupId = checked)"
            />
            <span :class="row.changed.remoteGroupId ? 'rounded bg-error-50 px-4px py-1px font-600 text-error-600' : ''">
              {{ newValueText('remoteGroupId') }}
            </span>
          </div>
        </template>

        <template #action="{ row }">
          <LButton type="error" text @click="removeRow(row)">
            {{ $t('page.dataManage.ship.carrier.sync.remove') }}
          </LButton>
        </template>
      </Table>
    </div>
  </CommonDrawer>
</template>

<style scoped></style>
