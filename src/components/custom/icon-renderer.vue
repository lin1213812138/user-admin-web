<script setup lang="ts">
/**
 * 图标渲染器组件
 *
 * 作用：统一渲染 iconify 在线图标与 vicons 矢量图标，并按图标实际绘制区域做
 *       光学缩放，使不同 viewBox 留白的图标在网格中视觉对齐、大小一致。
 *       通常配合 IconPicker / 图标网格使用。
 *
 * 使用方式：
 * ```vue
 * <IconRenderer :icon="iconKey" :size="18" />
 * ```
 *
 * 说明：
 * - icon 支持 "mdi:home"（iconify）或 "vicons:ionicons5:Home"（vicons）
 * - size 为图标盒子尺寸（px），组件会在此盒子内对绘制内容进行光学缩放
 */
import { ref, computed, onMounted, watch, nextTick, type CSSProperties } from 'vue';
import { Icon } from '@iconify/vue';
import { viconsCollections, VICONS_PREFIX } from '@/constants/icons';

defineOptions({ name: 'IconRenderer' });

interface Props {
  /** 图标名称：iconify 形如 "mdi:home"，或 vicons 形如 "vicons:ionicons5:Home" */
  icon?: string;
  /** 图标盒子尺寸（px），默认 18 */
  size?: number;
}

const props = withDefaults(defineProps<Props>(), { icon: '', size: 18 });

/** 图标盒子尺寸（px）。所有 SVG 渲染进此盒子，再按光学缩放把实际绘制内容归一化到 TARGET_DRAWN，
 *  使选择器网格不受 viewBox 留白影响而保持一致。 */
const ICON_SIZE = computed(() => props.size);
/** 缩放后目标绘制尺寸（px）。取 14 是因为即便 mdi:plus 类字形（绘制约 9px）在约 1.56 倍缩放下
 *  也能达到目标（视觉 28px），远在 32px 单元格内；过小会让实心图标显得"缩水"，过大则可能把细图标推出单元格被裁切。 */
const TARGET_DRAWN = 14;
/** 最大缩放倍数。18 * 1.65 = 29.7px 视觉尺寸，可在 32px 单元格四周各留约 1px 余量；
 *  超过该值图标包围盒会超出按钮边界，被父级 `overflow-x-hidden` 在网格右侧裁掉。 */
const MAX_SCALE = 1.65;

const parsed = computed(() => {
  const icon = props.icon;
  if (!icon.startsWith(VICONS_PREFIX)) {
    return { type: 'iconify' as const, collection: '', name: icon };
  }
  const rest = icon.slice(VICONS_PREFIX.length);
  const idx = rest.indexOf(':');
  if (idx === -1) {
    return { type: 'iconify' as const, collection: '', name: icon };
  }
  return { type: 'vicons' as const, collection: rest.slice(0, idx), name: rest.slice(idx + 1) };
});

const viconsComponent = computed(() => {
  if (parsed.value.type !== 'vicons') return null;
  const col = viconsCollections.find(c => c.id === parsed.value.collection);
  if (!col) return null;
  return col.icons[parsed.value.name] ?? null;
});

const rootRef = ref<HTMLElement | null>(null);
/** 每次渲染的光学缩放倍数（1 = 不缩放），在测量 getBBox() 后赋值 */
const scale = ref(1);

const wrapperStyle = computed<CSSProperties>(() => ({
  width: `${ICON_SIZE.value}px`,
  height: `${ICON_SIZE.value}px`,
  '--icon-size': `${ICON_SIZE.value}px`,
  // 通过 CSS 变量把缩放倍数暴露给 ::deep(svg)
  '--icon-scale': String(scale.value)
}));

/** 测量已渲染 SVG 的实际绘制内容，并计算统一缩放倍数，使绘制内容在两个轴上均为 `TARGET_DRAWN` 像素 */
async function normalize(): Promise<void> {
  await nextTick();
  if (!rootRef.value) {
    scale.value = 1;
    return;
  }
  const svg = rootRef.value.querySelector('svg');
  if (!svg) {
    scale.value = 1;
    return;
  }
  const bbox = svg.getBBox();
  if (!bbox || bbox.width === 0 || bbox.height === 0) {
    scale.value = 1;
    return;
  }
  // getBBox 返回的是用户单位，需结合 viewBox 换算成实际渲染像素
  const viewBoxAttr = svg.getAttribute('viewBox');
  let viewBoxSize = ICON_SIZE.value;
  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0) {
      viewBoxSize = parts[2];
    }
  }
  const pxPerUnit = ICON_SIZE.value / viewBoxSize;
  const drawnW = bbox.width * pxPerUnit;
  const drawnH = bbox.height * pxPerUnit;
  if (drawnW <= 0 || drawnH <= 0) {
    scale.value = 1;
    return;
  }
  const s = Math.min(TARGET_DRAWN / drawnW, TARGET_DRAWN / drawnH);
  // 限制缩放范围：过细的字形不至于被放大到超出 32px 单元格（会被网格容器 `overflow-x-hidden` 裁切），
  // 已经很大的字形也不至于把视觉内容缩到消失
  scale.value = Math.max(0.5, Math.min(s, MAX_SCALE));
}

onMounted(() => {
  normalize();
});

watch(
  () => props.icon,
  () => {
    scale.value = 1;
    normalize();
  }
);
</script>

<template>
  <span ref="rootRef" class="icon-renderer" :style="wrapperStyle">
    <Icon v-if="parsed.type === 'iconify' && props.icon" :icon="props.icon" :width="ICON_SIZE" :height="ICON_SIZE" />
    <component :is="viconsComponent" v-else-if="viconsComponent" />
    <span v-else>#</span>
  </span>
</template>

<style scoped>
.icon-renderer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  /* 允许放大后的图标超出盒子，以防个别字形的 viewBox 留白异常大时被裁切 */
  overflow: visible;
}
.icon-renderer ::deep(svg) {
  display: block;
  flex-shrink: 0;
  width: var(--icon-size, 18px) !important;
  height: var(--icon-size, 18px) !important;
  transform: scale(var(--icon-scale, 1));
  transform-origin: center;
}
</style>
