<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateCarrier, fetchUpdateCarrier } from '@/service/api/data-manage-ship';

type Carrier = Api.DataManageShip.Carrier;
/** 表单态允许 cubicNum / weightOff 为 null（NInputNumber 清空时回填 null，提交前归一为 undefined） */
type CarrierForm = Omit<Partial<Carrier>, 'cubicNum' | 'weightOff'> & {
  cubicNum?: number | null;
  weightOff?: number | null;
};

const props = defineProps<{
  weightRuleOptions: { label: string; value: string; cubicNum?: number; weightOff?: number }[];
  trackConfigOptions: { label: string; value: string }[];
}>();
const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<CarrierForm>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): CarrierForm {
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

/** 选择计泡规则后同步该规则的 材积除 / 计泡比率；规则未配置时写 null（NInputNumber 才能正确清空显示，undefined 不清空）；清空选择不动已填值 */
function handleWeightRuleChange(value: string | number | Array<string | number> | null) {
  const rule = props.weightRuleOptions.find(opt => opt.value === value);
  if (!rule) return;
  formModel.value.cubicNum = rule.cubicNum ?? null;
  formModel.value.weightOff = rule.weightOff ?? null;
}

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
    options: props.weightRuleOptions,
    clearable: true,
    filterable: false,
    onUpdate: handleWeightRuleChange
  },
  {
    key: 'trackConfigId',
    label: $t('page.dataManage.ship.carrier.trackConfig'),
    type: 'select',
    span: 12,
    options: props.trackConfigOptions,
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
function openEdit(row: Carrier) {
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
    // NInputNumber 清空回填 null，提交前归一为 undefined 以保住既有字段契约（number | undefined）
    const payload = {
      ...formModel.value,
      cubicNum: formModel.value.cubicNum ?? undefined,
      weightOff: formModel.value.weightOff ?? undefined
    };
    const { error } =
      drawerMode.value === 'create' ? await fetchCreateCarrier(payload) : await fetchUpdateCarrier(payload);

    if (error) return;

    drawerVisible.value = false;
    emit('submitted');
    window.$message?.success($t(drawerMode.value === 'create' ? 'common.createSuccess' : 'common.saveSuccess'));
  } finally {
    submitting.value = false;
  }
}

defineExpose({ openCreate, openEdit });
</script>

<template>
  <Drawer
    v-model:show="drawerVisible"
    :title="drawerTitle"
    :loading="submitting"
    :width="700"
    :confirm-text="$t('common.save')"
    @submit="handleDrawerSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
  </Drawer>
</template>
