<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { useCountrySelect } from '@/hooks/business/use-country-select';
import { fetchCreateShipper, fetchUpdateShipper } from '@/service/api/ship-address';
import { fetchGetCustomerList } from '@/service/api/customer';
import Drawer from '@/components/common/drawer.vue';
import Upload from '@/components/Upload/index.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

defineOptions({ name: 'ShipperOperateDrawer' });

interface Props {
  /** 所属客户 id（客户详情页传入，独立地址簿新增时不传） */
  customerId?: string;
  /** 客户名称（只读展示） */
  customerName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  customerId: '',
  customerName: ''
});

const emit = defineEmits<{ submitted: [] }>();

const show = ref(false);
const row = ref<Api.SystemManage.CustomerAddress | null>(null);
const isCreate = computed(() => !row.value);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap>>();

/** 客户下拉选项（独立地址簿新增时可选客户；客户详情页走只读 customerName，不加载） */
const customerOptions = ref<{ label: string; value: string }[]>([]);
async function loadCustomerOptions() {
  if (customerOptions.value.length) return;
  const { data: res, error } = await fetchGetCustomerList({ page: 1, size: 1000, scene: 1 });
  if (error || !res) return;
  customerOptions.value = res.list.map(c => ({ label: c.name, value: c._id }));
}

/** 目的地国家下拉（/country/query），由公共 Hook 提供并缓存 */
const { options: countryOptions, load: loadCountryOptions, renderLabel: renderCountryOptionLabel } = useCountrySelect();

type AddressFormModel = Omit<Api.SystemManage.CustomerAddressSaveParams, 'customerId'> & { customerId?: string };

const model = reactive<AddressFormModel>({
  customerId: undefined,
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
  tag: '',
  isDefault: 0,
  imgUrl1: '',
  imgUrl2: ''
});

/** 合并当前行中的 countryId（可能不在全局缓存里）作为回显选项 */
const countrySelectOptions = computed<SelectOption[]>(() => {
  const list = countryOptions.value;
  const currentId = model.countryId;
  if (!currentId || list.some(opt => opt.value === currentId)) return list;
  const rowCountry = row.value?.country;
  return [{ label: rowCountry || currentId, value: currentId, name: rowCountry || currentId } as SelectOption, ...list];
});

const formItems = computed<FormItemConfig[]>(() => [
  // 客户：客户详情页由父级传入，禁用并展示客户名称；独立地址簿新增时由用户自选
  {
    key: 'customerId',
    label: $t('page.manage.customer.detail.customer'),
    type: 'select',
    required: !props.customerId,
    disabled: !!props.customerId,
    span: 12,
    filterable: true,
    clearable: !props.customerId,
    placeholder: $t('page.manage.customer.detail.form.customerPlaceholder'),
    options: props.customerId ? [{ label: props.customerName, value: props.customerId }] : customerOptions.value
  },
  {
    key: 'countryId',
    label: $t('page.manage.customer.detail.destination'),
    type: 'select',
    required: true,
    span: 12,
    filterable: true,
    options: countrySelectOptions.value,
    placeholder: $t('page.manage.customer.detail.form.countryPlaceholder'),
    /** 下拉项显示 名称+二字码，选中态的二字码由抽屉 scoped 样式隐藏，只显示名称 */
    renderLabel: renderCountryOptionLabel,
    /** 选中目的地后，直接从选中项带出国家二字码（可手动修改） */
    onUpdate: (_value, option) => {
      model.country = (option as SelectOption & { code2?: string })?.code2 ?? '';
    }
  },
  { key: 'country', label: $t('page.manage.customer.detail.spCountry'), type: 'input', required: true, span: 12 },
  {
    key: 'name',
    label: $t('page.manage.customer.detail.spName'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.namePlaceholder')
  },
  {
    key: 'zip',
    label: $t('page.manage.customer.detail.spZip'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.zipPlaceholder')
  },
  {
    key: 'phone',
    label: $t('page.manage.customer.detail.spPhone'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.phonePlaceholder')
  },
  {
    key: 'state',
    label: $t('page.manage.customer.detail.spState'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.statePlaceholder')
  },
  {
    key: 'city',
    label: $t('page.manage.customer.detail.spCity'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.cityPlaceholder')
  },
  { key: 'company', label: $t('page.manage.customer.detail.formCompany'), type: 'input', span: 12 },
  {
    key: 'mobile',
    label: $t('page.manage.customer.detail.spMobile'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.mobilePlaceholder')
  },
  {
    key: 'email',
    label: $t('page.manage.customer.detail.spEmail'),
    type: 'input',
    span: 12,
    placeholder: $t('page.manage.customer.detail.form.emailPlaceholder')
  },
  {
    key: 'address',
    label: $t('page.manage.customer.detail.spAddress'),
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
  const r = row.value;
  if (!r) return;

  model.customerId = r.customerId || props.customerId || undefined;
  model.countryId = r.countryId || undefined;
  model.country = r.country ?? '';
  model.name = r.name ?? '';
  model.company = r.company ?? '';
  model.phone = r.phone ?? '';
  model.mobile = r.mobile ?? '';
  model.email = r.email ?? '';
  model.address = r.address ?? '';
  model.address2 = r.address2 ?? '';
  model.address3 = r.address3 ?? '';
  model.state = r.state ?? '';
  model.city = r.city ?? '';
  model.zip = r.zip ?? '';
  model.taxNo = r.taxNo ?? '';
  model.tag = r.tag ?? '';
  model.isDefault = r.isDefault ?? 0;
  model.imgUrl1 = r.imgUrl1 ?? '';
  model.imgUrl2 = r.imgUrl2 ?? '';
}

function resetForm() {
  model.customerId = props.customerId || undefined;
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
  model.tag = '';
  model.isDefault = 0;
  model.imgUrl1 = '';
  model.imgUrl2 = '';
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) return;

  submitting.value = true;
  try {
    const payload: Api.SystemManage.CustomerAddressSaveParams = {
      customerId: props.customerId || model.customerId || '',
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
      tag: model.tag?.trim() || undefined,
      isDefault: model.isDefault,
      imgUrl1: model.imgUrl1 || undefined,
      imgUrl2: model.imgUrl2 || undefined
    };

    const { error } = isCreate.value
      ? await fetchCreateShipper(payload)
      : await fetchUpdateShipper({ ...payload, _id: row.value!._id });
    if (error) return;

    window.$message?.success($t(isCreate.value ? 'common.addSuccess' : 'common.updateSuccess'));
    show.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

/** 命令式打开：不传 row 为新增，传 row 为编辑 */
function open(editRow?: Api.SystemManage.CustomerAddress | null) {
  row.value = editRow ?? null;
  show.value = true;
}

defineExpose({ open });

watch(
  () => show.value,
  val => {
    if (!val) return;

    loadCountryOptions();
    if (!props.customerId) {
      loadCustomerOptions();
    }

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
    :title="`${isCreate ? $t('common.add') : $t('common.edit')}${$t('page.manage.customer.detail.addressBook')}`"
    :loading="submitting"
    width="800"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="24">
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

<style scoped>
/* 选中态只显示国家名称，隐藏右侧二字码（下拉菜单是 teleport 到 body 的，不受 scoped 影响，仍保留 code2） */
:deep(.n-base-selection__label .country-option-code2) {
  display: none;
}
</style>
