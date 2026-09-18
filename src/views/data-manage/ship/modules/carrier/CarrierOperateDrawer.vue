<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateCarrier, fetchUpdateCarrier } from '@/service/api/data-manage-ship';

type Carrier = Api.DataManageShip.Carrier;

const props = defineProps<{
  weightRuleOptions: { label: string; value: string }[];
  trackConfigOptions: { label: string; value: string }[];
}>();
const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<Carrier>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<Carrier> {
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
    options: props.weightRuleOptions,
    clearable: true,
    filterable: false
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
    const { error } =
      drawerMode.value === 'create'
        ? await fetchCreateCarrier(formModel.value)
        : await fetchUpdateCarrier(formModel.value);

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
    :confirm-text="$t('common.save')"
    @submit="handleDrawerSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
  </Drawer>
</template>
