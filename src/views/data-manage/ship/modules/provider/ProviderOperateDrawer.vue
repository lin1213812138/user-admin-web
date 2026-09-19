<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateProvider, fetchUpdateProvider } from '@/service/api/data-manage-ship';

type Provider = Api.DataManageShip.Provider;

/** 服务商类型（后端固定枚举 0-发货 1-派送 2-提单 3-杂支） */
const providerTypeOptions = computed(() => [
  { label: $t('page.dataManage.ship.provider.typeOption.out'), value: 0 },
  { label: $t('page.dataManage.ship.provider.typeOption.send'), value: 1 },
  { label: $t('page.dataManage.ship.provider.typeOption.bl'), value: 2 },
  { label: $t('page.dataManage.ship.provider.typeOption.other'), value: 3 }
]);

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<Provider>>(emptyForm(0));
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(providerType: 0 | 1 | 2 | 3): Partial<Provider> {
  return {
    code: '',
    name: '',
    billMode: '',
    contact: '',
    phone: '',
    email: '',
    web: '',
    address: '',
    providerType,
    status: 1,
    note: ''
  };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.ship.provider.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.ship.provider.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'providerType',
    label: $t('page.dataManage.ship.provider.providerType'),
    type: 'select',
    required: true,
    span: 12,
    options: providerTypeOptions.value,
    filterable: false
  },
  {
    key: 'code',
    label: $t('page.dataManage.ship.provider.code'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入服务商代码'
  },
  {
    key: 'name',
    label: $t('page.dataManage.ship.provider.name'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入服务商名称'
  },
  { key: 'billMode', label: $t('page.dataManage.ship.provider.billMode'), type: 'input', span: 12 },
  { key: 'contact', label: $t('page.dataManage.ship.provider.contact'), type: 'input', span: 12 },
  { key: 'phone', label: $t('page.dataManage.ship.provider.phone'), type: 'input', span: 12 },
  { key: 'email', label: $t('page.dataManage.ship.provider.email'), type: 'input', span: 12 },
  { key: 'web', label: $t('page.dataManage.ship.provider.web'), type: 'input', span: 12 },
  { key: 'address', label: $t('page.dataManage.ship.provider.address'), type: 'input', span: 12 },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'select',
    span: 12,
    optionsKey: 'status',
    filterable: false
  },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);

function openCreate(providerType: 0 | 1 | 2 | 3) {
  drawerMode.value = 'create';
  formModel.value = emptyForm(providerType);
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

function openEdit(row: Provider) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code,
    name: row.name,
    billMode: row.billMode ?? '',
    contact: row.contact ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    web: row.web ?? '',
    address: row.address ?? '',
    providerType: row.providerType,
    status: row.status,
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
        ? await fetchCreateProvider(formModel.value)
        : await fetchUpdateProvider(formModel.value);

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
    :width="700"
    :confirm-text="$t('common.save')"
    @submit="handleDrawerSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
  </Drawer>
</template>
