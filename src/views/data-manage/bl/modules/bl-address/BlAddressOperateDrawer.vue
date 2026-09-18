<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateBlAddress, fetchUpdateBlAddress } from '@/service/api/data-manage-bl';

type BlAddress = Api.DataManageBl.BlAddress;

/** 9 类地址簿（label 固定文案，对齐 i18n typeOption） */
const addressTypeOptions = computed(() => {
  const typeOption: Record<string, string> = {
    BY: '买方公司',
    ST: '送达方',
    CN: '收货人',
    SE: '卖方公司',
    MF: '生产商',
    IM: '进口商',
    BKP: '订舱人',
    CS: '拼箱人',
    LG: '装柜地址'
  };
  return Object.entries(typeOption).map(([value, label]) => ({ label, value }));
});

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<BlAddress>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(addressType: string = 'BY'): Partial<BlAddress> {
  return {
    addressType,
    name: '',
    company: '',
    phone: '',
    city: '',
    state: '',
    zip: '',
    address: '',
    email: '',
    eori: '',
    vat: '',
    countryId: '',
    note: ''
  };
}

const drawerTitle = computed(
  () => `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}${$t('page.dataManage.bl.blAddress.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'addressType',
    label: '地址类型',
    type: 'select',
    required: true,
    span: 12,
    options: addressTypeOptions.value,
    disabled: drawerMode.value === 'edit'
  },
  {
    key: 'name',
    label: '姓名',
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.namePlaceholder')
  },
  {
    key: 'company',
    label: '公司',
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.companyPlaceholder')
  },
  {
    key: 'phone',
    label: '电话',
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.phonePlaceholder')
  },
  { key: 'countryId', label: '国家', type: 'input', span: 12 },
  {
    key: 'city',
    label: '城市',
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.cityPlaceholder')
  },
  {
    key: 'state',
    label: '省州',
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.statePlaceholder')
  },
  {
    key: 'zip',
    label: '邮编',
    type: 'input',
    span: 12,
    placeholder: $t('page.dataManage.bl.blAddress.form.zipPlaceholder')
  },
  {
    key: 'address',
    label: '地址',
    type: 'textarea',
    span: 24,
    placeholder: $t('page.dataManage.bl.blAddress.form.addressPlaceholder')
  },
  { key: 'email', label: '邮箱', type: 'input', span: 12 },
  { key: 'eori', label: 'EORI', type: 'input', span: 12 },
  { key: 'vat', label: 'VAT', type: 'input', span: 12 },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);

function openCreate(addressType: string) {
  drawerMode.value = 'create';
  formModel.value = emptyForm(addressType);
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

function openEdit(row: BlAddress) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    addressType: row.addressType,
    name: row.name,
    company: row.company ?? '',
    phone: row.phone ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    zip: row.zip ?? '',
    address: row.address ?? '',
    email: row.email ?? '',
    eori: row.eori ?? '',
    vat: row.vat ?? '',
    countryId: row.countryId ?? '',
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
        ? await fetchCreateBlAddress(formModel.value)
        : await fetchUpdateBlAddress(formModel.value);

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
