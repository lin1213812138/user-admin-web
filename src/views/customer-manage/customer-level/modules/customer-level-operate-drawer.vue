<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateCustomerLevel, fetchUpdateCustomerLevel } from '@/service/api/customer-level';
import GroupDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 */
  mode?: DrawerMode;
  /** 编辑行数据 */
  row?: Api.SystemManage.CustomerLevelItem | null;
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

const isCreate = computed(() => props.mode === 'create');

const title = computed(() =>
  props.mode === 'edit'
    ? $t('page.manage.customer.customerLevelManage.edit')
    : $t('page.manage.customer.customerLevelManage.add')
);

const submitting = ref(false);

const formRef = ref<InstanceType<typeof NFormWrap>>();

/**
 * 表单数据模型
 * - `num` 对应截图「客户等级」（可选，不传由后端自动重排）
 * - `name` 对应截图「等级别名」（必填）
 */
const model = reactive<Api.SystemManage.CustomerLevelSaveParams>({
  num: undefined,
  name: '',
  limitDays: 0,
  limitFeeSpent: 0,
  feeShipRate: 100,
  status: 1
});

const statusOptions = [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
];

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'num',
    label: $t('page.manage.customer.customerLevelManage.num'),
    type: 'number',
    span: 12,
    min: 0,
    placeholder: $t('page.manage.customer.customerLevelManage.numPlaceholder')
  },
  {
    key: 'name',
    label: $t('page.manage.customer.customerLevelManage.alias'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.customerLevelManage.form.namePlaceholder')
  },
  {
    key: 'limitDays',
    label: $t('page.manage.customer.customerLevelManage.limitDaysWithUnit'),
    type: 'number',
    span: 12,
    min: 0,
    placeholder: $t('page.manage.customer.customerLevelManage.form.limitDaysPlaceholder')
  },
  {
    key: 'limitFeeSpent',
    label: $t('page.manage.customer.customerLevelManage.limitFeeSpentWithUnit'),
    type: 'number',
    span: 12,
    min: 0,
    placeholder: $t('page.manage.customer.customerLevelManage.form.limitFeeSpentPlaceholder')
  },
  {
    key: 'feeShipRate',
    label: $t('page.manage.customer.customerLevelManage.feeShipRateWithUnit'),
    type: 'number',
    span: 12,
    min: 0,
    max: 100,
    required: true,
    placeholder: $t('page.manage.customer.customerLevelManage.form.feeShipRatePlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.customer.customerLevelManage.status'),
    type: 'select',
    span: 12,
    options: statusOptions
  }
]);

function fillFormByRow() {
  const row = props.row;
  if (!row) return;
  model.num = row.num;
  model.name = row.name ?? '';
  model.limitDays = row.limitDays ?? 0;
  model.limitFeeSpent = row.limitFeeSpent ?? 0;
  model.feeShipRate = row.feeShipRate ?? 100;
  model.status = row.status ?? 1;
}

function resetForm() {
  model.num = undefined;
  model.name = '';
  model.limitDays = 0;
  model.limitFeeSpent = 0;
  model.feeShipRate = 100;
  model.status = 1;
}

async function handleSubmit() {
  const pass = await formRef.value?.validate();
  if (!pass) return;

  submitting.value = true;

  try {
    const payload: Record<string, unknown> = { ...model };
    // 未填写「客户等级」时不传 num，交由后端自动重排
    if (payload.num === undefined || payload.num === null) delete payload.num;

    if (isCreate.value) {
      const { error } = await fetchCreateCustomerLevel(payload as Api.SystemManage.CustomerLevelSaveParams);
      if (error) return;
      window.$message?.success($t('common.addSuccess'));
    } else {
      const { error } = await fetchUpdateCustomerLevel({
        _id: props.row!._id,
        ...(payload as Api.SystemManage.CustomerLevelSaveParams)
      });
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
    if (isCreate.value) {
      resetForm();
    } else {
      fillFormByRow();
    }
  }
);
</script>

<template>
  <GroupDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="true"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" />
  </GroupDrawer>
</template>

<style scoped></style>
