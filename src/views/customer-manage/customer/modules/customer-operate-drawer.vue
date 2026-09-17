<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import dayjs from 'dayjs';
import {
  fetchCreateCustomer,
  fetchGetBillModeList,
  fetchGetCustomerLevelList,
  fetchGetCustomerSourceList,
  fetchUpdateCustomer
} from '@/service/api/customer';
import { fetchGetGroupList } from '@/service/api/group';
import { fetchGetSiteList } from '@/service/api/site';
import { fetchGetUserList } from '@/service/api/user';
import GroupDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit' | 'detail';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 / 详情 */
  mode?: DrawerMode;
  /** 编辑 / 详情行数据 */
  row?: Api.SystemManage.Customer | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  mode: 'create',
  row: null
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  submitted: [];
}>();

const drawerVisible = computed({
  get: () => props.show,
  set: val => emit('update:show', val)
});

const isDetail = computed(() => props.mode === 'detail');
const isCreate = computed(() => props.mode === 'create');

const title = computed(() => {
  if (props.mode === 'edit') return $t('common.edit');
  if (props.mode === 'detail') return $t('common.detail');
  return $t('common.add');
});

const submitting = ref(false);

/** 三个卡片区块各持一个表单实例，提交时统一校验（对齐用户编辑抽屉的多表单先例） */
const basicFormRef = ref<InstanceType<typeof NFormWrap>>();
const settlementFormRef = ref<InstanceType<typeof NFormWrap>>();
const handlerFormRef = ref<InstanceType<typeof NFormWrap>>();

/* ------------------------------ 字典 / 下拉选项 ------------------------------ */

const levelOptions = ref<CommonType.Option<string>[]>([]);
const sourceOptions = ref<CommonType.Option<string>[]>([]);
const billModeList = ref<Api.SystemManage.BillModeItem[]>([]);
const siteOptions = ref<CommonType.Option<string>[]>([]);
const groupOptions = ref<CommonType.Option<string>[]>([]);
const userOptions = ref<CommonType.Option<string>[]>([]);
const optionsLoaded = ref(false);

function toOptions(list: { _id: string; name: string }[]): CommonType.Option<string>[] {
  return list.map(item => ({ label: item.name, value: item._id }));
}

/** 首次打开时并行加载全部字典（等级/来源/结算方式/站点/组别/用户） */
async function loadOptions() {
  if (optionsLoaded.value) return;

  const [levelRes, sourceRes, billModeRes, siteRes, groupRes, userRes] = await Promise.all([
    fetchGetCustomerLevelList(),
    fetchGetCustomerSourceList(),
    fetchGetBillModeList(),
    fetchGetSiteList({ page: 1, size: 999 }),
    fetchGetGroupList(),
    fetchGetUserList({ page: 1, size: 999, where: { status: 1 } })
  ]);

  levelOptions.value = toOptions(levelRes.data?.list ?? []);
  sourceOptions.value = toOptions(sourceRes.data?.list ?? []);
  billModeList.value = billModeRes.data?.list ?? [];
  siteOptions.value = toOptions(siteRes.data?.list ?? []);
  groupOptions.value = toOptions(groupRes.data?.list ?? []);
  userOptions.value = toOptions(userRes.data?.list ?? []);
  optionsLoaded.value = true;
}

/* ------------------------------ 表单数据 ------------------------------ */

const withholdOptions = computed<CommonType.Option<Api.SystemManage.CustomerWithhold>[]>(() => [
  { label: '不扣货', value: 0 },
  { label: '信用额度', value: 1 },
  { label: '结算周期', value: 2 },
  { label: '信用额度 + 结算周期', value: 3 }
]);

const billGenModeOptions = computed<CommonType.Option<Api.SystemManage.CustomerBillGenMode>[]>(() => [
  { label: '手工生成', value: 0 },
  { label: '按账单结算周期', value: 1 }
]);

const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

/** 表单数据模型（contractRange 为合同有效期临时字段，提交时拆为毫秒时间戳） */
const model = reactive<Api.SystemManage.CustomerCreateParams & { contractRange?: [number, number] | null }>({
  code: '',
  name: '',
  account: '',
  contact: '',
  mobile: '',
  email: '',
  address: '',
  wx: '',
  qq: '',
  sourceId: undefined,
  levelId: undefined,
  status: 1,
  tag: '',
  taxInfo: '',
  note: '',
  billModeId: undefined,
  withhold: 0,
  creditLimit: 0,
  contractRange: null,
  billGenMode: 0,
  siteId: undefined,
  groupId: undefined,
  salesmanId: undefined,
  serviceId: undefined,
  pickerId: undefined,
  cashierId: undefined
});

/** 当前选中的结算方式 */
const selectedBillMode = computed(() => billModeList.value.find(item => item._id === model.billModeId) ?? null);

const BILL_GEN_STATUS_MAP: Record<number, string> = {
  0: '已预报',
  1: '已收货',
  2: '已出库',
  3: '转运中',
  4: '已送达'
};

/** 关联运单状态展示文案（来自结算方式，只读） */
const billGenStatusText = computed(() =>
  (selectedBillMode.value?.billGenStatus ?? []).map(status => BILL_GEN_STATUS_MAP[status] ?? status).join('、')
);

/** 基本信息（卡片 1） */
const basicItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.manage.customer.customerCode'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.customer.form.codePlaceholder')
  },
  {
    key: 'name',
    label: $t('page.manage.customer.customerName'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.manage.customer.form.namePlaceholder')
  },
  {
    key: 'account',
    label: $t('page.manage.customer.account'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.manage.customer.form.accountPlaceholder')
  },
  {
    key: 'contact',
    label: $t('page.manage.customer.contactName'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.customer.form.contactPlaceholder')
  },
  {
    key: 'mobile',
    label: $t('page.manage.customer.contactPhone'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.customer.form.mobilePlaceholder')
  },
  {
    key: 'email',
    label: $t('page.manage.customer.email'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.customer.form.emailPlaceholder')
  },
  {
    key: 'address',
    label: $t('page.manage.customer.address'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.customer.form.addressPlaceholder')
  },
  { key: 'wx', label: $t('page.manage.customer.wx'), type: 'input', span: 8 },
  { key: 'qq', label: $t('page.manage.customer.qq'), type: 'input', span: 8 },
  {
    key: 'sourceId',
    label: $t('page.manage.customer.customerSource'),
    type: 'select',
    span: 8,
    options: sourceOptions.value,
    placeholder: $t('page.manage.customer.form.sourcePlaceholder')
  },
  {
    key: 'levelId',
    label: $t('page.manage.customer.customerLevel'),
    type: 'select',
    span: 8,
    options: levelOptions.value,
    placeholder: $t('page.manage.customer.form.levelPlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.customer.status'),
    type: 'select',
    span: 8,
    options: statusOptions.value,
    placeholder: $t('page.manage.customer.form.statusPlaceholder')
  },
  { key: 'tag', label: $t('page.manage.customer.tag'), type: 'textarea', span: 8 },
  { key: 'taxInfo', label: $t('page.manage.customer.taxInfo'), type: 'textarea', span: 8 },
  { key: 'note', label: $t('page.manage.customer.remark'), type: 'textarea', span: 8 }
]);

/** 结算设置（卡片 2） */
const settlementItems = computed<FormItemConfig[]>(() => [
  {
    key: 'billModeId',
    label: $t('page.manage.customer.billMode'),
    type: 'select',
    span: 8,
    options: billModeList.value.map(item => ({ label: item.name, value: item._id })),
    placeholder: $t('page.manage.customer.form.billModePlaceholder')
  },
  {
    key: 'withhold',
    label: $t('page.manage.customer.withhold'),
    type: 'select',
    span: 8,
    options: withholdOptions.value,
    placeholder: $t('page.manage.customer.form.withholdPlaceholder')
  },
  {
    key: 'creditLimit',
    label: $t('page.manage.customer.creditLimit'),
    type: 'number',
    span: 8,
    placeholder: $t('page.manage.customer.form.creditLimitPlaceholder')
  },
  { key: 'contractRange', label: $t('page.manage.customer.contractRange'), type: 'custom', span: 8 },
  {
    key: 'billGenMode',
    label: $t('page.manage.customer.billGenMode'),
    type: 'select',
    span: 8,
    options: billGenModeOptions.value,
    placeholder: $t('page.manage.customer.form.billGenModePlaceholder')
  },
  {
    key: 'billGenStatusText',
    label: $t('page.manage.customer.billGenStatus'),
    type: 'custom',
    span: 8
  }
]);

/** 专属经办（卡片 3） */
const handlerItems = computed<FormItemConfig[]>(() => [
  {
    key: 'siteId',
    label: $t('page.manage.customer.site'),
    type: 'select',
    span: 8,
    options: siteOptions.value,
    placeholder: $t('page.manage.customer.form.sitePlaceholder')
  },
  {
    key: 'groupId',
    label: $t('page.manage.customer.group'),
    type: 'select',
    span: 8,
    options: groupOptions.value,
    placeholder: $t('page.manage.customer.form.groupPlaceholder')
  },
  {
    key: 'salesmanId',
    label: $t('page.manage.customer.salesman'),
    type: 'select',
    span: 8,
    options: userOptions.value,
    placeholder: $t('page.manage.customer.form.salesmanPlaceholder')
  },
  {
    key: 'serviceId',
    label: $t('page.manage.customer.service'),
    type: 'select',
    span: 8,
    options: userOptions.value,
    placeholder: $t('page.manage.customer.form.servicePlaceholder')
  },
  {
    key: 'pickerId',
    label: $t('page.manage.customer.picker'),
    type: 'select',
    span: 8,
    options: userOptions.value,
    placeholder: $t('page.manage.customer.form.pickerPlaceholder')
  },
  {
    key: 'cashierId',
    label: $t('page.manage.customer.cashier'),
    type: 'select',
    span: 8,
    options: userOptions.value,
    placeholder: $t('page.manage.customer.form.cashierPlaceholder')
  }
]);

/* ------------------------------ 回填 / 重置 / 提交 ------------------------------ */

function fillFormByRow() {
  const row = props.row;
  if (!row) return;

  model.code = row.code ?? '';
  model.name = row.name ?? '';
  model.account = row.account ?? '';
  model.contact = row.contact ?? '';
  model.mobile = row.mobile ?? '';
  model.email = row.email ?? '';
  model.address = row.address ?? '';
  model.wx = row.wx ?? '';
  model.qq = row.qq ?? '';
  model.sourceId = row.sourceId || undefined;
  model.levelId = row.levelId || undefined;
  model.status = row.status ?? 1;
  model.tag = row.tag ?? '';
  model.taxInfo = row.taxInfo ?? '';
  model.note = row.note ?? '';
  model.billModeId = row.billModeId || undefined;
  model.withhold = row.withhold ?? 0;
  model.creditLimit = row.creditLimit ?? 0;
  model.contractRange =
    row.contractStartDate && row.contractEndDate ? [row.contractStartDate, row.contractEndDate] : null;
  model.billGenMode = row.billGenMode ?? 0;
  model.siteId = row.siteId || undefined;
  model.groupId = row.groupId || undefined;
  model.salesmanId = row.salesmanId || undefined;
  model.serviceId = row.serviceId || undefined;
  model.pickerId = row.pickerId || undefined;
  model.cashierId = row.cashierId || undefined;
}

function resetForm() {
  model.code = '';
  model.name = '';
  model.account = '';
  model.contact = '';
  model.mobile = '';
  model.email = '';
  model.address = '';
  model.wx = '';
  model.qq = '';
  model.sourceId = undefined;
  model.levelId = undefined;
  model.status = 1;
  model.tag = '';
  model.taxInfo = '';
  model.note = '';
  model.billModeId = undefined;
  model.withhold = 0;
  model.creditLimit = 0;
  model.contractRange = null;
  model.billGenMode = 0;
  model.siteId = undefined;
  model.groupId = undefined;
  model.salesmanId = undefined;
  model.serviceId = undefined;
  model.pickerId = undefined;
  model.cashierId = undefined;
}

/** 组装提交参数：剔除派生展示字段，合同有效期拆为毫秒时间戳，空串转 undefined 避免覆盖唯一字段 */
function buildPayload(): Api.SystemManage.CustomerCreateParams {
  const { contractRange, ...rest } = model;

  return {
    ...rest,
    code: rest.code?.trim() || undefined,
    name: rest.name.trim(),
    account: rest.account.trim(),
    contractStartDate: contractRange?.[0],
    contractEndDate: contractRange?.[1]
  };
}

async function handleSubmit() {
  // 三个卡片区块表单统一校验，任一失败即阻止提交
  const results = await Promise.all([
    basicFormRef.value?.validate(),
    settlementFormRef.value?.validate(),
    handlerFormRef.value?.validate()
  ]);
  if (results.some(pass => pass === false)) {
    return;
  }

  submitting.value = true;

  try {
    if (isCreate.value) {
      const { error } = await fetchCreateCustomer(buildPayload());
      if (error) return;
      window.$message?.success($t('common.addSuccess'));
    } else {
      const { error } = await fetchUpdateCustomer({ _id: props.row!._id, ...buildPayload() });
      if (error) return;
      window.$message?.success($t('common.updateSuccess'));
    }

    drawerVisible.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.show,
  val => {
    if (!val) return;

    loadOptions();

    if (isCreate.value) {
      resetForm();
    } else {
      fillFormByRow();
    }
  }
);

/** 合同有效期展示（detail 态只读文本也走插槽，统一格式化） */
function contractRangeText(range?: [number, number] | null) {
  if (!range || range.length !== 2) return '';
  return `${dayjs(range[0]).format('YYYY-MM-DD')} ~ ${dayjs(range[1]).format('YYYY-MM-DD')}`;
}
</script>

<template>
  <GroupDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="!isDetail"
    width="960"
    @submit="handleSubmit"
  >
    <div class="flex flex-col gap-16px">
      <!-- 卡片 1：基本信息 -->
      <NCard content-style="padding-top: 12px;">
        <template #header>
          <div class="flex items-center gap-8px">
            <span class="h-16px w-3px rounded-2px bg-primary" />
            <span class="text-15px font-600">{{ $t('page.manage.customer.basicInfo') }}</span>
          </div>
        </template>
        <NFormWrap
          ref="basicFormRef"
          :model="model"
          :items="basicItems"
          :grid-x-gap="16"
          :mode="isDetail ? 'view' : 'edit'"
        />
      </NCard>

      <!-- 卡片 2：结算设置 -->
      <NCard content-style="padding-top: 12px;">
        <template #header>
          <div class="flex items-center gap-8px">
            <span class="h-16px w-3px rounded-2px bg-primary" />
            <span class="text-15px font-600">{{ $t('page.manage.customer.settlementInfo') }}</span>
          </div>
        </template>
        <NFormWrap
          ref="settlementFormRef"
          :model="model"
          :items="settlementItems"
          :grid-x-gap="16"
          :mode="isDetail ? 'view' : 'edit'"
        >
          <!-- 关联运单状态（来自结算方式，只读派生） -->
          <template #billGenStatusText>
            <span class="w-full">{{ billGenStatusText || '-' }}</span>
          </template>

          <!-- 合同有效期 -->
          <template #contractRange>
            <NDatePicker
              v-if="!isDetail"
              v-model:value="model.contractRange"
              type="daterange"
              class="w-full"
              clearable
            />
            <span v-else class="w-full">{{ contractRangeText(model.contractRange) || '-' }}</span>
          </template>
        </NFormWrap>
      </NCard>

      <!-- 卡片 3：专属经办 -->
      <NCard content-style="padding-top: 12px;">
        <template #header>
          <div class="flex items-center gap-8px">
            <span class="h-16px w-3px rounded-2px bg-primary" />
            <span class="text-15px font-600">{{ $t('page.manage.customer.handlerInfo') }}</span>
          </div>
        </template>
        <NFormWrap
          ref="handlerFormRef"
          :model="model"
          :items="handlerItems"
          :grid-x-gap="16"
          :mode="isDetail ? 'view' : 'edit'"
        />
      </NCard>
    </div>
  </GroupDrawer>
</template>

<style scoped></style>
