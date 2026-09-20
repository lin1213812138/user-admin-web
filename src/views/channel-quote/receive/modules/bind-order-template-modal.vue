<script setup lang="ts">
/**
 * 绑定录单格式（收货渠道）
 *
 * 绑定关系存在**录单格式**一侧（tms-user OrderTemplate.channelIds），后端无专用接口，
 * 只能走 `/order-template/update` 部分更新 ⇒ 每次必须随行回传 `name`（uniqField:'name' 重名校验）。
 * 语义（spec Q1）：一个渠道只属于一个录单格式 —— 确定时先从其它已绑格式解绑，再加入所选格式。
 */
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchBindInputFormatChannels, fetchGetInputFormatList } from '@/service/api/input-format';

const emit = defineEmits<{
  submitted: [];
}>();

const visible = ref(false);
/** 选项加载中（加载期间禁用表单，避免拿到空选项就提交） */
const loading = ref(false);
const saving = ref(false);
const channel = ref<Api.ChannelQuote.ReceiveChannel | null>(null);
const templates = ref<Api.InputFormat.OrderTemplate[]>([]);
/** 当前已绑定的录单格式 id（打开时回查：既用于回显，也用于「未变更直接关闭」判断） */
const boundId = ref<string | null>(null);
const formModel = ref<{ templateId: string | null }>({ templateId: null });
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'templateId',
    label: $t('page.channelQuote.receive.orderTemplate'),
    type: 'select',
    required: true,
    span: 24,
    placeholder: $t('page.channelQuote.receive.orderTemplatePlaceholder'),
    options: templates.value.map(item => ({ label: item.name, value: item._id }))
  }
]);

/** 打开弹窗：拉全部录单格式（scene=1 管理端口径）并回查该渠道当前所属格式 */
async function open(row: Api.ChannelQuote.ReceiveChannel) {
  channel.value = row;
  boundId.value = null;
  formModel.value.templateId = null;
  templates.value = [];
  visible.value = true;
  formRef.value?.restoreValidation();
  loading.value = true;
  try {
    const { data, error } = await fetchGetInputFormatList({ scene: 1, page: 1, size: 9999 });
    if (error || !data) return;
    templates.value = data.list;
    const bound = data.list.find(item => (item.channelIds ?? []).includes(row._id));
    boundId.value = bound?._id ?? null;
    formModel.value.templateId = bound?._id ?? null;
  } finally {
    loading.value = false;
  }
}

/** 确定：先从其它已绑格式解绑，再绑到所选格式 */
async function handleConfirm() {
  const row = channel.value;
  if (!row) return;
  if (!(await formRef.value?.validate())) return;

  const targetId = formModel.value.templateId;
  if (!targetId) return;
  // 未变更：无需请求
  if (targetId === boundId.value) {
    visible.value = false;
    return;
  }
  const target = templates.value.find(item => item._id === targetId);
  if (!target) return;

  saving.value = true;
  try {
    // 1) 其它格式解绑（部分更新只提交 channelIds）
    const others = templates.value.filter(item => item._id !== targetId && (item.channelIds ?? []).includes(row._id));
    for (const other of others) {
      const channelIds = (other.channelIds ?? []).filter(id => id !== row._id);
      const { error } = await fetchBindInputFormatChannels({ _id: other._id, name: other.name, channelIds });
      if (error) return;
    }
    // 2) 绑定到所选格式（去重追加）
    const channelIds = [...new Set([...(target.channelIds ?? []), row._id])];
    const { error } = await fetchBindInputFormatChannels({ _id: target._id, name: target.name, channelIds });
    if (error) return;

    window.$message?.success($t('common.saveSuccess'));
    visible.value = false;
    emit('submitted');
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.channelQuote.receive.bindOrderTemplate')"
    style="width: 640px"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" :disabled="loading" />

    <template #footer>
      <div class="flex justify-end gap-12px">
        <LButton @click="visible = false">{{ $t('common.cancel') }}</LButton>
        <LButton type="primary" :loading="saving" @click="handleConfirm">{{ $t('common.confirm') }}</LButton>
      </div>
    </template>
  </NModal>
</template>
