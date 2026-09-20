<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchImportNoPool } from '@/service/api/data-manage-no-rule';
import { fetchGetChannelList } from '@/service/api/channel';
import { fetchGetChannelOutList } from '@/service/api/channel-out';

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const submitting = ref(false);
const formModel = ref<Api.NoPool.ImportForm>({
  refType: 0,
  channel: null,
  noText: ''
});
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);
const channelOptions = ref<SelectOption[]>([]);

const drawerTitle = computed(() => $t('page.dataManage.noRule.noPool.importTitle'));

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'refType',
    label: $t('page.dataManage.noRule.noPool.channelType'),
    type: 'select',
    required: true,
    span: 24,
    // 关联类型必填且联动渠道数据源，不允许清空
    clearable: false,
    optionsKey: 'noPoolRefType'
  },
  {
    key: 'channel',
    label: $t('page.dataManage.noRule.noPool.channel'),
    type: 'select',
    required: true,
    span: 24,
    filterable: true,
    placeholder: $t('page.dataManage.noRule.noPool.channelPlaceholder'),
    options: channelOptions.value
  },
  {
    key: 'noText',
    label: $t('page.dataManage.noRule.noPool.no'),
    type: 'textarea',
    required: true,
    span: 24,
    rows: 8,
    placeholder: $t('page.dataManage.noRule.noPool.noPlaceholder')
  }
]);

async function loadChannelOptions(refType: Api.NoPool.RefType) {
  channelOptions.value = [];
  formModel.value.channel = null;
  try {
    if (refType === 0) {
      const { data, error } = await fetchGetChannelList({ page: 1, size: 9999 });
      if (!error && data) {
        channelOptions.value = data.list.map(item => ({ label: item.name, value: item._id }));
      }
    } else {
      const { data, error } = await fetchGetChannelOutList({
        page: 1,
        size: 9999,
        channelType: refType === 2 ? 1 : 0
      });
      if (!error && data) {
        channelOptions.value = data.list.map(item => ({ label: item.name, value: item._id }));
      }
    }
  } catch {
    channelOptions.value = [];
  }
}

watch(
  () => formModel.value.refType,
  val => loadChannelOptions(val)
);

function openImport() {
  formModel.value = { refType: 0, channel: null, noText: '' };
  channelOptions.value = [];
  loadChannelOptions(0);
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;
  // 渠道必填校验已拦截，这里仅做类型收窄
  const channel = formModel.value.channel;
  if (!channel) return;
  const raw = (formModel.value.noText || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
  if (raw.length === 0) {
    window.$message?.warning($t('page.dataManage.noRule.noPool.emptyTip'));
    return;
  }
  const dedup = [...new Set(raw)];
  const list: Api.NoPool.ImportItem[] = dedup.map(no => ({
    no,
    refId: channel,
    refType: formModel.value.refType
  }));
  submitting.value = true;
  try {
    const { error } = await fetchImportNoPool(list);
    if (error) return;
    drawerVisible.value = false;
    emit('submitted');
    window.$message?.success($t('page.dataManage.noRule.noPool.importSuccess', { count: dedup.length }));
  } finally {
    submitting.value = false;
  }
}

defineExpose({ openImport });
</script>

<template>
  <Drawer
    v-model:show="drawerVisible"
    :title="drawerTitle"
    :loading="submitting"
    :confirm-text="$t('common.save')"
    @submit="handleDrawerSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
  </Drawer>
</template>
