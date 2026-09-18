<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { $t } from '@/locales';
import { NButton, NDataTable, NInput } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchBatchSaveTrackReplace, fetchGetTrackReplaceList } from '@/service/api/track-replace';

const props = withDefaults(defineProps<{ show?: boolean; configId?: string; networkName?: string }>(), {
  show: false,
  configId: '',
  networkName: ''
});

const emit = defineEmits<{ 'update:show': [value: boolean] }>();

const visible = computed({ get: () => props.show, set: val => emit('update:show', val) });
const list = ref<Api.SystemManage.TraceReplaceItem[]>([]);
const saving = ref(false);

const columns: DataTableColumns<Api.SystemManage.TraceReplaceItem> = [
  {
    title: $t('page.manage.setting.traceCapture.col.oriStr'),
    key: 'oriStr',
    render: (row: Api.SystemManage.TraceReplaceItem) =>
      h(NInput, {
        value: row.oriStr ?? '',
        'onUpdate:value': (v: string) => {
          row.oriStr = v;
        }
      })
  },
  {
    title: $t('page.manage.setting.traceCapture.col.replaceStr'),
    key: 'replaceStr',
    render: (row: Api.SystemManage.TraceReplaceItem) =>
      h(NInput, {
        value: row.replaceStr ?? '',
        'onUpdate:value': (v: string) => {
          row.replaceStr = v;
        }
      })
  },
  {
    title: $t('common.delete'),
    key: 'action',
    width: 80,
    align: 'center',
    render: (row: Api.SystemManage.TraceReplaceItem) =>
      h(
        NButton,
        {
          text: true,
          type: 'error',
          onClick: () => {
            const idx = list.value.indexOf(row);
            if (idx > -1) list.value.splice(idx, 1);
          }
        },
        { default: () => $t('common.delete') }
      )
  }
];

watch(
  () => props.show,
  async val => {
    if (!val || !props.configId) return;
    const { data, error } = await fetchGetTrackReplaceList({
      where: { configId: props.configId },
      page: 1,
      size: 999
    });
    if (error || !data) {
      list.value = [];
      return;
    }
    list.value = data.list.map(item => ({ ...item }));
  }
);

function addRow() {
  list.value.push({ oriStr: '', replaceStr: '' });
}

async function handleSave() {
  if (!props.configId) return;
  const payload = list.value.filter(r => (r.oriStr ?? '').trim() || (r.replaceStr ?? '').trim());
  saving.value = true;
  try {
    const { error } = await fetchBatchSaveTrackReplace({ configId: props.configId, list: payload });
    if (error) return;
    window.$message?.success($t('common.saveSuccess'));
    visible.value = false;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.manage.setting.traceCapture.subTab.trackNetwork')"
    style="width: 640px"
  >
    <div class="mb-12px flex items-center gap-12px">
      <span class="shrink-0 text-14px">{{ $t('page.manage.setting.traceCapture.subTab.trackNetwork') }}：</span>
      <NInput :value="networkName" disabled />
    </div>
    <div class="mb-12px flex items-center justify-between">
      <span class="font-medium">{{ $t('page.manage.setting.traceCapture.transformRules') }}</span>
      <NButton size="small" type="primary" @click="addRow">
        {{ $t('page.manage.setting.traceCapture.addRuleRow') }}
      </NButton>
    </div>
    <NDataTable :columns="columns" :data="list" :bordered="false" />

    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="saving" @click="handleSave">{{ $t('common.save') }}</NButton>
      </div>
    </template>
  </NModal>
</template>
