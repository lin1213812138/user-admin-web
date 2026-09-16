<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { fetchCreateTraceTransform, fetchUpdateTraceTransform } from '@/service/api/trace-transform';
import SiteDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 */
  mode?: DrawerMode;
  /** 编辑行数据 */
  row?: Api.SystemManage.TraceTransformItem | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  mode: 'create',
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

const isCreate = computed(() => props.mode === 'create');

const title = computed(() =>
  isCreate.value ? $t('page.manage.setting.traceCapture.createTitle') : $t('page.manage.setting.traceCapture.editTitle')
);

const submitting = ref(false);

const formRef = ref<InstanceType<typeof NFormWrap>>();

const model = reactive<Api.SystemManage.TraceTransformCreateParams>({
  statusName: '',
  timeFormat: 'ymd-hm',
  location: '',
  description: '',
  keywordDefinition: ''
});

/** 时间格式下拉三选一，value 存枚举 key、label 走 i18n */
const timeFormatOptions: SelectOption[] = [
  { label: $t('page.manage.setting.traceCapture.timeFormatOption.ymd'), value: 'ymd' },
  { label: $t('page.manage.setting.traceCapture.timeFormatOption.ymdHm'), value: 'ymd-hm' },
  { label: $t('page.manage.setting.traceCapture.timeFormatOption.ymdHms'), value: 'ymd-hms' }
];

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'statusName',
    label: $t('page.manage.setting.traceCapture.form.statusName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.statusNamePlaceholder')
  },
  {
    key: 'timeFormat',
    label: $t('page.manage.setting.traceCapture.form.timeFormat'),
    type: 'select',
    required: true,
    span: 24,
    options: timeFormatOptions
  },
  {
    key: 'location',
    label: $t('page.manage.setting.traceCapture.form.location'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.locationPlaceholder')
  },
  {
    key: 'description',
    label: $t('page.manage.setting.traceCapture.form.description'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.descriptionPlaceholder')
  },
  {
    key: 'keywordDefinition',
    label: $t('page.manage.setting.traceCapture.form.keywordDefinition'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.keywordDefinitionPlaceholder')
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.statusName = props.row.statusName;
  model.timeFormat = props.row.timeFormat;
  model.location = props.row.location;
  model.description = props.row.description;
  model.keywordDefinition = props.row.keywordDefinition;
}

function resetForm() {
  model.statusName = '';
  model.timeFormat = 'ymd-hm';
  model.location = '';
  model.description = '';
  model.keywordDefinition = '';
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) {
    return;
  }

  submitting.value = true;

  try {
    if (isCreate.value) {
      await fetchCreateTraceTransform({ ...model });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateTraceTransform({ id: props.row!.id, ...model });
      window.$message?.success($t('common.updateSuccess'));
    }

    drawerVisible.value = false;
    emit('submitted');
  } catch (error) {
    // 本地 mock 校验会抛错需自行提示；真实接口错误已由 request 拦截器统一提示
    window.$message?.error(error instanceof Error ? error.message : String(error));
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.show,
  val => {
    if (!val) return;

    if (isCreate.value) {
      resetForm();
    } else {
      fillFormByRow();
    }
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
