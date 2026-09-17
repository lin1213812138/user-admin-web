<script setup lang="ts">
/**
 * 抓取时间配置弹窗：配置系统每天自动抓取轨迹的时间点（只要小时，可多个）
 * - 每行用下拉框选择小时（00 ~ 23，不含分钟部分）
 * - 打开时读取当前配置渲染时间行（无配置默认 1 行空值）
 * - 「添加时间」追加行、「删除」移除行（仅剩 1 行时禁用）
 * - 「保存配置」校验非空 / 不重复后提交 /track-schedule/save（后端单文档 upsert）
 */
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import { NButton, NModal, NSelect } from 'naive-ui';
import { fetchGetCaptureTimeConfig, fetchSaveCaptureTimeConfig } from '@/service/api/capture-time';

const props = withDefaults(defineProps<{ show?: boolean }>(), { show: false });

const emit = defineEmits<{ 'update:show': [value: boolean] }>();

const modalVisible = computed({ get: () => props.show, set: val => emit('update:show', val) });

/** 每天可选抓取时间（只要小时：00 ~ 23） */
const hourOptions = Array.from({ length: 24 }, (_, hour) => {
  const value = String(hour).padStart(2, '0');
  return { label: value, value };
});

/** 时间行（值为小时字符串 "00" ~ "23"，null 表示尚未选择） */
interface TimeRow {
  id: number;
  value: string | null;
}

let rowSeq = 0;
const rows = ref<TimeRow[]>([]);
const saving = ref(false);

function createRow(value: string | null): TimeRow {
  rowSeq += 1;
  return { id: rowSeq, value };
}

/** 打开弹窗时拉取当前配置（无配置时默认 1 行空值） */
async function loadConfig() {
  const { data, error } = await fetchGetCaptureTimeConfig();
  if (error) return;
  // 后端 exeTimes 为 0-23 数字数组，界面行值统一用 "00" ~ "23" 字符串
  const times = (data?.exeTimes ?? []).map(hour => String(hour).padStart(2, '0'));
  rows.value = times.length > 0 ? times.map(item => createRow(item)) : [createRow(null)];
}

watch(
  () => props.show,
  val => {
    if (val) loadConfig();
  }
);

function handleAdd() {
  rows.value.push(createRow(null));
}

function handleRemove(id: number) {
  rows.value = rows.value.filter(row => row.id !== id);
}

async function handleSave() {
  const times = rows.value.map(row => row.value ?? '');
  if (times.some(item => !item)) {
    window.$message?.warning($t('page.manage.setting.traceCapture.captureTime.emptyTime'));
    return;
  }
  if (new Set(times).size !== times.length) {
    window.$message?.warning($t('page.manage.setting.traceCapture.captureTime.duplicateTime'));
    return;
  }
  saving.value = true;
  try {
    // 真实接口错误已由 request 拦截器统一提示
    const { error } = await fetchSaveCaptureTimeConfig({ exeTimes: times.map(item => Number(item)) });
    if (error) return;
    window.$message?.success($t('common.saveSuccess'));
    modalVisible.value = false;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="card"
    :title="$t('page.manage.setting.traceCapture.captureTime.title')"
    :bordered="false"
    style="width: 420px"
  >
    <div class="flex flex-col">
      <div class="text-14px text-#909399">{{ $t('page.manage.setting.traceCapture.captureTime.desc') }}</div>
      <div v-for="row in rows" :key="row.id" class="mt-12px flex-y-center gap-12px">
        <NSelect
          v-model:value="row.value"
          :options="hourOptions"
          :placeholder="$t('page.manage.setting.traceCapture.captureTime.timePlaceholder')"
          class="w-180px!"
        />
        <NButton size="small" type="error" text :disabled="rows.length <= 1" @click="handleRemove(row.id)">
          {{ $t('common.delete') }}
        </NButton>
      </div>
      <div class="mt-16px flex-y-center gap-12px">
        <NButton size="small" @click="handleAdd">
          {{ $t('page.manage.setting.traceCapture.captureTime.addTime') }}
        </NButton>
        <NButton size="small" type="primary" :loading="saving" @click="handleSave">
          {{ $t('page.manage.setting.traceCapture.captureTime.saveConfig') }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>
