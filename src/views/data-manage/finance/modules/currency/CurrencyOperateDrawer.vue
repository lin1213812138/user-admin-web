<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateCurrency, fetchUpdateCurrency } from '@/service/api/currency';
import { useArchiveStatusOptions } from '@/views/data-manage/components/shared';
import { useCountrySelect } from '@/hooks/business/use-country-select';

defineOptions({ name: 'CurrencyOperateDrawer' });

const emit = defineEmits<{ submitted: [] }>();

const show = ref(false);
const row = ref<Api.DataManage.FinanceCurrency | null>(null);
const isCreate = computed(() => !row.value);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap>>();

const statusOptions = useArchiveStatusOptions();
const { options: countryOptions, load: loadCountries } = useCountrySelect();
loadCountries();

/** 是否本币：1-本币 0-外币 */
const localOptions = computed(() => [
  { label: $t('page.dataManage.finance.currency.localDomestic'), value: 1 },
  { label: $t('page.dataManage.finance.currency.localForeign'), value: 0 }
]);

type Model = {
  code: string;
  name: string;
  countryId: string;
  local: number;
  rate: number;
  status: Api.Common.EnableStatus;
};

const model = reactive<Model>({ code: '', name: '', countryId: '', local: 0, rate: 1, status: 1 });

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.dataManage.finance.currency.code'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.dataManage.finance.currency.form.codePlaceholder'),
    maxlength: 20
  },
  {
    key: 'name',
    label: $t('page.dataManage.finance.currency.name'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.dataManage.finance.currency.form.namePlaceholder'),
    maxlength: 50
  },
  {
    key: 'countryId',
    label: $t('page.dataManage.finance.currency.country'),
    type: 'select',
    required: true,
    span: 24,
    options: countryOptions.value,
    filterable: true,
    placeholder: $t('page.dataManage.finance.currency.form.countryPlaceholder')
  },
  {
    key: 'local',
    label: $t('page.dataManage.finance.currency.local'),
    type: 'select',
    required: true,
    span: 24,
    options: localOptions.value,
    placeholder: $t('page.dataManage.finance.currency.form.localPlaceholder')
  },
  {
    key: 'rate',
    label: $t('page.dataManage.finance.currency.rate'),
    type: 'number',
    required: true,
    span: 24,
    placeholder: $t('page.dataManage.finance.currency.form.ratePlaceholder')
  },
  {
    key: 'status',
    label: $t('page.dataManage.finance.currency.status'),
    type: 'select',
    required: true,
    span: 24,
    options: statusOptions.value,
    placeholder: $t('page.dataManage.finance.currency.form.statusPlaceholder')
  }
]);

function fillFormByRow() {
  const r = row.value;
  if (!r) return;
  model.code = r.code ?? '';
  model.name = r.name ?? '';
  model.countryId = r.countryId ?? '';
  model.local = r.local ?? 0;
  model.rate = r.rate ?? 1;
  model.status = r.status ?? 1;
}

function resetForm() {
  model.code = '';
  model.name = '';
  model.countryId = '';
  model.local = 0;
  model.rate = 1;
  model.status = 1;
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) return;

  submitting.value = true;
  try {
    const payload: Api.DataManage.FinanceCurrencySaveParams = {
      code: model.code.trim(),
      name: model.name.trim(),
      countryId: model.countryId,
      local: model.local,
      rate: model.rate ?? 1,
      status: model.status
    };

    const { error } = isCreate.value
      ? await fetchCreateCurrency(payload)
      : await fetchUpdateCurrency({ ...payload, _id: row.value!._id });
    if (error) return;

    window.$message?.success($t(isCreate.value ? 'common.addSuccess' : 'common.updateSuccess'));
    show.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

/** 命令式打开：不传 row 为新增，传 row 为编辑 */
function open(editRow?: Api.DataManage.FinanceCurrency | null) {
  row.value = editRow ?? null;
  show.value = true;
}

defineExpose({ open });

watch(
  () => show.value,
  val => {
    if (!val) return;
    if (isCreate.value) resetForm();
    else fillFormByRow();
  }
);
</script>

<template>
  <Drawer
    v-model:show="show"
    :title="`${isCreate ? $t('common.add') : $t('common.edit')}${$t('page.dataManage.finance.currency.title')}`"
    :loading="submitting"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" />
  </Drawer>
</template>

<style scoped></style>
