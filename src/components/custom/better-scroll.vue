<script setup lang="ts">
/**
 * BetterScroll 滚动封装组件
 *
 * 作用：基于 @better-scroll/core 封装，当内容超出容器尺寸时提供平滑滚动体验，
 *       常用于需要自定义滚动（而非浏览器原生滚动条）的区域。
 *
 * 使用方式：
 * ```vue
 * <BetterScroll :options="{ scrollY: true, click: true }" class="h-400px">
 *   <div>超长内容...</div>
 * </BetterScroll>
 * ```
 *
 * 暴露实例：通过 ref 获取原生 BScroll 实例，用于手动 refresh / scrollTo 等。
 * ```vue
 * <BetterScroll ref="bsRef" :options="{ scrollY: true }" />
 * ```
 * ```ts
 * const bsRef = ref();
 * bsRef.value?.instance; // 原生 BScroll 实例
 * ```
 *
 * @link BetterScroll 配置项文档 https://better-scroll.github.io/docs/zh-CN/guide/base-scroll-options.html
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useElementSize } from '@vueuse/core';
import BScroll from '@better-scroll/core';
import type { Options } from '@better-scroll/core';

defineOptions({ name: 'BetterScroll' });

interface Props {
  /** BetterScroll 配置项，详见上方官方文档链接 */
  options: Options;
}

const props = defineProps<Props>();

const bsWrapper = ref<HTMLElement>();
const bsContent = ref<HTMLElement>();
const { width: wrapWidth } = useElementSize(bsWrapper);
const { width, height } = useElementSize(bsContent);

const instance = ref<BScroll>();
const isScrollY = computed(() => Boolean(props.options.scrollY));

function initBetterScroll() {
  if (!bsWrapper.value) return;
  instance.value = new BScroll(bsWrapper.value, props.options);
}

// 当滚动内容尺寸变化时自动 refresh，避免内容变化导致滚动失效
watch([() => wrapWidth.value, () => width.value, () => height.value], () => {
  instance.value?.refresh();
});

onMounted(() => {
  initBetterScroll();
});

defineExpose({ instance });
</script>

<template>
  <div ref="bsWrapper" class="h-full text-left">
    <div ref="bsContent" class="inline-block" :class="{ 'h-full': !isScrollY }">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped></style>
