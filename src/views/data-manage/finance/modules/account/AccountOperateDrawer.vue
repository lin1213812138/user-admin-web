<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateTradeAccount, fetchUpdateTradeAccount } from '@/service/api/trade-account';
import { useArchiveStatusOptions } from '@/views/data-manage/components/shared';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

defineOptions({ name: 'AccountOperateDrawer' });

const emit = defineEmits<{ submitted: [] }>();

const show = ref(false);
const row = ref<Api.DataManage.FinanceTradeAccount | null>(null);
const isCreate = computed(() => !row.value);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap>>();

const statusOptions = useArchiveStatusOptions();

interface AccountFormModel {
  alias: string;
  bank: string;
  name: string;
  no: string;
  balance: number;
  status: Api.Common.EnableStatus;
  note: string;
}

const model = reactive<AccountFormModel>({
  alias: '',
  bank: '',
  name: '',
  no: '',
  balance: 0,
  status: 1,
  note: ''
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'alias',
    label: $t('page.dataManage.finance.account.alias'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.dataManage.finance.account.form.aliasPlaceholder')
  },
  {
    key: 'bank',
    label: $t('page.dataManage.finance.account.bank'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.dataManage.finance.account.form.bankPlaceholder')
  },
  {
    key: 'name',
    label: $t('page.dataManage.finance.account.name'),
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.finance.account.form.namePlaceholder')
  },
  {
    key: 'no',
    label: $t('page.dataManage.finance.account.no'),
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.finance.account.form.noPlaceholder')
  },
  {
    key: 'balance',
    label: $t('page.dataManage.finance.account.balance'),
    type: 'number',
    span: 12,
    placeholder: $t('page.dataManage.finance.account.form.balancePlaceholder')
  },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'select',
    span: 12,
    filterable: false,
    options: statusOptions.value,
    placeholder: $t('common.status')
  },
  {
    key: 'note',
    label: $t('common.remark'),
    type: 'textarea',
    rows: 3,
    span: 24,
    placeholder: $t('page.dataManage.finance.account.form.notePlaceholder')
  }
]);

function fillFormByRow() {
  const r = row.value;
  if (!r) return;

  model.alias = r.alias ?? '';
  model.bank = r.bank ?? '';
  model.name = r.name ?? '';
  model.no = r.no ?? '';
  model.balance = r.balance ?? 0;
  model.status = r.status ?? 1;
  model.note = r.note ?? '';
}

function resetForm() {
  model.alias = '';
  model.bank = '';
  model.name = '';
  model.no = '';
  model.balance = 0;
  model.status = 1;
  model.note = '';
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) return;

  submitting.value = true;
  try {
    const payload: Api.DataManage.FinanceTradeAccountSaveParams = {
      alias: model.alias.trim(),
      bank: model.bank.trim(),
      name: model.name?.trim() || undefined,
      no: model.no?.trim() || undefined,
      balance: model.balance ?? 0,
      status: model.status,
      note: model.note?.trim() || undefined
    };

    const { error } = isCreate.value
      ? await fetchCreateTradeAccount(payload)
      : await fetchUpdateTradeAccount({ ...payload, _id: row.value!._id });
    if (error) return;

    window.$message?.success($t(isCreate.value ? 'common.addSuccess' : 'common.updateSuccess'));
    show.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

/** 命令式打开：不传 row 为新增，传 row 为编辑 */
function open(editRow?: Api.DataManage.FinanceTradeAccount | null) {
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
    :title="`${isCreate ? $t('common.add') : $t('common.edit')}${$t('page.dataManage.finance.account.title')}`"
    :loading="submitting"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" />
  </Drawer>
</template>

<style scoped></style>
