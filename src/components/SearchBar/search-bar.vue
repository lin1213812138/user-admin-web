<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import CommonDrawer from '@/components/common/drawer.vue';
import NFormWrap from '@/components/Form/index.vue';
import type { FormItemConfig } from '@/components/Form/index.vue';

type Model = Record<string, unknown>;

interface Props {
  /** 抽屉可见性（由父级用 v-model:show 控制） */
  show?: boolean;
  /** 搜索表单项（沿用 Table 的 searchItems 结构） */
  items: FormItemConfig[];
  /** 搜索表单数据对象（按引用传入，父级持有并在取数时读取） */
  model: Model;
  /** 抽屉宽度（px），默认 420 */
  width?: number | string;
  /** 标签位置：抽屉较窄，默认 top 纵向堆叠可读性更好 */
  labelPlacement?: 'left' | 'top';
  /** 标签宽度 */
  labelWidth?: number | string;
  /** 24 栅格系统的列间距（px） */
  gridXGap?: number;
  /** 栅格响应式断点模式 */
  gridResponsive?: 'self' | 'screen';
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  width: 420,
  labelPlacement: 'top',
  labelWidth: 80,
  gridXGap: 16,
  gridResponsive: 'self'
});

const emit = defineEmits<{
  search: [];
  reset: [];
  'update:show': [value: boolean];
}>();

/**
 * 抽屉内表单强制单列：派生一份把每个 item 的 span 收敛为 24 的配置，
 * 不修改调用方原始 searchItems；窄抽屉下多列会挤压，单列可读性最佳。
 */
const drawerItems = computed<FormItemConfig[]>(() => props.items.map(item => ({ ...item, span: 24 })));
</script>

<template>
  <CommonDrawer :show="show" :title="$t('common.search')" :width="width" @update:show="emit('update:show', $event)">
    <NFormWrap
      :model="model"
      :items="drawerItems"
      :grid-x-gap="gridXGap"
      :grid-responsive="gridResponsive"
      :label-placement="labelPlacement"
      :label-width="labelWidth"
    />

    <template #footer>
      <div class="flex items-center justify-end gap-8px">
        <NButton @click="emit('reset')">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
          {{ $t('common.reset') }}
        </NButton>
        <NButton type="primary" @click="emit('search')">
          <template #icon><icon-ic-round-search class="text-icon" /></template>
          {{ $t('common.search') }}
        </NButton>
      </div>
    </template>
  </CommonDrawer>
</template>
