<script setup lang="ts">
/**
 * 承运网络 · 附加费维护弹窗（一级侧滑抽屉）
 *
 * 列表 = 该承运网络的附加费（ChannelFeeExt，refId = 承运网络 _id）：
 * 列与「渠道加收」面板**完全一致**（费用名称 / 国家或地区 / 类型 / 条件 / 价格 / 备注 / 状态，仅列头不带「加收」字样）；
 * 新增 = **复用渠道加收的新增抽屉** `FeeExtOperateDrawer`（字段 / 校验 / 交互一致，唯一差别是 `refId`）；
 * 操作栏 = 行内「编辑 / 删除」（编辑复用同一抽屉 openEdit；删除走单条 delete，popconfirm 二次确认）；
 * 同步 = 勾选后打开「同步到渠道」抽屉，把勾选费用下发到该网络关联的收货 / 发货渠道。
 */
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import CommonDrawer from '@/components/common/drawer.vue';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { fetchDeleteChannelFeeExt, fetchGetChannelFeeExtList } from '@/service/api/channel-fee-ext';
import FeeExtOperateDrawer from '@/views/channel-quote/receive/modules/quote-setting/modules/fee-ext/FeeExtOperateDrawer.vue';
import CarrierFeeExtSyncDrawer from './CarrierFeeExtSyncDrawer.vue';

defineOptions({
  name: 'CarrierFeeExtDrawer'
});

/** 列表行：费用 + 本次待同步勾选（默认全勾） */
type FeeExtRow = Api.ChannelQuote.ChannelFeeExt & { checked: boolean };

interface Props {
  /** 抽屉可见性，use v-model:show */
  show?: boolean;
  /** 当前承运网络（附加费归属 refId） */
  carrier?: Api.DataManageShip.Carrier | null;
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

/** 抽屉标题：附加费 - <承运网络名称> */
const drawerTitle = computed(() =>
  props.carrier?.name
    ? `${$t('page.dataManage.ship.carrier.feeExtDrawer.title')} - ${props.carrier.name}`
    : $t('page.dataManage.ship.carrier.feeExtDrawer.title')
);

/** 类型文案（对齐后端 strategy；未知值按「按重量」兜底，口径同渠道加收面板） */
function strategyLabel(strategy?: Api.ChannelQuote.FeeExtStrategy) {
  if (strategy === 1) return $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byTicket');
  if (strategy === 2) return $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byItem');
  if (strategy === 3) return $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byWeightOver');

  return $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byWeight');
}

// ---- 费用列表（列与渠道加收面板一致；全量，不分页；打开时默认全勾） ----
const { data, loading, columns, getData } = useVxeTable<Api.ChannelQuote.ChannelFeeExtList, FeeExtRow>({
  api: async () => {
    const carrier = props.carrier;
    if (!carrier) return { list: [], total: 0 };
    const { data: res, error } = await fetchGetChannelFeeExtList({
      page: 1,
      size: 500,
      where: { refId: carrier._id }
    });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list.map(item => ({ ...item, checked: true })), total: r.total }),
  columns: () =>
    [
      {
        key: 'rowCheck',
        title: '',
        visible: true,
        width: 50,
        fixed: 'left',
        align: 'center',
        sortable: false,
        headerSlot: 'rowCheckHeader'
      },
      {
        key: 'name',
        title: $t('page.dataManage.ship.carrier.feeExtDrawer.col.name'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'country',
        title: $t('page.dataManage.ship.carrier.feeExtDrawer.col.country'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'strategy',
        title: $t('page.dataManage.ship.carrier.feeExtDrawer.col.type'),
        visible: true,
        minWidth: 130,
        sortable: false
      },
      {
        key: 'expr',
        title: $t('page.dataManage.ship.carrier.feeExtDrawer.col.condition'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'price',
        title: $t('page.dataManage.ship.carrier.feeExtDrawer.col.price'),
        visible: true,
        width: 120,
        align: 'right',
        sortable: false
      },
      { key: 'note', title: $t('common.remark'), visible: true, minWidth: 140, sortable: false },
      {
        key: 'status',
        title: $t('common.status'),
        type: 'status',
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  lazy: false,
  immediate: false,
  cacheKey: 'data-manage-ship-carrier-fee-ext'
});

/** 勾选列（自绘：表头全选 ↔ 行内联动，口径同 CarrierSyncDrawer） */
const headerCheckState = computed(() => {
  const total = data.value.length;
  const checkedCount = data.value.filter(row => row.checked).length;
  return {
    checked: total > 0 && checkedCount === total,
    indeterminate: checkedCount > 0 && checkedCount < total
  };
});

function toggleAll(checked: boolean) {
  data.value.forEach(row => {
    row.checked = checked;
  });
}

/** 重新取数（打开弹窗 / 新增、编辑、删除成功后；transform 会把每行重置为默认勾选） */
async function reload() {
  await getData();
}

/** 删除单条附加费（后端仅支持单条 _id，无批量路由；交互同渠道加收面板） */
async function handleDelete(row: Api.ChannelQuote.ChannelFeeExt) {
  const { error } = await fetchDeleteChannelFeeExt(row._id);
  if (error) return;

  window.$message?.success($t('common.deleteSuccess'));
  reload();
}

// ---- 新增附加费（复用渠道加收的新增抽屉，仅 refId 传承运网络） ----
const feeExtDrawerRef = ref<InstanceType<typeof FeeExtOperateDrawer> | null>(null);

// ---- 同步到渠道（二级抽屉） ----
const syncDrawerVisible = ref(false);
const syncFeeExtIds = ref<string[]>([]);

function handleSyncToChannel() {
  const ids = data.value.filter(row => row.checked).map(row => row._id);
  if (ids.length === 0) {
    window.$message?.warning($t('page.dataManage.ship.carrier.feeExtDrawer.needFeeExt'));
    return;
  }
  syncFeeExtIds.value = ids;
  syncDrawerVisible.value = true;
}

watch(
  () => props.show,
  async value => {
    if (!value) return;
    syncFeeExtIds.value = [];
    syncDrawerVisible.value = false;
    await reload();
  }
);
</script>

<template>
  <CommonDrawer v-model:show="drawerVisible" :title="drawerTitle" width="min(94vw, 75%)" :footer="false">
    <div class="h-[calc(100vh_-_160px)] flex-col">
      <Table :columns="columns" :data="data" :loading="loading" :pagination="null" show-action :action-width="140">
        <template #operation-left>
          <LButton type="primary" @click="feeExtDrawerRef?.open()">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('page.dataManage.ship.carrier.feeExtDrawer.addBtn') }}
          </LButton>
          <LButton type="primary" @click="handleSyncToChannel">
            {{ $t('page.dataManage.ship.carrier.feeExtDrawer.syncToChannel') }}
          </LButton>
        </template>
        <template #operation-right>
          <LButton circle :tooltip="$t('common.refresh')" @click="reload">
            <template #icon><icon-mdi-refresh class="text-icon" /></template>
          </LButton>
        </template>

        <template #rowCheckHeader>
          <NCheckbox
            :checked="headerCheckState.checked"
            :indeterminate="headerCheckState.indeterminate"
            @update:checked="toggleAll"
          />
        </template>

        <template #rowCheck="{ row }">
          <NCheckbox v-model:checked="row.checked" />
        </template>
        <template #country="{ row }">
          <span>{{ row.country || '--' }}</span>
        </template>
        <template #strategy="{ row }">
          <span>{{ strategyLabel(row.strategy) }}</span>
        </template>
        <template #expr="{ row }">
          <span>{{ row.expr || '--' }}</span>
        </template>
        <template #price="{ row }">
          <span>{{ row.price ?? '--' }}</span>
        </template>
        <template #note="{ row }">
          <span>{{ row.note || '--' }}</span>
        </template>
        <template #action="{ row }">
          <LButton type="primary" text @click="feeExtDrawerRef?.openEdit(row)">{{ $t('common.edit') }}</LButton>
          <LButton type="error" text popconfirm @positive-click="handleDelete(row)">{{ $t('common.delete') }}</LButton>
        </template>
      </Table>
    </div>

    <FeeExtOperateDrawer ref="feeExtDrawerRef" :channel-id="carrier?._id ?? ''" @submitted="reload" />

    <CarrierFeeExtSyncDrawer v-model:show="syncDrawerVisible" :carrier="carrier" :fee-ext-ids="syncFeeExtIds" />
  </CommonDrawer>
</template>

<style scoped></style>
