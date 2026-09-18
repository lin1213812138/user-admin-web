<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateProduct, fetchUpdateProduct } from '@/service/api/declared-goods';
import { useCountrySelect } from '@/hooks/business/use-country-select';
import { currencyOptions, unitOptions } from '../constants';

type Row = Api.DeclaredGoods.Product;
type Model = Partial<Row>;

const { options: countryOptions, load: loadCountries } = useCountrySelect();
loadCountries();

const emit = defineEmits<{ submitted: [] }>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Model>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Model {
  return {
    nameCn: '',
    nameEn: '',
    price: undefined,
    currency: 'USD',
    unit: 'PCS'
  };
}

const drawerTitle = computed(
  () =>
    `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}${$t('page.dataManage.business.declaredGoods.library')}`
);

const F = 'page.dataManage.business.declaredGoods.fields';

const formItems = computed<FormItemConfig[]>(() => [
  { key: 'nameCn', label: $t(`${F}.nameCn`), type: 'input', required: true, span: 12, placeholder: $t(`${F}.nameCn`) },
  { key: 'nameEn', label: $t(`${F}.nameEn`), type: 'input', required: true, span: 12, placeholder: $t(`${F}.nameEn`) },
  { key: 'hsCode', label: $t(`${F}.hsCode`), type: 'input', span: 12, placeholder: $t(`${F}.hsCode`) },
  { key: 'destHsCode', label: $t(`${F}.destHsCode`), type: 'input', span: 12, placeholder: $t(`${F}.destHsCode`) },
  { key: 'price', label: $t(`${F}.price`), type: 'number', required: true, span: 12 },
  { key: 'currency', label: $t(`${F}.currency`), type: 'select', span: 12, options: currencyOptions, filterable: true },
  { key: 'unit', label: $t(`${F}.unit`), type: 'select', span: 12, options: unitOptions, filterable: true },
  {
    key: 'countryId',
    label: $t(`${F}.country`),
    type: 'select',
    span: 12,
    options: countryOptions.value,
    filterable: true
  },
  { key: 'weight', label: $t(`${F}.weight`), type: 'number', span: 12 },
  { key: 'sku', label: $t(`${F}.sku`), type: 'input', span: 12 },
  { key: 'producer', label: $t(`${F}.producer`), type: 'input', span: 12 },
  { key: 'brand', label: $t(`${F}.brand`), type: 'input', span: 12 },
  { key: 'material', label: $t(`${F}.material`), type: 'input', span: 12 },
  { key: 'model', label: $t(`${F}.model`), type: 'input', span: 12 },
  { key: 'standard', label: $t(`${F}.standard`), type: 'input', span: 12 },
  { key: 'use', label: $t(`${F}.use`), type: 'input', span: 12 },
  { key: 'feeCustom', label: $t(`${F}.feeCustom`), type: 'number', span: 12 },
  { key: 'taxRate', label: $t(`${F}.taxRate`), type: 'number', span: 12 },
  { key: 'sellUrl', label: $t(`${F}.sellUrl`), type: 'input', span: 12 },
  { key: 'imgUrl', label: $t(`${F}.imgUrl`), type: 'image', span: 12 },
  { key: 'note', label: $t(`${F}.note`), type: 'textarea', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = { ...emptyForm(), countryId: '' };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

function openEdit(row: Row) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    customerId: row.customerId ?? '',
    countryId: row.countryId ?? '',
    nameCn: row.nameCn ?? '',
    nameEn: row.nameEn ?? '',
    hsCode: row.hsCode ?? '',
    destHsCode: row.destHsCode ?? '',
    price: row.price,
    currency: row.currency ?? 'USD',
    unit: row.unit ?? 'PCS',
    weight: row.weight,
    sku: row.sku ?? '',
    producer: row.producer ?? '',
    brand: row.brand ?? '',
    material: row.material ?? '',
    model: row.model ?? '',
    standard: row.standard ?? '',
    use: row.use ?? '',
    feeCustom: row.feeCustom,
    taxRate: row.taxRate,
    sellUrl: row.sellUrl ?? '',
    imgUrl: row.imgUrl ?? '',
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
        ? await fetchCreateProduct(formModel.value)
        : await fetchUpdateProduct(formModel.value);

    if (error) return;

    drawerVisible.value = false;
    emit('submitted');
    window.$message?.success($t(drawerMode.value === 'create' ? 'common.createSuccess' : 'common.updateSuccess'));
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
    width="720"
    @submit="handleDrawerSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" :grid-x-gap="16" label-placement="top" />
  </Drawer>
</template>
