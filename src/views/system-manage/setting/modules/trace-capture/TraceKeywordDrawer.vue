<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { fetchCreateTraceKeyword, fetchUpdateTraceKeyword } from '@/service/api/system-manage';
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

const model = reactive<Api.SystemManage.TraceKeywordCreateParams>({
  ruleName: '',
  scope: 'global',
  keywordGroup: '',
  waybillStatus: 'in-transit',
  enabled: 1
});

/** 使用范围下拉（value 存枚举 key、label 走 i18n） */
const scopeOptions: SelectOption[] = [
  { label: $t('page.manage.setting.traceCapture.scopeOption.global'), value: 'global' },
  { label: $t('page.manage.setting.traceCapture.scopeOption.site'), value: 'site' },
  { label: $t('page.manage.setting.traceCapture.scopeOption.customer'), value: 'customer' }
];

/** 运单状态下拉 */
const waybillStatusOptions: SelectOption[] = [
  { label: $t('page.manage.setting.traceCapture.waybillStatusOption.inTransit'), value: 'in-transit' },
  { label: $t('page.manage.setting.traceCapture.waybillStatusOption.delivered'), value: 'delivered' },
  { label: $t('page.manage.setting.traceCapture.waybillStatusOption.exception'), value: 'exception' },
  { label: $t('page.manage.setting.traceCapture.waybillStatusOption.returned'), value: 'returned' }
];

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'ruleName',
    label: $t('page.manage.setting.traceCapture.form.ruleName'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.ruleNamePlaceholder')
  },
  {
    key: 'scope',
    label: $t('page.manage.setting.traceCapture.form.scope'),
    type: 'select',
    required: true,
    span: 24,
    options: scopeOptions
  },
  {
    key: 'keywordGroup',
    label: $t('page.manage.setting.traceCapture.form.keywordGroup'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.keywordGroupPlaceholder')
  },
  {
    key: 'waybillStatus',
    label: $t('page.manage.setting.traceCapture.form.waybillStatus'),
    type: 'select',
    required: true,
    span: 24,
    options: waybillStatusOptions
  },
  {
    key: 'enabled',
    label: $t('page.manage.setting.traceCapture.form.enabled'),
    type: 'switch',
    span: 24,
    checkedValue: 1,
    uncheckedValue: 0
  }
]);

function fillFormByRow() {
  if (!props.row) return;
  model.ruleName = props.row.ruleName;
  model.scope = props.row.scope;
  model.keywordGroup = props.row.keywordGroup;
  model.waybillStatus = props.row.waybillStatus;
  model.enabled = props.row.enabled;
}

function resetForm() {
  model.ruleName = '';
  model.scope = 'global';
  model.keywordGroup = '';
  model.waybillStatus = 'in-transit';
  model.enabled = 1;
}

async function handleSubmit() {
  if (!(await formRef.value?.validate())) {
    return;
  }

  submitting.value = true;

  try {
    if (isCreate.value) {
      await fetchCreateTraceKeyword({ ...model });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateTraceKeyword({ id: props.row!.id, ...model });
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
