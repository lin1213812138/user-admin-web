<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateTraceConfig, fetchUpdateTraceConfig } from '@/service/api/system-manage';
import SiteDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    mode?: DrawerMode;
    category?: Api.SystemManage.TraceCaptureCategory;
    row?: Api.SystemManage.TraceConfigItem | null;
  }>(),
  { show: false, mode: 'create', category: 'track-network', row: null }
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
  category: 'track-network',
  name: '',
  serverAddress: '',
  systemType: ''
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.setting.traceCapture.form.name'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.namePlaceholder')
  },
  {
    key: 'serverAddress',
    label: $t('page.manage.setting.traceCapture.form.serverAddress'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.serverAddressPlaceholder')
  },
  {
    key: 'systemType',
    label: $t('page.manage.setting.traceCapture.form.systemType'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.systemTypePlaceholder')
  }
]);

function resetForm() {
  model.category = props.category ?? 'track-network';
  model.name = '';
  model.serverAddress = '';
  model.systemType = '';
}
function fillFormByRow() {
  if (!props.row) return;
  model.category = props.row.category;
  model.name = props.row.name;
  model.serverAddress = props.row.serverAddress;
  model.systemType = props.row.systemType;
}
async function handleSubmit() {
  if (!(await formRef.value?.validate())) return;
  submitting.value = true;
  try {
    if (isCreate.value) {
      await fetchCreateTraceConfig({ ...model, category: props.category ?? 'track-network' });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateTraceConfig({ id: props.row!.id, ...model });
      window.$message?.success($t('common.updateSuccess'));
    }
    drawerVisible.value = false;
    emit('submitted');
  } catch (error) {
    window.$message?.error(error instanceof Error ? error.message : String(error));
  } finally {
    submitting.value = false;
  }
}
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
