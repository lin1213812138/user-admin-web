<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { PAPER_SIZES } from './constant';

const store = useLabelDesignStore();
const emit = defineEmits<{ preview: [] }>();

const paperOptions = PAPER_SIZES.map(s => ({ label: s, value: s }));

const zoomPercent = computed(() => Math.round(store.zoom * 100));

function setPaper(size: string) {
  store.setPaper(size);
}
function zoomIn() {
  store.setZoom(Number((store.zoom + 0.1).toFixed(2)));
}
function zoomOut() {
  store.setZoom(Number((store.zoom - 0.1).toFixed(2)));
}
function zoomReset() {
  store.setZoom(1);
}
</script>

<template>
  <div class="flex items-center gap-8px border-b border-#e5e7eb px-12px py-8px dark:border-#2a2a2a">
    <NButtonGroup>
      <NButton :disabled="!store.canUndo" @click="store.undo()">{{ $t('page.manage.labelDesign.undo') }}</NButton>
      <NButton :disabled="!store.canRedo" @click="store.redo()">{{ $t('page.manage.labelDesign.redo') }}</NButton>
    </NButtonGroup>

    <NDivider vertical />

    <NSelect :value="store.template.paperSize" :options="paperOptions" style="width: 160px" @update:value="setPaper" />

    <NDivider vertical />

    <NButton :type="store.showGrid ? 'primary' : 'default'" @click="store.showGrid = !store.showGrid">
      {{ $t('page.manage.labelDesign.grid') }}
    </NButton>
    <NButton :type="store.showRuler ? 'primary' : 'default'" @click="store.showRuler = !store.showRuler">
      {{ $t('page.manage.labelDesign.ruler') }}
    </NButton>

    <NDivider vertical />

    <NButton @click="zoomOut">－</NButton>
    <span class="w-48px text-center text-13px">{{ zoomPercent }}%</span>
    <NButton @click="zoomIn">＋</NButton>
    <NButton text @click="zoomReset">{{ $t('page.manage.labelDesign.resetZoom') }}</NButton>

    <div class="flex-1" />

    <NButton type="primary" @click="emit('preview')">{{ $t('page.manage.labelDesign.preview') }}</NButton>
  </div>
</template>
