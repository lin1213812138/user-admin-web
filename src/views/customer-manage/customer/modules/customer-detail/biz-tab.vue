<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { $t } from '@/locales';
import { fetchGetBillModeList } from '@/service/api/customer';

defineOptions({ name: 'BizTab' });

interface Props {
  /** 详情客户（/customer/get 返回，含 fillName 回填的 billMode/level/source/site/group 等名称） */
  customer: Api.SystemManage.Customer;
}

const props = defineProps<Props>();

/** 结算方式字典（推导结算周期/结算日期/关联运单状态，与新增/编辑抽屉的派生逻辑一致） */
const billModeList = ref<Api.SystemManage.BillModeItem[]>([]);

const selectedBillMode = computed(
  () => billModeList.value.find(item => item._id === props.customer.billModeId) ?? null
);

const WITHHOLD_MAP: Record<number, string> = {
  0: '不扣货',
  1: '信用额度',
  2: '结算周期',
  3: '信用额度 + 结算周期'
};

const BILL_GEN_MODE_MAP: Record<number, string> = {
  0: '手工生成',
  1: '按账单结算周期'
};

const BILL_GEN_STATUS_MAP: Record<number, string> = {
  0: '已预报',
  1: '已收货',
  2: '已出库',
  3: '转运中',
  4: '已送达'
};

const BILL_PERIOD_MAP: Record<number, string> = {
  0: '每天',
  1: '每周',
  2: '每月'
};

/** 结算周期（每天 0-23 点 / 每周 1-周1~7-周7 / 每月 1-28，-1 为最后一天；签收结/现结/到付无周期） */
const billPeriodText = computed(() => {
  const billMode = selectedBillMode.value;
  if (!billMode || ![1, 2, 3].includes(billMode.sysType ?? 0)) return '--';
  return BILL_PERIOD_MAP[billMode.billPeriod ?? -1] ?? '--';
});

const billDayText = computed(() => {
  const billMode = selectedBillMode.value;
  if (!billMode || billMode.billDay === undefined || billMode.billDay === null) return '--';
  if (billMode.billDay === -1) return '最后一天';
  return String(billMode.billDay);
});

const billGenStatusText = computed(() =>
  (selectedBillMode.value?.billGenStatus ?? []).map(status => BILL_GEN_STATUS_MAP[status] ?? status).join('、')
);

const contractRangeText = computed(() => {
  const { contractStartDate, contractEndDate } = props.customer;
  if (!contractStartDate || !contractEndDate) return '--';
  return `${formatDate(contractStartDate)} ~ ${formatDate(contractEndDate)}`;
});

function formatDate(ts?: number) {
  return ts ? new Date(ts).toISOString().slice(0, 10) : '--';
}

/** 只读描述项（对齐老系统「业务与财税」tab 字段排布） */
const items = computed(() => [
  { label: $t('page.manage.customer.billMode'), value: props.customer.billMode || '--' },
  { label: $t('page.manage.customer.withhold'), value: WITHHOLD_MAP[props.customer.withhold ?? 0] },
  { label: $t('page.manage.customer.creditLimit'), value: props.customer.creditLimit ?? 0 },
  { label: $t('page.manage.customer.detail.billPeriod'), value: billPeriodText.value },
  { label: $t('page.manage.customer.detail.billDay'), value: billDayText.value },
  { label: $t('page.manage.customer.detail.billPerson'), value: props.customer.billPerson || '--' },
  { label: $t('page.manage.customer.contractRange'), value: contractRangeText.value },
  { label: $t('page.manage.customer.billGenMode'), value: BILL_GEN_MODE_MAP[props.customer.billGenMode ?? 0] },
  { label: $t('page.manage.customer.detail.billGenStatus'), value: billGenStatusText.value || '--' },
  { label: $t('page.manage.customer.service'), value: props.customer.service || '--' },
  { label: $t('page.manage.customer.salesman'), value: props.customer.salesman || '--' },
  { label: $t('page.manage.customer.site'), value: props.customer.site || '--' },
  { label: $t('page.manage.customer.group'), value: props.customer.group || '--' },
  { label: $t('page.manage.customer.cashier'), value: props.customer.cashier || '--' },
  { label: $t('page.manage.customer.picker'), value: props.customer.picker || '--' }
]);

onMounted(async () => {
  const { data, error } = await fetchGetBillModeList();
  if (!error && data) billModeList.value = data.list;
});
</script>

<template>
  <NDescriptions label-placement="left" :column="3">
    <NDescriptionsItem v-for="item in items" :key="item.label" :label="item.label">
      {{ item.value }}
    </NDescriptionsItem>
  </NDescriptions>
</template>

<style scoped></style>
