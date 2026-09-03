<script setup lang="ts">
import { $t } from '@/locales';
import NFormWrap from '@/components/Form/index.vue';
import type { FormItemConfig } from '@/components/Form/index.vue';

type Model = Record<string, unknown>;

interface Props {
  /** 搜索表单项（末项通常为 { key: 'actions', slot: 'actions' } 的按钮区） */
  items: FormItemConfig[];
  /** 搜索表单数据对象 */
  model: Model;
  /** 是否收起（由父级控制），默认 true（收起，隐藏整个表单） */
  collapsed?: boolean;
  /** 24 栅格系统的列间距（px） */
  gridXGap?: number;
  /** 栅格响应式断点模式 */
  gridResponsive?: 'self' | 'screen';
  /** 标签位置 */
  labelPlacement?: 'left' | 'top';
  /** 标签宽度 */
  labelWidth?: number | string;
}

withDefaults(defineProps<Props>(), {
  collapsed: true,
  gridXGap: 16,
  gridResponsive: 'self',
  labelPlacement: 'left',
  labelWidth: 80
});

const emit = defineEmits<{
  search: [];
  reset: [];
}>();
</script>

<template>
  <Transition name="search-fade">
    <NCard v-show="!collapsed" :bordered="false" class="card-wrapper shrink-0">
      <NFormWrap
        :model="model"
        :items="items"
        :grid-x-gap="gridXGap"
        :grid-responsive="gridResponsive"
        :label-placement="labelPlacement"
        :label-width="labelWidth"
      >
        <template #actions>
          <div class="flex items-center gap-8px">
            <NButton type="primary" ghost @click="emit('search')">
              <template #icon><icon-ic-round-search class="text-icon" /></template>
              {{ $t('common.search') }}
            </NButton>
            <NButton @click="emit('reset')">
              <template #icon><icon-ic-round-refresh class="text-icon" /></template>
              {{ $t('common.reset') }}
            </NButton>
          </div>
        </template>
      </NFormWrap>
    </NCard>
  </Transition>
</template>

<style scoped>
/* 仅动画 opacity + transform（合成器属性，走 GPU，不触发重排），
   高度变化由 v-show 切换 display 在瞬间完成一次，避免逐帧布局卡顿 */
.search-fade-enter-active,
.search-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  /* 动画期间提升为独立合成层，避免大表单（输入框/下拉）逐帧主线程重绘导致卡顿 */
  will-change: opacity, transform;
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
