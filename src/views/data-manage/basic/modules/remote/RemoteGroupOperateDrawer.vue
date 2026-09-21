<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateRemoteGroup } from '@/service/api/remote-group';

defineOptions({ name: 'RemoteGroupOperateDrawer' });

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const submitting = ref(false);
const formModel = ref<{ name: string }>({ name: '' });
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

/** 截图口径：新增类别只有「类别名称」一个必填项（status / note 走后端默认值） */
const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.basic.remote.name'),
    type: 'input',
    required: true,
    placeholder: $t('page.dataManage.basic.remote.namePlaceholder')
  }
]);

function open() {
  formModel.value = { name: '' };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

async function handleSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  submitting.value = true;
  try {
    const { error } = await fetchCreateRemoteGroup({ name: formModel.value.name });
    if (error) return;

    drawerVisible.value = false;
    emit('submitted');
    window.$message?.success($t('common.createSuccess'));
  } finally {
    submitting.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Drawer
    v-model:show="drawerVisible"
    :title="$t('page.dataManage.basic.remote.createTitle')"
    :width="520"
    :loading="submitting"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
  </Drawer>
</template>
