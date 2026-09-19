<script setup lang="ts">
/**
 * LButton — 统一按钮组件（基于 naive-ui NButton 封装）
 *
 * 作用：保留 NButton 全部样式能力（type / text / ghost / round / circle / secondary / tertiary /
 * quaternary / strong / dashed / loading / disabled / block ...），并把默认档按钮高度统一为 32px，
 * 同时内置悬浮提示（disabled 按钮也能正常出提示）与二次确认弹窗。
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
 *
 * <!-- 内置二次确认：点击按钮弹 NPopconfirm，trigger 为按钮本身（避免定位飞到左上角） -->
 * <LButton
 *   type="error"
 *   text
 *   popconfirm
 *   @positive-click="handleDelete(row)"
 * >{{ $t('common.delete') }}</LButton>
 *
 * <!-- 自定义确认文案 / 位置 / 按钮文案 -->
 * <LButton
 *   type="error"
 *   text
 *   :popconfirm="$t('common.confirmDelete')"
 *   popconfirm-placement="left"
 *   popconfirm-positive-text="删除"
 *   @positive-click="handleDelete(row)"
 * >{{ $t('common.delete') }}</LButton>
 * ```
 *
 * 说明：
 * - 未显式传 `size`（默认档）且非 `text` 按钮时高度固定 32px；显式传 tiny/small/medium/large 沿用组件库高度
 * - 传 `tooltip` 自动包 NTooltip；`disabled` 时自动垫一层 span，保证 hover 提示生效
 * - 传 `popconfirm` 自动包 NPopconfirm，弹窗的 trigger 直接用内部 NButton，定位稳定不漂移
 * - `popconfirm` 与 `tooltip` 同时传入时，优先启用 `popconfirm`
 * - 其余属性、插槽（#default / #icon）、事件全部透传给 NButton
 */
import { computed, useAttrs } from 'vue';
import { useAuth } from '@/hooks/business/auth';
import { $t } from '@/locales';
import type { CSSProperties } from 'vue';
import type { ButtonProps, PopoverPlacement } from 'naive-ui';

defineOptions({
  name: 'LButton',
  inheritAttrs: false
});

interface Props extends /* @vue-ignore */ ButtonProps {
  /** 权限码（单码或数组）；传入后当前用户无该权限时按钮整体不渲染 */
  auth?: string | string[];
  /** 按钮尺寸：不传时为默认档（高度固定 32px），传值时沿用组件库高度 */
  size?: 'tiny' | 'small' | 'medium' | 'large';
  /** 文字按钮 */
  text?: boolean;
  /** 圆形按钮 */
  circle?: boolean;
  /** 禁用态 */
  disabled?: boolean;
  /** 悬浮提示文案 */
  tooltip?: string;
  /** 悬浮提示方向 */
  tooltipPlacement?: PopoverPlacement;
  /** 悬浮提示层级 */
  tooltipZIndex?: number;
  /**
   * 内置二次确认：
   * - 传 `true` 用默认文案（common.confirmDelete）
   * - 传字符串用该文案
   * 启用后点击按钮弹 NPopconfirm，trigger 为按钮本身（避免定位飞到左上角）
   * @default false
   */
  popconfirm?: string | boolean;
  /** 二次确认弹窗位置 */
  popconfirmPlacement?: PopoverPlacement;
  /** 二次确认-确认按钮文案（不传用 naive 默认「确认」） */
  popconfirmPositiveText?: string;
  /** 二次确认-取消按钮文案（不传用 naive 默认「取消」） */
  popconfirmNegativeText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  auth: undefined,
  size: undefined,
  tooltip: '',
  tooltipPlacement: 'bottom',
  tooltipZIndex: 98,
  popconfirm: false,
  popconfirmPlacement: 'top',
  popconfirmPositiveText: undefined,
  popconfirmNegativeText: undefined
});

const { hasAuth } = useAuth();

const visible = computed(() => (props.auth ? hasAuth(props.auth) : true));

const attrs = useAttrs();

const DEFAULT_HEIGHT = 32;

const fixedHeightStyle = computed<CSSProperties | undefined>(() => {
  const { size, text, circle } = props;
  if (size || text) return undefined;
  const style: CSSProperties = { '--n-height': `${DEFAULT_HEIGHT}px` };
  if (circle) style['--n-width'] = `${DEFAULT_HEIGHT}px`;
  return style;
});

const buttonProps = computed(() => {
  const {
    auth: _auth,
    tooltip: _tooltip,
    tooltipPlacement: _tooltipPlacement,
    tooltipZIndex: _tooltipZIndex,
    popconfirm: _popconfirm,
    popconfirmPlacement: _popconfirmPlacement,
    popconfirmPositiveText: _popconfirmPositiveText,
    popconfirmNegativeText: _popconfirmNegativeText,
    ...rest
  } = props;
  return rest;
});

/** 透传给内部 NButton 的绑定（剔除会落到 NPopconfirm 上的确认事件，避免误传到按钮根） */
const buttonBind = computed(() => {
  const { onPositiveClick: _p, onNegativeClick: _n, ...restAttrs } = attrs as Record<string, unknown>;
  void _p;
  void _n;
  return { ...restAttrs, ...buttonProps.value };
});

const isPopconfirmEnabled = computed(
  () => props.popconfirm !== false && props.popconfirm !== undefined && props.popconfirm !== null
);

const popconfirmText = computed(() => {
  if (props.popconfirm === true || props.popconfirm === '') return $t('common.confirmDelete');
  if (typeof props.popconfirm === 'string') return props.popconfirm;
  return '';
});

function handlePositiveClick(e: MouseEvent): unknown {
  const fn = (attrs as Record<string, unknown>).onPositiveClick as ((e: MouseEvent) => unknown) | undefined;
  return fn?.(e);
}

function handleNegativeClick(e: MouseEvent): unknown {
  const fn = (attrs as Record<string, unknown>).onNegativeClick as ((e: MouseEvent) => unknown) | undefined;
  return fn?.(e);
}
</script>

<template>
  <template v-if="visible">
    <!-- 二次确认模式：trigger 直接用内部 NButton，定位稳定 -->
    <NPopconfirm
      v-if="isPopconfirmEnabled"
      :placement="props.popconfirmPlacement"
      :positive-text="props.popconfirmPositiveText"
      :negative-text="props.popconfirmNegativeText"
      @positive-click="handlePositiveClick"
      @negative-click="handleNegativeClick"
    >
      <template #trigger>
        <NButton v-bind="buttonBind" :style="fixedHeightStyle">
          <template v-for="name in Object.keys($slots)" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps || {}" />
          </template>
        </NButton>
      </template>
      {{ popconfirmText }}
    </NPopconfirm>

    <!-- tooltip 模式 -->
    <NTooltip v-else-if="props.tooltip" :placement="props.tooltipPlacement" :z-index="props.tooltipZIndex">
      <template #trigger>
        <span v-if="props.disabled" class="inline-flex">
          <NButton v-bind="buttonBind" :style="fixedHeightStyle">
            <template v-for="name in Object.keys($slots)" #[name]="slotProps">
              <slot :name="name" v-bind="slotProps || {}" />
            </template>
          </NButton>
        </span>
        <NButton v-else v-bind="buttonBind" :style="fixedHeightStyle">
          <template v-for="name in Object.keys($slots)" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps || {}" />
          </template>
        </NButton>
      </template>
      {{ props.tooltip }}
    </NTooltip>

    <!-- 普通模式 -->
    <NButton v-else v-bind="buttonBind" :style="fixedHeightStyle">
      <template v-for="name in Object.keys($slots)" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps || {}" />
      </template>
    </NButton>
  </template>
</template>

<style scoped></style>
