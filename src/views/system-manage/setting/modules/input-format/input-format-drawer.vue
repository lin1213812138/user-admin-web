<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import Drawer from '@/components/common/drawer.vue';
import FieldMapping, { type FieldMappingValue } from '../../components/FieldMapping.vue';
import {
  fetchCreateInputFormat,
  fetchGetInputFormatDetail,
  fetchGetInputFormatList,
  fetchUpdateInputFormat
} from '@/service/api/input-format';
import { buildNavGroups, fieldListToMapping, mappingToFieldList } from './field-list-mapper';

const props = withDefaults(
  defineProps<{
    /** 抽屉显隐（v-model:show） */
    show?: boolean;
    /** 编辑时传入的行数据（列表不含 fieldList，详情在抽屉内按 _id 拉取）；新增时传 null */
    row?: Api.InputFormat.OrderTemplate | null;
  }>(),
  {
    show: false,
    row: null
  }
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  /** 新增/编辑成功后通知父级刷新列表 */
  submitted: [];
}>();

interface InputFormatForm {
  name: string;
  status: Api.Common.EnableStatus;
  customerEnable: Api.Common.EnableStatus;
  isDefault: Api.Common.EnableStatus;
  order: number;
  note: string;
}

function emptyForm(): InputFormatForm {
  return { name: '', status: 1, customerEnable: 1, isDefault: 0, order: 0, note: '' };
}

const formModel = ref<InputFormatForm>(emptyForm());
/** 字段映射编辑器模型：分组 key -> { show[], required[] } */
const fieldMapping = ref<Record<string, FieldMappingValue>>({});
/** 底稿 fieldList：字段附加属性（keyMap/options/disabled…）以此为准原样透传 */
const baseFieldList = ref<Api.InputFormat.Field[]>([]);
/** 关联收货渠道：本期无编辑入口，编辑时取原值、新增时空数组 */
const channelIds = ref<string[]>([]);
/** 详情/底稿加载中 */
const loading = ref(false);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const drawerTitle = computed(() =>
  props.row ? $t('page.manage.setting.inputFormat.editTitle') : $t('page.manage.setting.inputFormat.newTitle')
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.setting.inputFormat.name'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t('page.manage.setting.inputFormat.namePlaceholder')
  },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'switch',
    span: 12,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable'),
    checkedValue: 1,
    uncheckedValue: 0
  },
  {
    key: 'customerEnable',
    label: $t('page.manage.setting.inputFormat.customerEnable'),
    type: 'switch',
    span: 8,
    checkedText: $t('page.manage.setting.inputFormat.yes'),
    uncheckedText: $t('page.manage.setting.inputFormat.no'),
    checkedValue: 1,
    uncheckedValue: 0
  },
  {
    key: 'isDefault',
    label: $t('page.manage.setting.inputFormat.isDefault'),
    type: 'switch',
    span: 8,
    checkedText: $t('page.manage.setting.inputFormat.yes'),
    uncheckedText: $t('page.manage.setting.inputFormat.no'),
    checkedValue: 1,
    uncheckedValue: 0
  },
  {
    key: 'order',
    label: $t('page.manage.setting.inputFormat.order'),
    type: 'number',
    span: 8,
    placeholder: $t('page.manage.setting.inputFormat.orderPlaceholder')
  },
  {
    key: 'note',
    label: $t('common.remark'),
    type: 'input',
    span: 24,
    placeholder: $t('page.manage.setting.inputFormat.remarkPlaceholder')
  }
]);

// 编辑器分组来自 fields-config（116 项 / 5 组），锁定态来自底稿中 disabled 的字段
const navGroups = computed(() => buildNavGroups(baseFieldList.value));

/** 套用底稿 fieldList：字段映射按「项存在=显示，required=1=必填」回显 */
function applyBaseFieldList(fieldList?: Api.InputFormat.Field[]) {
  baseFieldList.value = fieldList ?? [];
  fieldMapping.value = fieldListToMapping(baseFieldList.value);
}

/** 新增底稿：拷贝「是否默认」模板的 fieldList（含勾选状态），保证字段附加属性完整；无默认模板时为空 */
async function fetchDefaultTemplateFieldList(): Promise<Api.InputFormat.Field[]> {
  const { data, error } = await fetchGetInputFormatList({ scene: 1, page: 1, size: 1, where: { isDefault: 1 } });
  const defaultId = data?.list?.[0]?._id;
  if (error || !defaultId) return [];

  const { data: detail, error: detailError } = await fetchGetInputFormatDetail(defaultId);
  if (detailError || !detail) return [];

  return detail.fieldList ?? [];
}

async function loadDrawer() {
  loading.value = true;
  try {
    const row = props.row;

    if (!row) {
      formModel.value = emptyForm();
      channelIds.value = [];
      applyBaseFieldList(await fetchDefaultTemplateFieldList());
      return;
    }

    // 列表不返回 fieldList，编辑态需按 _id 拉完整文档
    const { data, error } = await fetchGetInputFormatDetail(row._id);
    if (error || !data) return;

    formModel.value = {
      name: data.name ?? '',
      status: data.status ?? 1,
      customerEnable: data.customerEnable ?? 1,
      isDefault: data.isDefault ?? 0,
      order: data.order ?? 0,
      note: data.note ?? ''
    };
    channelIds.value = data.channelIds ?? [];
    applyBaseFieldList(data.fieldList);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.show,
  value => {
    if (!value) return;
    formRef.value?.restoreValidation();
    loadDrawer();
  }
);

async function handleSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  const payload: Api.InputFormat.SaveParams = {
    name: formModel.value.name.trim(),
    status: formModel.value.status,
    customerEnable: formModel.value.customerEnable,
    isDefault: formModel.value.isDefault,
    order: formModel.value.order ?? 0,
    note: formModel.value.note?.trim() ?? '',
    channelIds: channelIds.value,
    fieldList: mappingToFieldList(fieldMapping.value, baseFieldList.value)
  };

  submitting.value = true;
  try {
    if (props.row) {
      const { error } = await fetchUpdateInputFormat({ ...payload, _id: props.row._id });
      // 后端错误（重名等）已由 request 拦截器统一提示，这里保持抽屉打开
      if (error) return;
      window.$message?.success($t('common.updateSuccess'));
    } else {
      const { error } = await fetchCreateInputFormat(payload);
      if (error) return;
      window.$message?.success($t('common.addSuccess'));
    }

    emit('update:show', false);
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer
    :show="show"
    :title="drawerTitle"
    width="70%"
    :footer="true"
    :loading="loading || submitting"
    @update:show="value => emit('update:show', value)"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" :disabled="loading" />
    <FieldMapping :nav-groups="navGroups" :model-value="fieldMapping" @update:model-value="fieldMapping = $event" />
  </Drawer>
</template>
