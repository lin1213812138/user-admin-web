<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { renderPrintDocument } from './render-element-html';
import { PX_PER_MM, parsePaper } from './constant';

defineProps<{ show: boolean }>();
const emit = defineEmits<{ 'update:show': [boolean] }>();

const store = useLabelDesignStore();
const doc = computed(() => renderPrintDocument(store.template, 'label'));

const frameStyle = computed(() => {
  const { w, h } = parsePaper(store.template.paperSize);
  return { width: `${w * PX_PER_MM}px`, height: `${h * PX_PER_MM}px` };
});

function close() {
  emit('update:show', false);
}

function print() {
  const frame = document.getElementById('label-preview-frame') as HTMLIFrameElement | null;
  frame?.contentWindow?.focus();
  frame?.contentWindow?.print();
}
</script>

<template>
  <NModal
    :show="show"
    :title="$t('page.manage.labelDesign.preview')"
    preset="card"
    :style="{ width: 'auto', maxWidth: '95vw' }"
    @update:show="v => emit('update:show', v)"
  >
    <div class="flex justify-center overflow-auto" style="max-height: 70vh">
      <iframe id="label-preview-frame" :srcdoc="doc" :style="frameStyle" class="border-0 bg-white" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-8px">
        <NButton @click="close">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="print">{{ $t('page.manage.labelDesign.print') }}</NButton>
      </div>
    </template>
  </NModal>
</template>
