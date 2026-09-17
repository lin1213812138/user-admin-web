<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import {
  fetchCreateShipTo,
  fetchCreateShipper,
  fetchGetCountryList,
  fetchUpdateShipTo,
  fetchUpdateShipper
} from '@/service/api/ship-address';
import Drawer from '@/components/common/drawer.vue';
import Upload from '@/components/Upload/index.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

defineOptions({ name: 'AddressOperateDrawer' });

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 初始地址类型：ship-to-收件地址 / shipper-发件地址（新增时可在弹窗内切换） */
  type?: 'ship-to' | 'shipper';
  /** 所属客户 id（新增时必带） */
  customerId?: string;
  /** 客户名称（只读展示，对齐老系统「客户」灰底项） */
  customerName?: string;
  /** 编辑行（null 为新增） */
  row?: Api.SystemManage.CustomerAddress | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  type: 'ship-to',
  customerId: '',
  customerName: '',
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

const isCreate = computed(() => !props.row);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap>>();

/** 地址类型由所在列表 tab 决定（收件地址 tab 新增即收件表单，发件同理） */
const isShipTo = computed(() => props.type === 'ship-to');

/** 目的地国家下拉（/country/query） */
const countryOptions = ref<CommonType.Option<string>[]>([]);

async function loadCountryOptions() {
  if (countryOptions.value.length) return;

  const { data, error } = await fetchGetCountryList();
  if (error || !data) return;

  countryOptions.value = (data.list ?? []).map(item => ({
    label: item.name || item.nameCn || item.nameEn || item.code || item._id,
    value: item._id
  }));
}

const model = reactive<Api.SystemManage.CustomerAddressSaveParams>({
  customerId: '',
  countryId: undefined,
  country: '',
  name: '',
  company: '',
  phone: '',
  mobile: '',
  email: '',
  address: '',
  address2: '',
  address3: '',
  state: '',
  city: '',
  zip: '',
  taxNo: '',
  fbaCode: '',
  tag: '',
  isDefault: 0,
  imgUrl1: '',
  imgUrl2: ''
});

/** 选择目的地后自动带出国家名称（可手动修改） */
watch(
  () => model.countryId,
  id => {
    if (!id) return;

    const option = countryOptions.value.find(item => item.value === id);
    if (option) model.country = option.label;
  }
);

const formItems = computed<FormItemConfig[]>(() => [
  // FBA 仓库代码仅收件地址有（shipper 模型无 fbaCode 字段）
  ...(isShipTo.value
    ? [{ key: 'fbaCode', label: $t('page.manage.customer.detail.fbaCode'), type: 'input', span: 12 } as FormItemConfig]
    : []),
  {
    key: 'customerName',
    label: $t('page.manage.customer.detail.customer'),
    type: 'custom',
    span: 12
  },
  {
    key: 'countryId',
    label: $t('page.manage.customer.detail.destination'),
    type: 'select',
    required: true,
    span: 12,
    filterable: true,
    options: countryOptions.value,
    placeholder: $t('page.manage.customer.detail.form.countryPlaceholder')
  },
  {
    key: 'country',
    label: isShipTo.value ? $t('page.manage.customer.detail.stCountry') : $t('page.manage.customer.detail.spCountry'),
    type: 'input',
    required: true,
    span: 12
  },
  {
    key: 'name',
    label: isShipTo.value ? $t('page.manage.customer.detail.stName') : $t('page.manage.customer.detail.spName'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.namePlaceholder')
  },
  {
    key: 'zip',
    label: isShipTo.value ? $t('page.manage.customer.detail.stZip') : $t('page.manage.customer.detail.spZip'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.zipPlaceholder')
  },
  {
    key: 'phone',
    label: isShipTo.value ? $t('page.manage.customer.detail.stPhone') : $t('page.manage.customer.detail.spPhone'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.phonePlaceholder')
  },
  {
    key: 'state',
    label: isShipTo.value ? $t('page.manage.customer.detail.stState') : $t('page.manage.customer.detail.spState'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.statePlaceholder')
  },
  {
    key: 'city',
    label: isShipTo.value ? $t('page.manage.customer.detail.stCity') : $t('page.manage.customer.detail.spCity'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.cityPlaceholder')
  },
  { key: 'company', label: $t('page.manage.customer.detail.formCompany'), type: 'input', span: 12 },
  {
    key: 'mobile',
    label: isShipTo.value ? $t('page.manage.customer.detail.stMobile') : $t('page.manage.customer.detail.spMobile'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.mobilePlaceholder')
  },
  {
    key: 'email',
    label: isShipTo.value ? $t('page.manage.customer.detail.stEmail') : $t('page.manage.customer.detail.spEmail'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.emailPlaceholder')
  },
  {
    key: 'address',
    label: isShipTo.value ? $t('page.manage.customer.detail.stAddress') : $t('page.manage.customer.detail.spAddress'),
    type: 'textarea',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.addressPlaceholder')
  },
  { key: 'taxNo', label: $t('page.manage.customer.detail.formTaxNo'), type: 'input', span: 12 },
  {
    key: 'isDefault',
    label: $t('page.manage.customer.detail.isDefault'),
    type: 'select',
    span: 12,
    options: [
      { label: $t('common.yesOrNo.yes'), value: 1 },
      { label: $t('common.yesOrNo.no'), value: 0 }
    ]
  },
  { key: 'address2', label: $t('page.manage.customer.detail.address2'), type: 'textarea', span: 12 },
  { key: 'address3', label: $t('page.manage.customer.detail.address3'), type: 'textarea', span: 12 },
  { key: 'imgUrl1', label: $t('page.manage.customer.detail.idCardFront'), type: 'custom', span: 12 },
  { key: 'imgUrl2', label: $t('page.manage.customer.detail.idCardBack'), type: 'custom', span: 12 }
]);

function fillFormByRow() {
  const row = props.row;
  if (!row) return;

  model.countryId = row.countryId || undefined;
  model.country = row.country ?? '';
  model.name = row.name ?? '';
  model.company = row.company ?? '';
  model.phone = row.phone ?? '';
  model.mobile = row.mobile ?? '';
  model.email = row.email ?? '';
  model.address = row.address ?? '';
  model.address2 = row.address2 ?? '';
  model.address3 = row.address3 ?? '';
  model.state = row.state ?? '';
  model.city = row.city ?? '';
  model.zip = row.zip ?? '';
  model.taxNo = row.taxNo ?? '';
  model.fbaCode = row.fbaCode ?? '';
  model.tag = row.tag ?? '';
  model.isDefault = row.isDefault ?? 0;
  model.imgUrl1 = row.imgUrl1 ?? '';
  model.imgUrl2 = row.imgUrl2 ?? '';
}

function resetForm() {
  model.countryId = undefined;
  model.country = '';
  model.name = '';
  model.company = '';
  model.phone = '';
  model.mobile = '';
  model.email = '';
  model.address = '';
  model.address2 = '';
  model.address3 = '';
  model.state = '';
  model.city = '';
  model.zip = '';
  model.taxNo = '';
  model.fbaCode = '';
  model.tag = '';
  model.isDefault = 0;
  model.imgUrl1 = '';
  model.imgUrl2 = '';
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) return;

  submitting.value = true;
  try {
    // 必填字段收敛空串为 undefined，避免空串覆盖
    const payload: Api.SystemManage.CustomerAddressSaveParams = {
      customerId: props.customerId,
      countryId: model.countryId || undefined,
      country: model.country?.trim() || undefined,
      name: model.name?.trim() || undefined,
      company: model.company?.trim() || undefined,
      phone: model.phone?.trim() || undefined,
      mobile: model.mobile?.trim() || undefined,
      email: model.email?.trim() || undefined,
      address: model.address?.trim() || undefined,
      address2: model.address2?.trim() || undefined,
      address3: model.address3?.trim() || undefined,
      state: model.state?.trim() || undefined,
      city: model.city?.trim() || undefined,
      zip: model.zip?.trim() || undefined,
      taxNo: model.taxNo?.trim() || undefined,
      fbaCode: model.fbaCode?.trim() || undefined,
      tag: model.tag?.trim() || undefined,
      isDefault: model.isDefault,
      imgUrl1: model.imgUrl1 || undefined,
      imgUrl2: model.imgUrl2 || undefined
    };

    const createFn = isShipTo.value ? fetchCreateShipTo : fetchCreateShipper;
    const updateFn = isShipTo.value ? fetchUpdateShipTo : fetchUpdateShipper;
    const { error } = isCreate.value ? await createFn(payload) : await updateFn({ ...payload, _id: props.row!._id });
    if (error) return;

    window.$message?.success($t(isCreate.value ? 'common.addSuccess' : 'common.updateSuccess'));
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

    loadCountryOptions();

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
    v-model:show="drawerVisible"
    :title="`${isCreate ? $t('common.add') : $t('common.edit')}${$t('page.manage.customer.detail.addressBook')}`"
    :loading="submitting"
    width="800"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="24">
      <!-- 客户（只读灰底，对齐老系统） -->
      <template #customerName>
        <NInput :value="customerName" disabled placeholder="" />
      </template>

      <!-- 证件照 -->
      <template #imgUrl1>
        <Upload v-model:value="model.imgUrl1" :dest="7" list-type="image-card" />
      </template>
      <template #imgUrl2>
        <Upload v-model:value="model.imgUrl2" :dest="7" list-type="image-card" />
      </template>
    </NFormWrap>
  </Drawer>
</template>

<style scoped></style>
