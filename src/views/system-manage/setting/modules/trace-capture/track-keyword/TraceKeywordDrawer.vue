<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { fetchCreateTraceKeyword, fetchUpdateTraceKeyword } from '@/service/api/trace-keyword';
import SiteDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 */
  mode?: DrawerMode;
  /** 编辑行数据 */
  row?: Api.SystemManage.TraceKeywordItem | null;
  /** 关联追踪网络下拉数据源（父级已拉全量） */
  trackConfigOptions?: { label: string; value: string }[];
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  mode: 'create',
  row: null,
  trackConfigOptions: () => []
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

/** 表单模型（detectEvents 后端为数组，界面用逗号分隔字符串编辑，提交时拆分） */
const model = reactive<Api.SystemManage.TraceKeywordCreateParams & { detectEventsText: string }>({
  name: '',
  common: 1,
  configIds: [],
  detectEvents: [],
  detectEventsText: '',
  orderStatus: 50
});

/** 运单状态下拉（value 存后端数字枚举、label 走 i18n） */
const orderStatusOptions: SelectOption[] = [
  { label: $t('page.manage.setting.traceCapture.waybillStatusOption.inTransit'), value: 50 },
  { label: $t('page.manage.setting.traceCapture.waybillStatusOption.delivered'), value: 60 },
  { label: $t('page.manage.setting.traceCapture.waybillStatusOption.exception'), value: 70 },
  { label: $t('page.manage.setting.traceCapture.waybillStatusOption.returned'), value: 80 }
];

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.setting.traceCapture.form.ruleName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.ruleNamePlaceholder')
  },
  {
    key: 'common',
    label: $t('page.manage.setting.traceCapture.form.common'),
    type: 'switch',
    span: 24,
    checkedValue: 1,
    uncheckedValue: 0,
    checkedText: $t('common.yesOrNo.yes'),
    uncheckedText: $t('common.yesOrNo.no')
  },
  {
    key: 'configIds',
    label: $t('page.manage.setting.traceCapture.form.configIds'),
    type: 'select',
    span: 24,
    options: props.trackConfigOptions,
    multiple: true,
    clearable: true,
    filterable: false,
    placeholder: $t('page.manage.setting.traceCapture.form.configIdsPlaceholder')
  },
  {
    key: 'detectEventsText',
    label: $t('page.manage.setting.traceCapture.form.keywordGroup'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.keywordGroupPlaceholder')
  },
  {
    key: 'orderStatus',
    label: $t('page.manage.setting.traceCapture.form.waybillStatus'),
    type: 'select',
    required: true,
    span: 24,
    options: orderStatusOptions
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.name = props.row.name;
  model.common = props.row.common;
  model.configIds = [...(props.row.configIds ?? [])];
  model.detectEvents = [...(props.row.detectEvents ?? [])];
  model.detectEventsText = (props.row.detectEvents ?? []).join('，');
  model.orderStatus = props.row.orderStatus;
}

function resetForm() {
  model.name = '';
  model.common = 1;
  model.configIds = [];
  model.detectEvents = [];
  model.detectEventsText = '';
  model.orderStatus = 50;
}

/** 逗号分隔字符串 → 关键词数组（去空、去重） */
function parseDetectEvents(text: string) {
  return [
    ...new Set(
      text
        .split(/[,，]/)
        .map(item => item.trim())
        .filter(Boolean)
    )
  ];
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) {
    return;
  }

  const detectEvents = parseDetectEvents(model.detectEventsText);
  if (detectEvents.length === 0) {
    window.$message?.warning($t('page.manage.setting.traceCapture.form.keywordGroupPlaceholder'));
    return;
  }

  submitting.value = true;

  try {
    // 真实接口错误已由 request 拦截器统一提示
    const { error } = isCreate.value
      ? await fetchCreateTraceKeyword({
          name: model.name,
          common: model.common,
          configIds: model.configIds,
          detectEvents,
          orderStatus: model.orderStatus
        })
      : await fetchUpdateTraceKeyword({
          _id: props.row!._id,
          name: model.name,
          common: model.common,
          configIds: model.configIds,
          detectEvents,
          orderStatus: model.orderStatus
        });

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
