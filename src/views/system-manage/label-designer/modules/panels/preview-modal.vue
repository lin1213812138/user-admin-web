<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { renderPrintDocument } from '../render/render-element-html';
import { PX_PER_MM, parsePaper } from '../core/constant';

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
    class="label-preview-modal"
    :style="{ width: 'auto', maxWidth: '90vw' }"
    @update:show="v => emit('update:show', v)"
  >
    <div class="w-fit mx-auto p-16px pb-32px">
      <iframe
        id="label-preview-frame"
        :srcdoc="doc"
        :style="frameStyle"
        class="border-0 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.2)]"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-8px">
        <LButton @click="close">{{ $t('common.cancel') }}</LButton>
        <LButton type="primary" @click="print">{{ $t('page.manage.labelDesign.print') }}</LButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
/* naive 遮罩层默认 fixed + overflow:visible 不可滚，超高内容会溢出视口。
   改为可滚（滚轮滚动、无滚动条视觉），上下 40px 间隔属于滚动内容——
   弹窗高度完全随纸张，超高时整体上滚，滚到底 footer 下仍留 40px 空白。 */
:global(.n-modal-body-wrapper:has(.label-preview-modal)) {
  overflow-y: auto;
  scrollbar-width: none;
}

:global(.n-modal-body-wrapper:has(.label-preview-modal)::-webkit-scrollbar) {
  display: none;
}

:global(.n-modal-body-wrapper:has(.label-preview-modal) .n-modal-scroll-content) {
  padding: 40px 0;
}
</style>
