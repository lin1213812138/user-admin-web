<script setup lang="ts">
/**
 * 承运网络 · 附加费同步到渠道（二级侧滑抽屉）
 *
 * 把附加费维护弹窗中勾选的加收，同步到「该承运网络关联」的收货 / 发货渠道：
 * - 目标渠道仅取 carrierId = 当前承运网络的渠道（收货渠道 /channel/query、发货渠道 /channel-out/query）；
 * - 列表列与「收货渠道」列表页一致（按用户要求**去掉「创建时间」**），收货 / 发货两个 tab 共用同一套列；
 * - 勾选列走 vxe 内置 checkbox（`show-checkbox` + `row-config.keyField` + `@selection-change`），
 *   **默认全不勾**（勾选即选择）；切换收货 / 发货渠道会重载列表并清空勾选；
 * - 保存前二次确认「将把 N 条费用同步到 M 个渠道」；
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

/**
 * 目标渠道行（收货 / 发货归一）。
 * 勾选态由 vxe 内置 checkbox 维护、不落到数据行；下列可选字段供列表列展示
 * （收货渠道查询固定带 `scene=1`、发货渠道本次补传 `scene=1`，回填后才有值）。
 */
interface SyncChannelRow {
  _id: string;
  name: string;
  /** 渠道代码 */
  code?: string | null;
  /** 承运网络名称（scene=1 回填） */
  carrier?: string | null;
  /** 渠道分组名称（scene=1 回填） */
  channelGroup?: string | null;
  /** 所属站点名称（scene=1 回填） */
  site?: string | null;
  /** 计泡规则名称（scene=1 回填） */
  weightRuleName?: string | null;
  /** 状态 0-停用 1-启用 */
  status?: number | null;
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

/** 表格勾选行（vxe 内置 checkbox，由 `@selection-change` 回传）；保存时按此提交 refIds */
const checkedRows = ref<SyncChannelRow[]>([]);

function handleSelectionChange(list: SyncChannelRow[]) {
  checkedRows.value = list;
}

/** 表格实例：用于清空 vxe 内部勾选态（`Table` 已 expose `setAllCheckboxRow`） */
const tableRef = ref<InstanceType<typeof Table> | null>(null);

// ---- 渠道列表（仅该承运网络关联的渠道；两个 tab 共用同一套列，故都需回填名称类字段） ----
async function loadChannels() {
  const carrier = props.carrier;
  // 先清 vxe 勾选再换数据：`row-config.keyField` 会按 `_id` 记忆勾选，顺序颠倒会把旧勾选恢复回来
  await tableRef.value?.setAllCheckboxRow(false);
  rows.value = [];
  checkedRows.value = [];
  if (!carrier) return;

  loading.value = true;
  try {
    if (channelType.value === 0) {
      // 收货渠道：service 内固定 scene=1（回填 carrier / channelGroup / site / weightRuleName）
      const { data, error } = await fetchGetChannelList({ page: 1, size: 500, where: { carrierId: carrier._id } });
      rows.value = error || !data ? [] : (data.list as SyncChannelRow[]);
    } else {
      // 发货渠道：必须显式传 scene=1，否则名称类字段不回填（后端按 scene 触发 fillName）
      const { data, error } = await fetchGetChannelOutList({
        page: 1,
        size: 500,
        channelType: 0,
        scene: 1,
        carrierId: carrier._id
      });
      rows.value = error || !data ? [] : (data.list as unknown as SyncChannelRow[]);
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

/** 列与「收货渠道」列表页一致（按用户要求去掉「创建时间」）；收货 / 发货两个 tab 共用 */
const columns: VxeColumnRenderColumn[] = [
  { key: 'code', title: $t('page.channelQuote.receive.code'), minWidth: 110, sortable: false },
  { key: 'name', title: $t('page.channelQuote.receive.name'), minWidth: 160, sortable: false },
  { key: 'carrier', title: $t('page.channelQuote.receive.form.carrier'), minWidth: 120, sortable: false },
  { key: 'channelGroup', title: $t('page.channelQuote.receive.form.channelGroup'), minWidth: 120, sortable: false },
  { key: 'site', title: $t('page.channelQuote.receive.form.site'), minWidth: 120, sortable: false },
  { key: 'weightRuleName', title: $t('page.channelQuote.receive.form.weightRule'), minWidth: 120, sortable: false },
  { key: 'status', title: $t('common.status'), type: 'status', width: 100, align: 'center', sortable: false }
];

// ---- 保存（未勾费用 / 未勾渠道均警示且不发请求；通过了再二次确认） ----
async function handleSave() {
  if (props.feeExtIds.length === 0) {
    window.$message?.warning($t('page.dataManage.ship.carrier.feeExtDrawer.needFeeExt'));
    return;
  }

  const refIds = checkedRows.value.map(row => row._id);
  if (refIds.length === 0) {
    window.$message?.warning($t('page.dataManage.ship.carrier.feeExtDrawer.needChannel'));
    return;
  }

  window.$dialog?.warning({
    title: $t('common.tip'),
    content: $t('page.dataManage.ship.carrier.feeExtDrawer.syncConfirm', {
      n: props.feeExtIds.length,
      m: refIds.length
    }),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
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
  });
}

watch(
  () => props.show,
  async value => {
    if (!value) return;
    channelType.value = 0;
    rows.value = [];
    checkedRows.value = [];
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
      <Table
        ref="tableRef"
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="null"
        :row-config="{ keyField: '_id' }"
        show-checkbox
        show-seq
        @selection-change="handleSelectionChange"
      >
        <template #operation-left>
          <NRadioGroup :value="channelType" :disabled="saving" @update:value="handleChannelTypeChange">
            <NRadioButton :value="1">{{ $t('page.channelQuote.ship.title') }}</NRadioButton>
            <NRadioButton :value="0">{{ $t('page.channelQuote.receive.title') }}</NRadioButton>
          </NRadioGroup>
        </template>

        <!-- 空值统一兜底 `--`（与项目其他列表口径一致） -->
        <template #code="{ row }">
          <span>{{ row.code || '--' }}</span>
        </template>
        <template #carrier="{ row }">
          <span>{{ row.carrier || '--' }}</span>
        </template>
        <template #channelGroup="{ row }">
          <span>{{ row.channelGroup || '--' }}</span>
        </template>
        <template #site="{ row }">
          <span>{{ row.site || '--' }}</span>
        </template>
        <template #weightRuleName="{ row }">
          <span>{{ row.weightRuleName || '--' }}</span>
        </template>
      </Table>
    </div>
  </CommonDrawer>
</template>

<style scoped></style>
