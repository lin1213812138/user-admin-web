<script setup lang="ts">
import { $t } from '@/locales';
import { paperOptions } from './paper-sizes';

defineProps<{ title: string; paperSize: string; scale: number; showGrid: boolean; showRuler: boolean }>();

const emit = defineEmits<{
  back: [];
  'update:paperSize': [value: string];
  /** 缩小（svg 图标按钮，事件名用 camelCase 以符合 lint 约定） */
  zoomOut: [];
  zoomIn: [];
  toggleGrid: [];
  toggleRuler: [];
  clear: [];
  save: [];
  preview: [];
}>();

const options = paperOptions.map(item => ({ label: item.label, value: item.label }));
</script>

<template>
  <div class="h-48px w-full flex shrink-0 items-center gap-8px border-b border-#eee px-16px dark:border-#333">
    <LButton @click="emit('back')">
      <template #icon><icon-ic-round-arrow-back class="text-icon" /></template>
      {{ $t('page.manage.printDesign.back') }}
    </LButton>

    <span class="max-w-240px truncate text-14px font-500">{{ title }}</span>

    <NSelect
      class="w-140px"
      size="small"
      :value="paperSize"
      :options="options"
      @update:value="value => emit('update:paperSize', value)"
    />

    <div class="ml-8px flex items-center gap-4px">
      <LButton quaternary :title="$t('page.manage.printDesign.zoomOut')" @click="emit('zoomOut')">
        <template #icon><icon-ic-round-remove class="text-icon" /></template>
      </LButton>
      <span class="w-48px text-center text-12px">{{ Math.round(scale * 100) }}%</span>
      <LButton quaternary :title="$t('page.manage.printDesign.zoomIn')" @click="emit('zoomIn')">
        <template #icon><icon-ic-round-add class="text-icon" /></template>
      </LButton>
    </div>

    <LButton
      quaternary
      :title="showGrid ? $t('page.manage.printDesign.hideGrid') : $t('page.manage.printDesign.showGrid')"
      @click="emit('toggleGrid')"
    >
      {{ showGrid ? $t('page.manage.printDesign.hideGrid') : $t('page.manage.printDesign.showGrid') }}
    </LButton>

    <LButton
      quaternary
      :title="showRuler ? $t('page.manage.printDesign.hideRuler') : $t('page.manage.printDesign.showRuler')"
      @click="emit('toggleRuler')"
    >
      {{ showRuler ? $t('page.manage.printDesign.hideRuler') : $t('page.manage.printDesign.showRuler') }}
    </LButton>

    <div class="flex-1"></div>

    <LButton @click="emit('clear')">{{ $t('page.manage.printDesign.clear') }}</LButton>
    <LButton @click="emit('preview')">{{ $t('page.manage.printDesign.preview') }}</LButton>
    <LButton type="primary" @click="emit('save')">{{ $t('page.manage.printDesign.save') }}</LButton>
  </div>
</template>
