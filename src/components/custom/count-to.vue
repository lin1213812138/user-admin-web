<script setup lang="ts">
/**
 * 数字滚动动画组件
 *
 * 作用：将数字从 startValue 平滑递增/递减到 endValue，常用于大屏数字、统计面板。
 *
 * 使用方式：
 * ```vue
 * <CountTo :end-value="100" :duration="2000" prefix="$" />
 * ```
 *
 * Props 说明：
 * - startValue / endValue：起始与结束数值
 * - duration：动画时长（毫秒）
 * - autoplay：start 或 end 变化时是否自动播放
 * - decimals：小数位数；prefix / suffix：前后缀
 * - separator：千分位分隔符；decimal：小数点符号
 * - useEasing / transition：是否启用缓动及缓动曲线（TransitionPresets 的键名）
 */
import { computed, nextTick, ref, watch } from 'vue';
import { TransitionPresets, useTransition } from '@vueuse/core';

defineOptions({
  name: 'CountTo'
});

interface Props {
  /** 起始值 */
  startValue?: number;
  /** 结束值 */
  endValue?: number;
  /** 动画时长（毫秒） */
  duration?: number;
  /** 是否自动播放 */
  autoplay?: boolean;
  /** 小数位数 */
  decimals?: number;
  /** 前缀 */
  prefix?: string;
  /** 后缀 */
  suffix?: string;
  /** 千分位分隔符 */
  separator?: string;
  /** 小数点符号 */
  decimal?: string;
  /** 是否启用缓动 */
  useEasing?: boolean;
  /** 缓动曲线（TransitionPresets 的键名） */
  transition?: keyof typeof TransitionPresets;
}

const props = withDefaults(defineProps<Props>(), {
  startValue: 0,
  endValue: 2021,
  duration: 1500,
  autoplay: true,
  decimals: 0,
  prefix: '',
  suffix: '',
  separator: ',',
  decimal: '.',
  useEasing: true,
  transition: 'linear'
});

const source = ref(props.startValue);

const transition = computed(() => (props.useEasing ? TransitionPresets[props.transition] : undefined));

const outputValue = useTransition(source, {
  disabled: false,
  duration: props.duration,
  transition: transition.value
});

const value = computed(() => formatValue(outputValue.value));

function formatValue(num: number) {
  const { decimals, decimal, separator, suffix, prefix } = props;

  let number = num.toFixed(decimals);
  number = String(number);

  const x = number.split('.');
  let x1 = x[0];
  const x2 = x.length > 1 ? decimal + x[1] : '';
  const rgx = /(\d+)(\d{3})/;
  if (separator) {
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, `$1${separator}$2`);
    }
  }

  return prefix + x1 + x2 + suffix;
}

async function start() {
  await nextTick();
  source.value = props.endValue;
}

watch(
  [() => props.startValue, () => props.endValue],
  () => {
    if (props.autoplay) {
      start();
    }
  },
  { immediate: true }
);
</script>

<template>
  <span>{{ value }}</span>
</template>

<style scoped></style>
