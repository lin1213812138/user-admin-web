<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateTrackConfig, fetchUpdateTrackConfig } from '@/service/api/track-config';
import { TRACK_TYPE_OPTIONS, trackTypeFields } from '@/constants/track-config';
import SiteDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    mode?: DrawerMode;
    row?: Api.SystemManage.TraceConfigItem | null;
  }>(),
  { show: false, mode: 'create', row: null }
);

const emit = defineEmits<{ 'update:show': [value: boolean]; submitted: [] }>();

const drawerVisible = computed({ get: () => props.show, set: val => emit('update:show', val) });
const isCreate = computed(() => props.mode === 'create');
const title = computed(() =>
  isCreate.value ? $t('page.manage.setting.traceCapture.createTitle') : $t('page.manage.setting.traceCapture.editTitle')
);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap>>();

const model = reactive<Api.SystemManage.TraceConfigCreateParams>({
  name: '',
  trackType: undefined,
  url: '',
  account: '',
  password: '',
  key: '',
  web: '',
  channel: '',
  accountNo: ''
});

const formItems = computed<FormItemConfig[]>(() => {
  // 对接字段按系统类型动态渲染（映射配置在 constants/track-config.ts），统一必填
  const credentialItems = trackTypeFields(model.trackType).map<FormItemConfig>(item => ({
    key: item.field,
    label: item.label,
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.setting.traceCapture.form.fieldPlaceholder')
  }));
  return [
    {
      key: 'name',
      label: $t('page.manage.setting.traceCapture.form.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.manage.setting.traceCapture.form.namePlaceholder')
    },
    {
      key: 'trackType',
      label: $t('page.manage.setting.traceCapture.form.trackType'),
      type: 'select',
      required: true,
      span: 12,
      options: TRACK_TYPE_OPTIONS,
      filterable: false
    },
    {
      key: 'url',
      label: $t('page.manage.setting.traceCapture.form.url'),
      type: 'input',
      span: 12,
      placeholder: $t('page.manage.setting.traceCapture.form.urlPlaceholder')
    },
    ...credentialItems,
    {
      key: 'web',
      label: $t('page.manage.setting.traceCapture.form.web'),
      type: 'input',
      span: 12,
      placeholder: $t('page.manage.setting.traceCapture.form.webPlaceholder')
    }
  ];
});

function resetForm() {
  model.name = '';
  model.trackType = undefined;
  model.url = '';
  model.account = '';
  model.password = '';
  model.key = '';
  model.web = '';
  model.channel = '';
  model.accountNo = '';
}
function fillFormByRow() {
  if (!props.row) return;
  model.name = props.row.name;
  model.trackType = props.row.trackType;
  model.url = props.row.url ?? '';
  model.account = props.row.account ?? '';
  model.password = props.row.password ?? '';
  model.key = props.row.key ?? '';
  model.web = props.row.web ?? '';
  model.channel = props.row.channel ?? '';
  model.accountNo = props.row.accountNo ?? '';
}
async function handleSubmit() {
  if (!(await formRef.value?.validate())) return;
  submitting.value = true;
  try {
    const { error } = isCreate.value
      ? await fetchCreateTrackConfig({ ...model })
      : await fetchUpdateTrackConfig({ ...model, _id: props.row!._id });
    if (error) return;
    window.$message?.success($t(isCreate.value ? 'common.addSuccess' : 'common.updateSuccess'));
    drawerVisible.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}
// 切换系统类型：清空对接字段并重置表单校验；sync 保证编辑回显时先清空、再由 fillFormByRow 回填
watch(
  () => model.trackType,
  () => {
    model.account = '';
    model.password = '';
    model.key = '';
    model.accountNo = '';
    formRef.value?.restoreValidation();
  },
  { flush: 'sync' }
);
watch(
  () => props.show,
  val => {
    if (!val) return;
    if (isCreate.value) resetForm();
    else fillFormByRow();
  }
);
</script>

<template>
  <SiteDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="true"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" mode="edit" />
  </SiteDrawer>
</template>
