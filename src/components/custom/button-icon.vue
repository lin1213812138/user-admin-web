<script setup lang="ts">
/**
 * 图标按钮组件（带悬浮提示）
 *
 * 作用：将图标按钮与 Tooltip 悬浮提示组合，常用于表格操作列、工具栏的图标按钮。
 *
 * 使用方式：
 * ```vue
 * <ButtonIcon icon="mdi:home" tooltip-content="首页" @click="handleClick" />
 * ```
 *
 * 说明：
 * - 通过 `icon` 指定图标（iconify 名称）
 * - 通过 `tooltip-content` 设置悬浮提示文案，`tooltip-placement` 设置提示方向
 * - 使用默认插槽可自定义按钮内容（替换默认图标）
 * - 其余属性会透传给 NButton（如 type、size、loading 等）
 */
import type { PopoverPlacement } from 'naive-ui';
import { twMerge } from 'tailwind-merge';

defineOptions({
  name: 'ButtonIcon',
  inheritAttrs: false
});

interface Props {
  /** Button class */
  class?: string;
  /** Iconify icon name */
  icon?: string;
  /** Tooltip content */
  tooltipContent?: string;
  /** Tooltip placement */
  tooltipPlacement?: PopoverPlacement;
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  icon: '',
  tooltipContent: '',
  tooltipPlacement: 'bottom',
  zIndex: 98
});

const DEFAULT_CLASS = 'h-[36px] text-icon';
</script>

<template>
  <NTooltip :placement="tooltipPlacement" :z-index="zIndex" :disabled="!tooltipContent">
    <template #trigger>
      <NButton quaternary :class="twMerge(DEFAULT_CLASS, props.class)" v-bind="$attrs">
        <div class="flex-center gap-8px">
          <slot>
            <SvgIcon :icon="icon" />
          </slot>
        </div>
      </NButton>
    </template>
    {{ tooltipContent }}
  </NTooltip>
</template>

<style scoped></style>
