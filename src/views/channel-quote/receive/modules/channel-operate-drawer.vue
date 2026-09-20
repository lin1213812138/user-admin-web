<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import type { SelectOption } from 'naive-ui';
import NFormWrap from '@/components/Form/index.vue';
import type { FormItemConfig } from '@/components/Form/index.vue';
import Drawer from '@/components/common/drawer.vue';
import { fetchCreateChannel, fetchGetChannel, fetchUpdateChannel } from '@/service/api/channel';
import { fetchGetCarrierList, fetchGetChannelGroupList, fetchGetWeightRuleList } from '@/service/api/data-manage-ship';
import { fetchGetNoRuleList } from '@/service/api/no-rule';
import { fetchGetItemNoRuleList } from '@/service/api/data-manage-no-rule';
import { fetchGetPrintTemplateList } from '@/service/api/print-format';
import { fetchGetSiteList } from '@/service/api/site';
import { fetchGetChannelOutList } from '@/service/api/channel-out';
import { fetchGetRemoteGroupList } from '@/service/api/remote-group';
import { fetchGetRouteGroupList } from '@/service/api/route-group';
import { fetchGetProductGroupList } from '@/service/api/data-manage-archive';

type Mode = 'create' | 'edit' | 'detail';
type Model = Record<string, unknown>;

/** 转单号规则 = 内置「发货渠道获取」的 _id（tms-user NO_RULE_CONSTANT.BUILTIN.CHANNEL_OUT） */
const NO_RULE_CHANNEL_OUT = '2';

const emit = defineEmits<{
  submitted: [];
}>();

const visible = ref(false);
const mode = ref<Mode>('create');
const loading = ref(false);

/**
 * 空模型：所有空值统一用 null / 空数组占位，**不写空字符串**，
 * 避免把 '' 当成有效值参与校验与提交。
 */
function emptyModel(): Model {
  return {
    _id: null,
    code: null,
    name: null,
    carrierId: null,
    channelGroupId: null,
    channelOutId: null,
    noRuleId: null,
    itemNoRuleId: null,
    channelNoRuleId: null,
    customsNoRuleId: null,
    labelTemplateId: null,
    customerEnable: 1,
    weightRuleId: null,
    remoteGroupId: null,
    oilRate: null,
    feeCustom: null,
    siteIds: [],
    productGroupIds: [],
    routeGroupId: null,
    tag: null,
    note: null
  };
}

const model = reactive<Model>(emptyModel());

const title = computed(() => {
  const base = $t('page.channelQuote.receive.title');
  const op =
    mode.value === 'create' ? $t('common.add') : mode.value === 'edit' ? $t('common.edit') : $t('common.detail');
  return `${op}${base}`;
});

// ---- 选项数据源：抽屉首次打开时并行拉取，失败静默保留空列表 ----
const carrierOptions = ref<SelectOption[]>([]);
const channelGroupOptions = ref<SelectOption[]>([]);
const weightRuleOptions = ref<SelectOption[]>([]);
/** 内单号 / 报关号规则（scene=2，含内置「号码池获取」） */
const noRuleScene2Options = ref<SelectOption[]>([]);
/** 转单号规则（scene=1，含内置「发货渠道获取」） */
const noRuleScene1Options = ref<SelectOption[]>([]);
const itemNoRuleOptions = ref<SelectOption[]>([]);
const printTemplateOptions = ref<SelectOption[]>([]);
const siteOptions = ref<SelectOption[]>([]);
const channelOutOptions = ref<SelectOption[]>([]);
const remoteGroupOptions = ref<SelectOption[]>([]);
const routeGroupOptions = ref<SelectOption[]>([]);
/** 承运物品类别（物品类别 /product-group/query，管理端口径默认含停用项） */
const productGroupOptions = ref<SelectOption[]>([]);
const optionsLoaded = ref(false);

/** 把 { _id, name } 之类的列表转成下拉选项 */
function toOptions(list: { _id: string; name?: string; code?: string }[]): SelectOption[] {
  return list.map(item => ({ label: item.name || item.code || item._id, value: item._id }));
}

async function loadOptions() {
  if (optionsLoaded.value) return;

  const [
    carrier,
    channelGroup,
    weightRule,
    noRule2,
    noRule1,
    itemNoRule,
    printTpl,
    site,
    channelOut,
    remote,
    route,
    productGroup
  ] = await Promise.all([
    fetchGetCarrierList({ page: 1, size: 500, where: {} }),
    fetchGetChannelGroupList({ page: 1, size: 500, where: {} }),
    fetchGetWeightRuleList({ page: 1, size: 500, where: {} }),
    // scene 非空时后端会写 where.sysType，故必须显式传 where
    fetchGetNoRuleList({ page: 1, size: 500, where: {}, scene: 2 }),
    fetchGetNoRuleList({ page: 1, size: 500, where: {}, scene: 1 }),
    fetchGetItemNoRuleList({ page: 1, size: 500 }),
    fetchGetPrintTemplateList({ page: 1, size: 500, where: { templateType: 0 } }),
    fetchGetSiteList({ page: 1, size: 500 }),
    fetchGetChannelOutList({ page: 1, size: 500 }),
    fetchGetRemoteGroupList({ page: 1, size: 500 }),
    fetchGetRouteGroupList({ page: 1, size: 500 }),
    // 不传 status：与物品类别管理页同口径，含停用项（避免历史值不可见）
    fetchGetProductGroupList({ current: 1, size: 500 })
  ]);

  if (carrier.data) carrierOptions.value = toOptions(carrier.data.list);
  if (channelGroup.data) channelGroupOptions.value = toOptions(channelGroup.data.list);
  if (weightRule.data) weightRuleOptions.value = toOptions(weightRule.data.list);
  if (noRule2.data) noRuleScene2Options.value = toOptions(noRule2.data.list);
  if (noRule1.data) noRuleScene1Options.value = toOptions(noRule1.data.list);
  if (itemNoRule.data) itemNoRuleOptions.value = toOptions(itemNoRule.data.list);
  if (printTpl.data) printTemplateOptions.value = toOptions(printTpl.data.list);
  if (site.data) siteOptions.value = toOptions(site.data.list);
  if (channelOut.data) channelOutOptions.value = toOptions(channelOut.data.list);
  if (remote.data) remoteGroupOptions.value = toOptions(remote.data.list);
  if (route.data) routeGroupOptions.value = toOptions(route.data.list);
  if (productGroup.data) productGroupOptions.value = toOptions(productGroup.data.list);

  optionsLoaded.value = true;
}

// ---- 联动：转单号规则 =「发货渠道获取」时才可绑定发货渠道，否则禁用并清空 ----
const channelOutDisabled = computed(() => mode.value !== 'detail' && model.channelNoRuleId !== NO_RULE_CHANNEL_OUT);

watch(
  () => model.channelNoRuleId,
  value => {
    if (value !== NO_RULE_CHANNEL_OUT) model.channelOutId = null;
  }
);

// ---- 表单项（单区块「基本信息」：3 列 × 8 栅格 + 整行的承运物品类别 / 渠道备注） ----
const formItems = computed<FormItemConfig[]>(() => [
  { key: 'section-basic', label: $t('page.channelQuote.receive.basicInfo'), type: 'section', span: 24 },
  {
    key: 'code',
    label: $t('page.channelQuote.receive.code'),
    type: 'input',
    span: 8,
    placeholder: $t('page.channelQuote.receive.form.codePlaceholder')
  },
  {
    key: 'name',
    label: $t('page.channelQuote.receive.name'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.channelQuote.receive.form.namePlaceholder')
  },
  {
    key: 'carrierId',
    label: $t('page.channelQuote.receive.form.carrier'),
    type: 'select',
    required: true,
    span: 8,
    options: carrierOptions.value,
    labelTooltip: $t('page.channelQuote.receive.form.carrierTooltip')
  },
  {
    key: 'channelGroupId',
    label: $t('page.channelQuote.receive.form.channelGroup'),
    type: 'select',
    span: 8,
    options: channelGroupOptions.value
  },
  {
    key: 'noRuleId',
    label: $t('page.channelQuote.receive.form.noRule'),
    type: 'select',
    span: 8,
    options: noRuleScene2Options.value
  },
  {
    key: 'itemNoRuleId',
    label: $t('page.channelQuote.receive.form.itemNoRule'),
    type: 'select',
    span: 8,
    options: itemNoRuleOptions.value
  },
  {
    key: 'channelNoRuleId',
    label: $t('page.channelQuote.receive.form.channelNoRule'),
    type: 'select',
    span: 8,
    options: noRuleScene1Options.value
  },
  {
    key: 'channelOutId',
    label: $t('page.channelQuote.receive.form.channelOut'),
    type: 'select',
    span: 8,
    options: channelOutOptions.value,
    disabled: channelOutDisabled.value,
    placeholder: channelOutDisabled.value ? $t('page.channelQuote.receive.form.channelOutDisabledTip') : undefined
  },
  {
    key: 'customsNoRuleId',
    label: $t('page.channelQuote.receive.form.customsNoRule'),
    type: 'select',
    span: 8,
    options: noRuleScene2Options.value
  },
  {
    key: 'labelTemplateId',
    label: $t('page.channelQuote.receive.form.labelTemplate'),
    type: 'select',
    span: 8,
    options: printTemplateOptions.value
  },
  {
    key: 'customerEnable',
    label: $t('page.channelQuote.receive.form.customerEnable'),
    type: 'select',
    span: 8,
    options: [
      { label: $t('page.channelQuote.receive.form.customerEnableAllow'), value: 1 },
      { label: $t('page.channelQuote.receive.form.customerEnableClose'), value: 0 }
    ]
  },
  {
    key: 'weightRuleId',
    label: $t('page.channelQuote.receive.form.weightRule'),
    type: 'select',
    span: 8,
    options: weightRuleOptions.value
  },
  {
    key: 'remoteGroupId',
    label: $t('page.channelQuote.receive.form.remoteGroup'),
    type: 'select',
    span: 8,
    options: remoteGroupOptions.value
  },
  {
    key: 'oilRate',
    label: $t('page.channelQuote.receive.form.oilRate'),
    type: 'number',
    span: 8,
    suffix: '%'
  },
  {
    key: 'feeCustom',
    label: $t('page.channelQuote.receive.form.feeCustom'),
    type: 'number',
    span: 8,
    suffix: '元'
  },
  {
    key: 'siteIds',
    label: $t('page.channelQuote.receive.form.site'),
    type: 'select',
    span: 8,
    options: siteOptions.value,
    multiple: true
  },
  {
    key: 'routeGroupId',
    label: $t('page.channelQuote.receive.form.routeGroup'),
    type: 'select',
    span: 8,
    options: routeGroupOptions.value
  },
  {
    key: 'tag',
    label: $t('page.channelQuote.receive.form.tag'),
    type: 'input',
    span: 8,
    placeholder: $t('page.channelQuote.receive.form.tagPlaceholder')
  },
  {
    key: 'productGroupIds',
    label: $t('page.channelQuote.receive.form.productGroup'),
    type: 'checkbox',
    span: 24,
    options: productGroupOptions.value
  },
  {
    key: 'note',
    label: $t('page.channelQuote.receive.note'),
    type: 'textarea',
    span: 24,
    rows: 3,
    placeholder: $t('page.channelQuote.receive.form.notePlaceholder')
  }
]);

const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

/** 用行数据回填模型（空值一律落 null / 空数组，不回填空字符串） */
function fillModel(row: Partial<Api.ChannelQuote.ReceiveChannel>) {
  Object.assign(model, {
    _id: row._id ?? null,
    code: row.code ?? null,
    name: row.name ?? null,
    carrierId: row.carrierId ?? null,
    channelGroupId: row.channelGroupId ?? null,
    channelOutId: row.channelOutId ?? null,
    noRuleId: row.noRuleId ?? null,
    itemNoRuleId: row.itemNoRuleId ?? null,
    channelNoRuleId: row.channelNoRuleId ?? null,
    customsNoRuleId: row.customsNoRuleId ?? null,
    labelTemplateId: row.labelTemplateId ?? null,
    customerEnable: row.customerEnable ?? 1,
    weightRuleId: row.weightRuleId ?? null,
    remoteGroupId: row.remoteGroupId ?? null,
    oilRate: row.oilRate ?? null,
    feeCustom: row.feeCustom ?? null,
    siteIds: row.siteIds ?? [],
    productGroupIds: row.productGroupIds ?? [],
    routeGroupId: row.routeGroupId ?? null,
    tag: row.tag ?? null,
    note: row.note ?? null
  });
}

function openCreate() {
  mode.value = 'create';
  Object.assign(model, emptyModel());
  formRef.value?.restoreValidation();
  visible.value = true;
  loadOptions();
}

function openEdit(row: Api.ChannelQuote.ReceiveChannel) {
  mode.value = 'edit';
  Object.assign(model, emptyModel());
  fillModel(row);
  formRef.value?.restoreValidation();
  visible.value = true;
  loadOptions();
}

async function openDetail(row: Api.ChannelQuote.ReceiveChannel) {
  mode.value = 'detail';
  Object.assign(model, emptyModel());
  fillModel(row);
  visible.value = true;
  loadOptions();
  // 详情走 /channel/get 取最新详情（后端会 fillName 回填名称）
  const { data: res, error } = await fetchGetChannel(row._id);
  if (!error && res) fillModel(res);
}

/** 组装提交载荷：空值（null / undefined / ''）一律不传，避免把空字符串写进后端 */
function buildPayload(): Api.ChannelQuote.ReceiveChannelSaveParams {
  const payload: Api.ChannelQuote.ReceiveChannelSaveParams = { name: String(model.name ?? '') };

  function setIfFilled(key: keyof Api.ChannelQuote.ReceiveChannelSaveParams, value: unknown) {
    if (value === null || value === undefined || value === '') return;
    (payload as unknown as Record<string, unknown>)[key] = value;
  }

  if (mode.value === 'edit') setIfFilled('_id', model._id);
  // code：新建留空则不传（后端按序号自动生成）；编辑必须随行回传
  setIfFilled('code', model.code);
  setIfFilled('carrierId', model.carrierId);
  setIfFilled('channelGroupId', model.channelGroupId);
  setIfFilled('noRuleId', model.noRuleId);
  setIfFilled('itemNoRuleId', model.itemNoRuleId);
  setIfFilled('channelNoRuleId', model.channelNoRuleId);
  setIfFilled('customsNoRuleId', model.customsNoRuleId);
  setIfFilled('labelTemplateId', model.labelTemplateId);
  setIfFilled('weightRuleId', model.weightRuleId);
  setIfFilled('remoteGroupId', model.remoteGroupId);
  setIfFilled('routeGroupId', model.routeGroupId);
  setIfFilled('oilRate', model.oilRate);
  setIfFilled('feeCustom', model.feeCustom);
  setIfFilled('tag', model.tag);
  setIfFilled('note', model.note);
  // 发货渠道仅在「转单号规则 = 发货渠道获取」时才有意义
  if (model.channelNoRuleId === NO_RULE_CHANNEL_OUT) setIfFilled('channelOutId', model.channelOutId);

  payload.customerEnable = (model.customerEnable as 0 | 1) ?? 1;
  // 站点为多选：始终提交数组（空数组表示清空），非空字符串，不受「不传空值」约束
  payload.siteIds = Array.isArray(model.siteIds) ? (model.siteIds as string[]) : [];
  // 承运物品类别同为多选：同样始终提交数组（空数组表示清空）
  payload.productGroupIds = Array.isArray(model.productGroupIds) ? (model.productGroupIds as string[]) : [];

  return payload;
}

async function handleSubmit() {
  if (mode.value === 'detail') {
    visible.value = false;
    return;
  }

  const ok = await formRef.value?.validate();
  if (!ok) return;

  loading.value = true;
  try {
    const payload = buildPayload();
    const { error } = mode.value === 'create' ? await fetchCreateChannel(payload) : await fetchUpdateChannel(payload);
    if (error) return;

    window.$message?.success(mode.value === 'create' ? $t('common.createSuccess') : $t('common.updateSuccess'));
    visible.value = false;
    emit('submitted');
  } finally {
    loading.value = false;
  }
}

defineExpose({ openCreate, openEdit, openDetail });
</script>

<template>
  <Drawer
    v-model:show="visible"
    :title="title"
    :loading="loading"
    :footer="mode !== 'detail'"
    width="1040"
    @submit="handleSubmit"
  >
    <NFormWrap
      ref="formRef"
      :model="model"
      :items="formItems"
      :mode="mode === 'detail' ? 'view' : 'edit'"
      :grid-x-gap="16"
      label-placement="top"
    />
  </Drawer>
</template>

<style scoped></style>
