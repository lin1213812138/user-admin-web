<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { fetchCreateProductGroup, fetchUpdateProductGroup } from '@/service/api/data-manage-archive';
import NFormWrap from '@/components/Form/index.vue';
import Drawer from '@/components/common/drawer.vue';
import type { FormItemConfig } from '@/components/Form/index.vue';
import { useArchiveStatusOptions, useArchiveYesNoOptions } from '@/views/data-manage/components/shared';

type Row = Api.DataManage.BusinessGoodsCategory;

const emit = defineEmits<{
  submitted: [];
}>();

const F = 'page.dataManage.business.goodsCategory';
const statusOptions = useArchiveStatusOptions();
const yesNoOptions = useArchiveYesNoOptions();

const formItems: FormItemConfig[] = [
  {
    key: 'name',
    label: $t(`${F}.name`),
    type: 'input',
    required: true,
    span: 12,
    placeholder: $t(`${F}.namePlaceholder`)
  },
  { key: 'status', label: $t('common.status'), type: 'select', span: 12, options: statusOptions.value },
  { key: 'sensitive', label: $t(`${F}.sensitive`), type: 'select', span: 12, options: yesNoOptions.value },
  { key: 'charged', label: $t(`${F}.charged`), type: 'select', span: 12, options: yesNoOptions.value },
  { key: 'danger', label: $t(`${F}.danger`), type: 'select', span: 12, options: yesNoOptions.value },
  { key: 'isDefault', label: $t(`${F}.isDefault`), type: 'select', span: 12, options: yesNoOptions.value },
  { key: 'note', label: $t(`${F}.note`), type: 'textarea', span: 24 }
];

const createDefault = (): Record<string, unknown> => ({
  name: '',
  sensitive: 0,
  charged: 0,
  danger: 0,
  isDefault: 0,
  note: '',
  status: 1
});

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const model = reactive<Record<string, unknown>>({});
const currentId = ref<string>('');
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const drawerTitle = computed(() => {
  const base = $t(`${F}.title` as App.I18n.I18nKey);
  const op = drawerMode.value === 'create' ? $t('common.add') : $t('common.edit');
  return `${op}${base}`;
});

function fillModel(source: Record<string, unknown>) {
  for (const it of formItems) {
    model[it.key] = source[it.key];
  }
}

function openCreate() {
  drawerMode.value = 'create';
  currentId.value = '';
  fillModel(createDefault());
  drawerVisible.value = true;
}

function openEdit(row: Row) {
  drawerMode.value = 'edit';
  currentId.value = (row as { _id?: string })?._id ?? '';
  fillModel((row ?? {}) as unknown as Record<string, unknown>);
  drawerVisible.value = true;
}

async function handleSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;
  submitting.value = true;
  try {
    if (drawerMode.value === 'create') {
      await fetchCreateProductGroup(model as Partial<Row>);
      window.$message?.success($t('common.createSuccess'));
    } else {
      await fetchUpdateProductGroup({ ...(model as object), _id: currentId.value } as Partial<Row>);
      window.$message?.success($t('common.updateSuccess'));
    }
    drawerVisible.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

defineExpose({ openCreate, openEdit });
</script>

<template>
  <Drawer v-model:show="drawerVisible" :title="drawerTitle" :loading="submitting" width="520" @submit="handleSubmit">
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" label-placement="top" />
  </Drawer>
</template>
