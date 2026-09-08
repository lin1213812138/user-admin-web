<script setup lang="ts">
import { ref, watch } from 'vue';
import printLockCss from 'vue-plugin-hiprint/dist/print-lock.css?url';
import { $t } from '@/locales';
import { buildSampleData } from './print-fields';
import { loadHiprint } from './use-hiprint';

const props = defineProps<{ show: boolean; designJson: string }>();

const emit = defineEmits<{ 'update:show': [value: boolean] }>();

const html = ref('');
const frameRef = ref<HTMLIFrameElement | null>(null);

/** getHtml 的返回值在部分版本是 DTO / 数组，这里统一取字符串 */
function toHtmlString(result: unknown): string {
  if (typeof result === 'string') return result;

  if (Array.isArray(result)) {
    return result.map(item => toHtmlString(item)).join('');
  }

  const target = result as { html?: () => string };

  return typeof target.html === 'function' ? target.html() : '';
}

watch(
  () => [props.show, props.designJson],
  async ([show]) => {
    if (!show) return;

    const api = await loadHiprint();
    const template = props.designJson ? (JSON.parse(props.designJson) as unknown) : {};
    const instance = new api.PrintTemplate({ template });

    html.value = toHtmlString(instance.getHtml(buildSampleData()));
  }
);

/** getHtml 返回的是纸张片段，补全为完整文档后再注入 iframe */
function buildDocument(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><link rel="stylesheet" href="${printLockCss}" /></head><body>${html.value}</body></html>`;
}

function handlePrint() {
  frameRef.value?.contentWindow?.print();
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    class="w-800px"
    :title="$t('page.manage.printDesign.preview')"
    @update:show="value => emit('update:show', value)"
  >
    <div class="h-520px w-full overflow-auto bg-#f5f5f5">
      <iframe ref="frameRef" class="h-full w-full border-0" :srcdoc="buildDocument()"></iframe>
    </div>
    <template #footer>
      <div class="flex justify-end gap-8px">
        <NButton size="small" @click="emit('update:show', false)">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" size="small" @click="handlePrint">{{ $t('page.manage.printDesign.print') }}</NButton>
      </div>
    </template>
  </NModal>
</template>
