<script setup lang="ts">
import { computed, type ComponentPublicInstance } from 'vue';
import ElementRenderer from './element-renderer.vue';
import { PX_PER_PT } from '../core/constant';
import { previewElement, registerPreviewEl } from './drag-ghost';

/**
 * 预览尺寸：宽度按元素真实尺寸（pt → px，与画布 zoom=100% 时观感一致）；
 * 文本类型高度不设死、交给内容撑开 —— 既是「高度按内容自适应」的所见即所得，
 * 也让 drag-ghost 能实测内容自然高度用于落纸。
 */
const previewStyle = computed(() => {
  const el = previewElement.value;
  if (!el) return {};
  const width = `${el.width * PX_PER_PT}px`;
  if (el.type !== 'text') return { width, height: `${el.height * PX_PER_PT}px` };
  // 文本下限取「单行高度」而不是类型默认高度：用默认高度（8mm）做下限会把单行文本撑大、
  // 掩盖高度自适应（单行自然高度只有 fontSize × lineHeight ≈ 3.4mm）；
  // 下限只需保证空内容时不塌成 0 —— 实测 offsetHeight 也因此天然带底线，落纸高度不会为 0
  const o = el.options;
  const fontSize = 'fontSize' in o ? (o.fontSize ?? 8) : 8;
  const lineHeight = 'lineHeight' in o ? (o.lineHeight ?? 1.2) : 1.2;
  return { width, height: 'auto', minHeight: `${fontSize * lineHeight * PX_PER_PT}px` };
});

/** 容器模板 ref 回调：在 script 里收窄类型，避免模板内 `as` 断言触发 vue/no-undef-properties 误报 */
function setPreviewEl(el: Element | ComponentPublicInstance | null) {
  registerPreviewEl(el instanceof HTMLElement ? el : null);
}
</script>

<template>
  <Teleport to="body">
    <!--
      按住字段条目即显示的「真实渲染预览」：内容复用画布渲染器（与落纸后的元素完全同源）。
      位置（left/top）由 drag-ghost 模块直写 DOM，不走响应式，避免跟手时的重渲染开销。
    -->
    <div
      v-if="previewElement"
      :ref="setPreviewEl"
      class="pointer-events-none fixed left-0 top-0 z-3000"
      :style="previewStyle"
    >
      <ElementRenderer :element="previewElement" class="h-full w-full" />
    </div>
  </Teleport>
</template>
