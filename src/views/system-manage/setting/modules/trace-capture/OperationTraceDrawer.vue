<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateOperationTrace, fetchUpdateOperationTrace } from '@/service/api/system-manage';
import SiteDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    mode?: DrawerMode;
    row?: Api.SystemManage.OperationTraceItem | null;
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

const model = reactive<Api.SystemManage.OperationTraceCreateParams>({
  node: '',
  timeFormat: '',
  location: '',
  description: '',
  published: 0
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'node',
    label: $t('page.manage.setting.traceCapture.form.node'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.nodePlaceholder')
  },
  {
    key: 'timeFormat',
    label: $t('page.manage.setting.traceCapture.form.timeFormat'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.timeFormatPlaceholder')
  },
  {
    key: 'location',
    label: $t('page.manage.setting.traceCapture.form.location'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.locationPlaceholder')
  },
  {
    key: 'description',
    label: $t('page.manage.setting.traceCapture.form.description'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.descriptionPlaceholder')
  },
  {
    key: 'published',
    label: $t('page.manage.setting.traceCapture.form.published'),
    type: 'switch',
    span: 24,
    checkedValue: 1,
    uncheckedValue: 0
  }
]);

function resetForm() {
  model.node = '';
  model.timeFormat = '';
  model.location = '';
  model.description = '';
  model.published = 0;
}
function fillFormByRow() {
  if (!props.row) return;
  model.node = props.row.node;
  model.timeFormat = props.row.timeFormat;
  model.location = props.row.location;
  model.description = props.row.description;
  model.published = props.row.published;
}
async function handleSubmit() {
  if (!(await formRef.value?.validate())) return;
  submitting.value = true;
  try {
    if (isCreate.value) {
      await fetchCreateOperationTrace({ ...model });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateOperationTrace({ id: props.row!.id, ...model });
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
