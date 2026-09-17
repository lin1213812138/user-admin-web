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
  name: '',
  timeType: 1,
  place: '',
  desc: '',
  detectDesc: ''
});

/** 时间格式下拉三选一，value 存后端数字枚举、label 走 i18n */
const timeTypeOptions: SelectOption[] = [
  { label: $t('page.manage.setting.traceCapture.timeFormatOption.ymd'), value: 0 },
  { label: $t('page.manage.setting.traceCapture.timeFormatOption.ymdHm'), value: 1 },
  { label: $t('page.manage.setting.traceCapture.timeFormatOption.ymdHms'), value: 2 }
];

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.setting.traceCapture.form.statusName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.statusNamePlaceholder')
  },
  {
    key: 'timeType',
    label: $t('page.manage.setting.traceCapture.form.timeFormat'),
    type: 'select',
    required: true,
    span: 24,
    options: timeTypeOptions
  },
  {
    key: 'place',
    label: $t('page.manage.setting.traceCapture.form.location'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.locationPlaceholder')
  },
  {
    key: 'desc',
    label: $t('page.manage.setting.traceCapture.form.description'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.descriptionPlaceholder')
  },
  {
    key: 'detectDesc',
    label: $t('page.manage.setting.traceCapture.form.keywordDefinition'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.keywordDefinitionPlaceholder')
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.name = props.row.name;
  model.timeType = props.row.timeType;
  model.place = props.row.place ?? '';
  model.desc = props.row.desc ?? '';
  model.detectDesc = props.row.detectDesc ?? '';
}

function resetForm() {
  model.name = '';
  model.timeType = 1;
  model.place = '';
  model.desc = '';
  model.detectDesc = '';
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) {
    return;
  }

  submitting.value = true;

  try {
    // 真实接口错误已由 request 拦截器统一提示
    const { error } = isCreate.value
      ? await fetchCreateTraceTransform({ ...model })
      : await fetchUpdateTraceTransform({ _id: props.row!._id, ...model });

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
