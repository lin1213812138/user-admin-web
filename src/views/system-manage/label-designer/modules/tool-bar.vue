<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { PAPER_SIZES } from './constant';
import ShortcutHelp from './shortcut-help.vue';

defineProps<{
  /** 当前模板名称（纯文本展示，不提供下拉切换） */
  templateName: string;
  /** 保存/加载中 */
  loading: boolean;
}>();

const emit = defineEmits<{
  save: [];
  preview: [];
}>();

const router = useRouter();
const store = useLabelDesignStore();

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
function handleClear() {
  window.$dialog?.warning({
    title: $t('page.manage.labelDesign.clear'),
    content: $t('page.manage.labelDesign.clearConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => store.clearAll()
  });
}
</script>

<template>
  <!-- 单行工具栏：返回 | 模板名称 | 纸张 | 撤销/重做 | 缩放 | 显示网格 …… 清空 预览 保存 -->
  <div class="flex items-center gap-8px border-b border-#e5e7eb px-12px py-8px dark:border-#2a2a2a">
    <NButton quaternary @click="router.back()">
      <template #icon><icon-ic-round-arrow-back class="text-icon" /></template>
      {{ $t('page.manage.labelDesign.back') }}
    </NButton>

    <NDivider vertical />

    <span class="text-15px">{{ templateName }}</span>

    <NDivider vertical />

    <NSelect :value="store.template.paperSize" :options="paperOptions" style="width: 160px" @update:value="setPaper" />

    <NDivider vertical />

    <NButtonGroup>
      <NButton :disabled="!store.canUndo" @click="store.undo()">{{ $t('page.manage.labelDesign.undo') }}</NButton>
      <NButton :disabled="!store.canRedo" @click="store.redo()">{{ $t('page.manage.labelDesign.redo') }}</NButton>
    </NButtonGroup>

    <NDivider vertical />

    <!-- 缩放：连体按钮组（default 带边框共享边线成一体，同撤销/重做组），点击中间百分比重置为 100% -->
    <NButtonGroup>
      <NButton @click="zoomOut">
        <template #icon><icon-ic-round-remove class="text-icon" /></template>
      </NButton>
      <NTooltip>
        <template #trigger>
          <NButton class="w-56px" @click="zoomReset">{{ zoomPercent }}%</NButton>
        </template>
        {{ $t('page.manage.labelDesign.resetZoom') }}
      </NTooltip>
      <NButton @click="zoomIn">
        <template #icon><icon-ic-round-add class="text-icon" /></template>
      </NButton>
    </NButtonGroup>

    <ShortcutHelp />

    <NDivider vertical />

    <NButton :type="store.showGrid ? 'primary' : 'default'" @click="store.showGrid = !store.showGrid">
      {{ $t('page.manage.labelDesign.grid') }}
    </NButton>

    <div class="flex-1" />

    <NButton quaternary :disabled="!store.elements.length" @click="handleClear">
      {{ $t('page.manage.labelDesign.clear') }}
    </NButton>
    <NButton @click="emit('preview')">{{ $t('page.manage.labelDesign.preview') }}</NButton>
    <NButton type="primary" :loading="loading" @click="emit('save')">{{ $t('page.manage.labelDesign.save') }}</NButton>
  </div>
</template>
