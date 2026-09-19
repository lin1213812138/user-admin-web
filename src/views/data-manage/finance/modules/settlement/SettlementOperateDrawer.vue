<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateBillMode, fetchUpdateBillMode } from '@/service/api/bill-mode';
import { useArchiveStatusOptions } from '@/views/data-manage/components/shared';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { buildBillDayOptions, buildBillGenStatusOptions, buildBillPeriodOptions } from './constants';

defineOptions({ name: 'SettlementOperateDrawer' });

const emit = defineEmits<{ submitted: [] }>();

const show = ref(false);
const row = ref<Api.SystemManage.BillModeItem | null>(null);
const isCreate = computed(() => !row.value);
/** 内置项：后端 update 只接受 note/status，且初始化注释为「不可停用」→ 除备注外全部只读 */
const isBuildIn = computed(() => row.value?.buildIn === 1);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap>>();

const statusOptions = useArchiveStatusOptions();
const periodOptions = computed(buildBillPeriodOptions);
const genStatusOptions = computed(buildBillGenStatusOptions);

interface SettlementFormModel {
  name: string;
  order: number;
  billPeriod: number | null;
  billDay: number | null;
  billGenStatus: number[];
  status: Api.Common.EnableStatus;
  note: string;
}

const model = reactive<SettlementFormModel>({
  name: '',
  order: 0,
  billPeriod: null,
  billDay: null,
  billGenStatus: [],
  status: 1,
  note: ''
});

/** 结算日期选项随结算周期变化（每天 0-23 时 / 每周 周一~周日 / 每月 1-28 + 最后一天） */
const billDayOptions = computed(() => buildBillDayOptions(model.billPeriod));

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.finance.settlement.name'),
    type: 'input',
    required: true,
    disabled: isBuildIn.value,
    span: 24,
    placeholder: $t('page.dataManage.finance.settlement.form.namePlaceholder')
  },
  {
    key: 'order',
    label: $t('page.dataManage.finance.settlement.order'),
    type: 'number',
    disabled: isBuildIn.value,
    span: 12,
    placeholder: $t('page.dataManage.finance.settlement.form.orderPlaceholder')
  },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'select',
    disabled: isBuildIn.value,
    filterable: false,
    span: 12,
    options: statusOptions.value,
    placeholder: $t('page.dataManage.finance.settlement.form.statusPlaceholder')
  },
  {
    key: 'billPeriod',
    label: $t('page.dataManage.finance.settlement.billPeriod'),
    type: 'select',
    disabled: isBuildIn.value,
    filterable: false,
    span: 12,
    options: periodOptions.value,
    placeholder: $t('page.dataManage.finance.settlement.form.billPeriodPlaceholder'),
    // 周期变化后原日期的语义（小时/周几/日）失效，重置为未选
    onUpdate: () => {
      model.billDay = null;
    }
  },
  {
    key: 'billDay',
    label: $t('page.dataManage.finance.settlement.billDay'),
    type: 'select',
    disabled: isBuildIn.value || model.billPeriod === null,
    filterable: false,
    span: 12,
    options: billDayOptions.value,
    placeholder: $t('page.dataManage.finance.settlement.form.billDayPlaceholder')
  },
  {
    key: 'billGenStatus',
    label: $t('page.dataManage.finance.settlement.billGenStatus'),
    type: 'select',
    multiple: true,
    disabled: isBuildIn.value,
    filterable: false,
    span: 24,
    options: genStatusOptions.value,
    placeholder: $t('page.dataManage.finance.settlement.form.billGenStatusPlaceholder')
  },
  {
    key: 'note',
    label: $t('common.remark'),
    type: 'textarea',
    rows: 3,
    span: 24,
    placeholder: $t('page.dataManage.finance.settlement.form.notePlaceholder')
  }
]);

function fillFormByRow() {
  const r = row.value;
  if (!r) return;

  model.name = r.name ?? '';
  model.order = r.order ?? 0;
  model.billPeriod = r.billPeriod ?? null;
  model.billDay = r.billDay ?? null;
  model.billGenStatus = Array.isArray(r.billGenStatus) ? [...r.billGenStatus] : [];
  model.status = r.status ?? 1;
  model.note = r.note ?? '';
}

function resetForm() {
  model.name = '';
  model.order = 0;
  model.billPeriod = null;
  model.billDay = null;
  model.billGenStatus = [];
  model.status = 1;
  model.note = '';
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) return;

  submitting.value = true;
  try {
    const payload: Api.SystemManage.BillModeSaveParams = {
      name: model.name.trim(),
      order: model.order ?? 0,
      billPeriod: model.billPeriod,
      billDay: model.billDay,
      billGenStatus: [...model.billGenStatus],
      status: model.status,
      note: model.note?.trim() || undefined
    };

    const { error } = isCreate.value
      ? await fetchCreateBillMode(payload)
      : await fetchUpdateBillMode(
          // 内置项后端只接受 note/status，其余字段传了也会被静默丢弃
          isBuildIn.value ? { _id: row.value!._id, note: payload.note } : { ...payload, _id: row.value!._id }
        );
    if (error) return;

    window.$message?.success($t(isCreate.value ? 'common.addSuccess' : 'common.updateSuccess'));
    show.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

/** 命令式打开：不传 row 为新增，传 row 为编辑 */
function open(editRow?: Api.SystemManage.BillModeItem | null) {
  row.value = editRow ?? null;
  show.value = true;
}

defineExpose({ open });

watch(
  () => show.value,
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
  <Drawer
    v-model:show="show"
    :title="`${isCreate ? $t('common.add') : $t('common.edit')}${$t('page.dataManage.finance.settlement.title')}`"
    :loading="submitting"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" />
  </Drawer>
</template>

<style scoped></style>
