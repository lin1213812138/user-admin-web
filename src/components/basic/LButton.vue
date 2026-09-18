<script setup lang="ts">
/**
 * LButton — 统一按钮组件（基于 naive-ui NButton 封装）
 *
 * 作用：保留 NButton 全部样式能力（type / text / ghost / round / circle / secondary / tertiary /
 * quaternary / strong / dashed / loading / disabled / block ...），并把默认档按钮高度统一为 32px，
 * 同时内置悬浮提示（disabled 按钮也能正常出提示）。
 *
 * 使用方式：
 * ```vue
 * <LButton type="primary" @click="openDrawer('create')">
 *   <template #icon><icon-ic-round-plus class="text-icon" /></template>
 *   {{ $t('common.add') }}
 * </LButton>
 *
 * <!-- disabled 按钮也能出悬浮提示 -->
 * <LButton type="error" disabled :tooltip="$t('page.manage.customer.deleteDisabledTip')">
 *   {{ $t('common.batchDelete') }}
 * </LButton>
 * ```
 *
 * 说明：
 * - 未显式传 `size`（默认档）且非 `text` 按钮时高度固定 32px；显式传 tiny/small/medium/large 沿用组件库高度
 * - 传 `tooltip` 自动包 NTooltip；`disabled` 时自动垫一层 span，保证 hover 提示生效
 * - 其余属性、插槽（#default / #icon）、事件全部透传给 NButton
 */
import { computed, useAttrs } from 'vue';
import { useAuth } from '@/hooks/business/auth';
import type { CSSProperties } from 'vue';
import { createReusableTemplate } from '@vueuse/core';
import type { ButtonProps, PopoverPlacement } from 'naive-ui';

defineOptions({
  name: 'LButton',
  inheritAttrs: false
});

// ButtonProps 是派生类型，SFC 编译器无法解析其成员，只能在 extends 处加行内忽略标记跳过（见下一行）。
// 注意：该忽略标记的关键字不要出现在注释里——编译器会把"声明上方注释含该关键字"识别为"整块忽略"，
// 从而丢弃本 interface 声明的全部 props（曾导致 auth/size/circle/tooltip 全部失效）。
// 未显式声明的 NButton 属性运行期走 $attrs 透传，编译期仍由 ButtonProps 提供类型提示
interface Props extends /* @vue-ignore */ ButtonProps {
  /** 权限码（单码或数组）；传入后当前用户无该权限时按钮整体不渲染。等价于 v-auth，但适用于 LButton 这种多根组件 */
  auth?: string | string[];
  /** 按钮尺寸：不传时为默认档（高度固定 32px），传值时沿用组件库高度 */
  size?: 'tiny' | 'small' | 'medium' | 'large';
  /** 文字按钮：naive 对 text 按钮刻意不设高度，不做干预 */
  text?: boolean;
  /** 圆形按钮：宽度同为该档高度 */
  circle?: boolean;
  /** 禁用态：禁用时自动垫一层 span，保证 tooltip 仍能触发 */
  disabled?: boolean;
  /** 悬浮提示文案，为空则不渲染 NTooltip */
  tooltip?: string;
  /** 悬浮提示方向 */
  tooltipPlacement?: PopoverPlacement;
  /** 悬浮提示层级 */
  tooltipZIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  // 不设默认尺寸：不传时由 NButton 走默认档，再由 fixedHeightStyle 固定为 32px
  auth: undefined,
  size: undefined,
  tooltip: '',
  tooltipPlacement: 'bottom',
  tooltipZIndex: 98
});

const [DefineButton, ReuseButton] = createReusableTemplate();

const { hasAuth } = useAuth();

/** 权限控制：传入 auth 且无权限时整段不渲染（多根组件无法用 v-auth 指令） */
const visible = computed(() => (props.auth ? hasAuth(props.auth) : true));

/** 未声明为 props 的属性（class / style / onClick 等） */
const attrs = useAttrs();

/** 默认档固定高度（px） */
const DEFAULT_HEIGHT = 32;

/**
 * 默认档高度样式
 *
 * naive 按钮高度为 `height: var(--n-height)`，且 `--n-height` 由 NButton 内联注入，
 * 这里通过同键覆盖该变量来固定高度（内联样式优先级高于组件内的 cssVars，且不依赖样式加载顺序）。
 */
const fixedHeightStyle = computed<CSSProperties | undefined>(() => {
  const { size, text, circle } = props;

  // 显式指定 size 时沿用组件库高度；text 按钮 naive 刻意设为 initial，不干预
  if (size || text) return undefined;

  const style: CSSProperties = { '--n-height': `${DEFAULT_HEIGHT}px` };

  // circle 按钮宽高一致
  if (circle) style['--n-width'] = `${DEFAULT_HEIGHT}px`;

  return style;
});

/** 透传给 NButton 的属性（剔除 LButton 自有属性） */
const buttonProps = computed(() => {
  const {
    auth: _auth,
    tooltip: _tooltip,
    tooltipPlacement: _tooltipPlacement,
    tooltipZIndex: _tooltipZIndex,
    ...rest
  } = props;

  return rest;
});
</script>

<template>
  <template v-if="visible">
    <DefineButton>
      <NButton v-bind="{ ...attrs, ...buttonProps }" :style="fixedHeightStyle">
        <template v-for="name in Object.keys($slots)" #[name]="slotProps">
          <slot :name="name" v-bind="slotProps || {}" />
        </template>
      </NButton>
    </DefineButton>

    <NTooltip v-if="props.tooltip" :placement="props.tooltipPlacement" :z-index="props.tooltipZIndex">
      <template #trigger>
        <!-- disabled 按钮不响应鼠标事件，垫一层 span 让 tooltip 仍能触发 -->
        <span v-if="props.disabled" class="inline-flex"><ReuseButton /></span>
        <ReuseButton v-else />
      </template>
      {{ props.tooltip }}
    </NTooltip>
    <ReuseButton v-else />
  </template>
</template>

<style scoped></style>
