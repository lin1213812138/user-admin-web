<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateFeeType, fetchUpdateFeeType } from '@/service/api/fee-type';
import { useArchiveStatusOptions } from '@/views/data-manage/components/shared';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { buildExpenseScopeOptions } from './constants';

defineOptions({ name: 'ExpenseTypeOperateDrawer' });

const emit = defineEmits<{ submitted: [] }>();

const show = ref(false);
const row = ref<Api.DataManage.FinanceExpenseType | null>(null);
const isCreate = computed(() => !row.value);
/** 内置项：名称/状态只读，提交只发 scope/order/note（对齐后端 update 的 pick 白名单） */
const isBuildIn = computed(() => row.value?.buildIn === 1);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap>>();

const statusOptions = useArchiveStatusOptions();
const scopeOptions = computed(buildExpenseScopeOptions);

interface ExpenseTypeFormModel {
  name: string;
  scope: number[];
  order: number;
  status: Api.Common.EnableStatus;
  note: string;
}

const model = reactive<ExpenseTypeFormModel>({
  name: '',
  scope: [],
  order: 0,
  status: 1,
  note: ''
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.finance.expenseType.name'),
    type: 'input',
    required: true,
    disabled: isBuildIn.value,
    span: 24,
    placeholder: $t('page.dataManage.finance.expenseType.form.namePlaceholder')
  },
  {
    key: 'scope',
    label: $t('page.dataManage.finance.expenseType.scope'),
    type: 'select',
    multiple: true,
    required: true,
    filterable: false,
    span: 24,
    options: scopeOptions.value,
    placeholder: $t('page.dataManage.finance.expenseType.form.scopePlaceholder')
  },
  {
    key: 'order',
    label: $t('page.dataManage.finance.expenseType.order'),
    type: 'number',
    span: 12,
    placeholder: $t('page.dataManage.finance.expenseType.form.orderPlaceholder')
  },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'select',
    disabled: isBuildIn.value,
    filterable: false,
    span: 12,
    options: statusOptions.value,
    placeholder: $t('page.dataManage.finance.expenseType.form.statusPlaceholder')
  },
  {
    key: 'note',
    label: $t('common.remark'),
    type: 'textarea',
    rows: 3,
    span: 24,
    placeholder: $t('page.dataManage.finance.expenseType.form.notePlaceholder')
  }
]);

function fillFormByRow() {
  const r = row.value;
  if (!r) return;

  model.name = r.name ?? '';
  model.scope = Array.isArray(r.scope) ? [...r.scope] : [];
  model.order = r.order ?? 0;
  model.status = r.status ?? 1;
  model.note = r.note ?? '';
}

function resetForm() {
  model.name = '';
  model.scope = [];
  model.order = 0;
  model.status = 1;
  model.note = '';
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) return;

  submitting.value = true;
  try {
    const payload: Api.DataManage.FinanceExpenseTypeSaveParams = {
      name: model.name.trim(),
      scope: [...model.scope],
      order: model.order ?? 0,
      status: model.status,
      note: model.note?.trim() || undefined
    };

    const { error } = isCreate.value
      ? await fetchCreateFeeType(payload)
      : await fetchUpdateFeeType(
          // 内置项后端只接受 scope/order/note，其余字段传了也会被静默丢弃
          isBuildIn.value
            ? { _id: row.value!._id, scope: payload.scope, order: payload.order, note: payload.note }
            : { ...payload, _id: row.value!._id }
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
function open(editRow?: Api.DataManage.FinanceExpenseType | null) {
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
    :title="`${isCreate ? $t('common.add') : $t('common.edit')}${$t('page.dataManage.finance.expenseType.title')}`"
    :loading="submitting"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" />
  </Drawer>
</template>

<style scoped></style>
