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
  <div class="search-collapse" :class="{ 'is-collapsed': collapsed }">
    <div class="search-collapse-inner">
      <NCard :bordered="false" class="card-wrapper shrink-0 mb-12px">
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
    </div>
  </div>
</template>

<style scoped>
/* 收展用 grid 行高（1fr ↔ 0fr）做过场：纯 CSS，无 JS 测量、无合成层，
   高度本身被平滑动画，表格随之被推开 / 收回而不是瞬间跳变；
   收起后行高为 0，卡片连同它的下间距一起被裁掉，不留空隙。 */
.search-collapse {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.2s ease;
}

.search-collapse.is-collapsed {
  grid-template-rows: 0fr;
}

.search-collapse-inner {
  min-height: 0;
  overflow: hidden;
}
</style>
