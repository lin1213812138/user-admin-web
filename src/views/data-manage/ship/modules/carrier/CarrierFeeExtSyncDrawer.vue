<script setup lang="ts">
/**
 * 承运网络 · 附加费同步到渠道（二级侧滑抽屉）
 *
 * 把附加费维护弹窗中勾选的加收，同步到「该承运网络关联」的收货 / 发货渠道：
 * - 目标渠道仅取 carrierId = 当前承运网络的渠道（收货渠道 /channel/query、发货渠道 /channel-out/query）；
 * - 勾选列自绘（表头全选 ↔ 行内联动，与「同步渠道」抽屉同款），加载后默认全勾；
 * - 落库接口：POST /channel-fee-ext/sync（ids = 勾选的源加收；refIds = 勾选的渠道）。
 */
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import CommonDrawer from '@/components/common/drawer.vue';
import { Table } from '@/components/Table';
import type { VxeColumnRenderColumn } from '@/components/Table';
import { fetchGetChannelList } from '@/service/api/channel';
import { fetchGetChannelOutList } from '@/service/api/channel-out';
import { fetchSyncChannelFeeExt } from '@/service/api/channel-fee-ext';

defineOptions({
  name: 'CarrierFeeExtSyncDrawer'
});

/** 目标渠道行（收货 / 发货归一；checked 为本次待同步勾选，默认全勾） */
interface SyncChannelRow {
  _id: string;
  name: string;
  checked: boolean;
}

interface Props {
  /** 抽屉可见性，use v-model:show */
  show?: boolean;
  /** 被同步的承运网络（决定目标渠道范围） */
  carrier?: Api.DataManageShip.Carrier | null;
  /** 要同步的附加费 _id（父级在打开前设置） */
  feeExtIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  carrier: null,
  feeExtIds: () => []
});

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.show,
  set: value => emit('update:show', value)
});

/** 抽屉标题：同步到渠道 - <承运网络名称>（与「动作 - 对象名」的既有口径一致） */
const drawerTitle = computed(() =>
  props.carrier?.name
    ? `${$t('page.dataManage.ship.carrier.feeExtDrawer.syncToChannel')} - ${props.carrier.name}`
    : $t('page.dataManage.ship.carrier.feeExtDrawer.syncToChannel')
);

/** 0-收货渠道（默认） 1-发货渠道（与后端 syncList 目标对象及「同步渠道」抽屉口径一致） */
const channelType = ref<0 | 1>(0);
const loading = ref(false);
const saving = ref(false);
const rows = ref<SyncChannelRow[]>([]);

// ---- 渠道列表（仅该承运网络关联的渠道） ----
async function loadChannels() {
  const carrier = props.carrier;
  rows.value = [];
  if (!carrier) return;

  loading.value = true;
  try {
    if (channelType.value === 0) {
      const { data, error } = await fetchGetChannelList({ page: 1, size: 500, where: { carrierId: carrier._id } });
      rows.value = error || !data ? [] : data.list.map(item => ({ _id: item._id, name: item.name, checked: true }));
    } else {
      const { data, error } = await fetchGetChannelOutList({
        page: 1,
        size: 500,
        channelType: 0,
        carrierId: carrier._id
      });
      rows.value = error || !data ? [] : data.list.map(item => ({ _id: item._id, name: item.name, checked: true }));
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

// ---- 勾选列（自绘：表头全选 ↔ 行内联动，口径同 CarrierSyncDrawer） ----
const headerCheckState = computed(() => {
  const total = rows.value.length;
  const checkedCount = rows.value.filter(row => row.checked).length;
  return {
    checked: total > 0 && checkedCount === total,
    indeterminate: checkedCount > 0 && checkedCount < total
  };
});

function toggleAll(checked: boolean) {
  rows.value.forEach(row => {
    row.checked = checked;
  });
}

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
  { key: 'name', title: $t('page.channelQuote.receive.name'), minWidth: 160, sortable: false }
]);

// ---- 保存 ----
async function handleSave() {
  if (props.feeExtIds.length === 0) {
    window.$message?.warning($t('page.dataManage.ship.carrier.feeExtDrawer.needFeeExt'));
    return;
  }

  const refIds = rows.value.filter(row => row.checked).map(row => row._id);
  if (refIds.length === 0) {
    window.$message?.warning($t('page.dataManage.ship.carrier.feeExtDrawer.needChannel'));
    return;
  }

  saving.value = true;
  try {
    const { error } = await fetchSyncChannelFeeExt({ ids: props.feeExtIds, refIds });
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
    await loadChannels();
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
      <Table :columns="columns" :data="rows" :loading="loading" :pagination="null">
        <template #operation-left>
          <NRadioGroup :value="channelType" :disabled="saving" @update:value="handleChannelTypeChange">
            <NRadioButton :value="1">{{ $t('page.channelQuote.ship.title') }}</NRadioButton>
            <NRadioButton :value="0">{{ $t('page.channelQuote.receive.title') }}</NRadioButton>
          </NRadioGroup>
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
      </Table>
    </div>
  </CommonDrawer>
</template>

<style scoped></style>
