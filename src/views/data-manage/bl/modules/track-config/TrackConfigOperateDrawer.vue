<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateTrackConfig, fetchUpdateTrackConfig } from '@/service/api/data-manage-bl';

type TrackConfig = Api.DataManageBl.TrackConfig;

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<TrackConfig>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<TrackConfig> {
  return {
    name: '',
    trackType: '',
    url: '',
    account: '',
    password: '',
    key: '',
    web: '',
    channel: '',
    accountNo: '',
    status: 1,
    note: ''
  };
}

const drawerTitle = computed(
  () =>
    `${$t(drawerMode.value === 'create' ? 'common.add' : 'common.edit')}${$t('page.dataManage.bl.trackConfig.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.bl.trackConfig.name'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.dataManage.bl.trackConfig.form.namePlaceholder')
  },
  { key: 'trackType', label: '轨迹类型', type: 'input', span: 12 },
  {
    key: 'url',
    label: $t('page.dataManage.bl.trackConfig.url'),
    type: 'input',
    span: 24,
    placeholder: $t('page.dataManage.bl.trackConfig.form.carrierPlaceholder')
  },
  { key: 'account', label: '账号', type: 'input', span: 12 },
  { key: 'password', label: '密码', type: 'password', span: 12 },
  { key: 'key', label: '密钥', type: 'password', span: 12 },
  { key: 'web', label: '站点', type: 'input', span: 12 },
  { key: 'channel', label: '渠道', type: 'input', span: 12 },
  { key: 'accountNo', label: '账号编号', type: 'input', span: 12 },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'switch',
    span: 24,
    checkedValue: 1,
    uncheckedValue: 0,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable')
  },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

function openEdit(row: TrackConfig) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    name: row.name,
    trackType: row.trackType ?? '',
    url: row.url ?? '',
    account: row.account ?? '',
    password: row.password ?? '',
    key: row.key ?? '',
    web: row.web ?? '',
    channel: row.channel ?? '',
    accountNo: row.accountNo ?? '',
    status: row.status ?? 1,
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
        ? await fetchCreateTrackConfig(formModel.value)
        : await fetchUpdateTrackConfig(formModel.value);

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
