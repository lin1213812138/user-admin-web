<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateCustomerSource, fetchUpdateCustomerSource } from '@/service/api/customer-source';
import GroupDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 */
  mode?: DrawerMode;
  /** 编辑行数据 */
  row?: Api.SystemManage.CustomerSourceItem | null;
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
  props.mode === 'edit'
    ? $t('page.manage.customer.customerSourceManage.edit')
    : $t('page.manage.customer.customerSourceManage.add')
);

const submitting = ref(false);

const formRef = ref<InstanceType<typeof NFormWrap>>();

/**
 * 表单数据模型
 * - `name` 来源名称（必填）
 * - `order` 排序（默认 0）
 * - `note` 备注
 */
const model = reactive<Api.SystemManage.CustomerSourceSaveParams>({
  name: '',
  order: 0,
  note: '',
  status: 1
});

const statusOptions = [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
];

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.customer.customerSourceManage.name'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.customer.customerSourceManage.form.namePlaceholder')
  },
  {
    key: 'order',
    label: $t('page.manage.customer.customerSourceManage.order'),
    type: 'number',
    span: 12,
    min: 0,
    placeholder: $t('page.manage.customer.customerSourceManage.form.orderPlaceholder')
  },
  {
    key: 'status',
    label: $t('page.manage.customer.customerSourceManage.status'),
    type: 'select',
    span: 12,
    options: statusOptions
  },
  {
    key: 'note',
    label: $t('page.manage.customer.customerSourceManage.note'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.customer.customerSourceManage.form.notePlaceholder')
  }
]);

function fillFormByRow() {
  const row = props.row;
  if (!row) return;
  model.name = row.name ?? '';
  model.order = row.order ?? 0;
  model.note = row.note ?? '';
  model.status = row.status ?? 1;
}

function resetForm() {
  model.name = '';
  model.order = 0;
  model.note = '';
  model.status = 1;
}

async function handleSubmit() {
  const pass = await formRef.value?.validate();
  if (!pass) return;

  submitting.value = true;

  try {
    const payload: Record<string, unknown> = { ...model };

    if (isCreate.value) {
      const { error } = await fetchCreateCustomerSource(payload as Api.SystemManage.CustomerSourceSaveParams);
      if (error) return;
      window.$message?.success($t('common.addSuccess'));
    } else {
      const { error } = await fetchUpdateCustomerSource({
        _id: props.row!._id,
        ...(payload as Api.SystemManage.CustomerSourceSaveParams)
      });
      if (error) return;
      window.$message?.success($t('common.updateSuccess'));
    }

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
  <GroupDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="true"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" />
  </GroupDrawer>
</template>

<style scoped></style>
