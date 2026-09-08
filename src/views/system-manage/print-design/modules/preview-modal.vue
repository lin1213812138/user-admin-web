<script setup lang="ts">
import { $t } from '@/locales';
import { watch, nextTick } from 'vue';

const props = defineProps<{ show: boolean; html?: string }>();

const emit = defineEmits<{ 'update:show': [value: boolean] }>();

function handlePrint() {
  // 预览 iframe 内的打印由内部 window 触发，这里通过 ref 调用
  const frame = document.querySelector<HTMLIFrameElement>('#print-preview-frame');
  frame?.contentWindow?.print();
}

// 根据 iframe 文档内容计算高度，使其自适应、无需滚动
function fitFrameHeight() {
  const frame = document.querySelector<HTMLIFrameElement>('#print-preview-frame');
  if (!frame) return;
  try {
    const doc = frame.contentDocument;
    if (!doc) return;
    const height = Math.max(
      doc.body.scrollHeight,
      doc.documentElement.scrollHeight,
      doc.body.offsetHeight,
      doc.documentElement.offsetHeight
    );
    frame.style.height = `${height}px`;
  } catch {
    /* 跨域等异常时忽略，保持默认高度 */
  }
}

// iframe 加载完成后自适应高度（加载时若弹窗隐藏会测得 0，这里再补一次）
function onFrameLoad() {
  fitFrameHeight();
}

// 弹窗由隐藏变为显示时重新测量（此时元素已可见，可得到正确高度）
watch(
  () => props.show,
  val => {
    if (val) {
      nextTick(() => setTimeout(fitFrameHeight, 0));
    }
  }
);
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    class="w-800px"
    :title="$t('page.manage.printDesign.preview')"
    @update:show="value => emit('update:show', value)"
  >
    <div class="w-full bg-#f5f5f5">
      <iframe
        id="print-preview-frame"
        class="w-full border-0"
        scrolling="no"
        :srcdoc="props.html || ''"
        @load="onFrameLoad"
      ></iframe>
    </div>
    <template #footer>
      <div class="flex justify-end gap-8px">
        <NButton size="small" @click="emit('update:show', false)">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" size="small" @click="handlePrint">{{ $t('page.manage.printDesign.print') }}</NButton>
      </div>
    </template>
  </NModal>
</template>
