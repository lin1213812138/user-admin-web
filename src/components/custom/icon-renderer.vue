<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, type CSSProperties } from 'vue';
import { Icon } from '@iconify/vue';
import { viconsCollections, VICONS_PREFIX } from '@/constants/icons';

defineOptions({ name: 'IconRenderer' });

interface Props {
  /** iconify name (e.g. "mdi:home") or vicons key (e.g. "vicons:ionicons5:Home") */
  icon?: string;
  /** box size in px, default 18 */
  size?: number;
}

const props = withDefaults(defineProps<Props>(), { icon: '', size: 18 });

/** Box size (px). All SVGs render into this box, then per-icon optical
 *  scaling normalizes the *drawn* content to `TARGET_DRAWN` so the picker
 *  grid looks uniform regardless of viewBox padding. */
const ICON_SIZE = computed(() => props.size);
/** Target drawn-content size (px) after scaling. Picked 14 so that even
 *  mdi:plus-style glyphs (drawn ≈ 9px) reach the target at scale ≈ 1.56
 *  (visual 28px) — well inside the 32px cell. Smaller than 14 would make
 *  filled icons look "shrunken"; larger risks pushing thin icons past the
 *  cell and getting clipped by `overflow-x-hidden` on the grid container. */
const TARGET_DRAWN = 14;
/** Largest scale we'll apply. 18 * 1.65 = 29.7px visual, which fits a 32px
 *  cell with ~1px margin on every side. Above this, the icon's bbox would
 *  extend past the button boundary and be cut off on the grid's right
 *  edge by the parent `overflow-x-hidden`. */
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
/** Per-render optical scale (1 = no change). Set after measuring getBBox(). */
const scale = ref(1);

const wrapperStyle = computed<CSSProperties>(() => ({
  width: `${ICON_SIZE.value}px`,
  height: `${ICON_SIZE.value}px`,
  '--icon-size': `${ICON_SIZE.value}px`,
  // expose scale to ::deep(svg) via CSS variable
  '--icon-scale': String(scale.value)
}));

/** Measure the actually-drawn content of the rendered SVG and compute a
 *  uniform scale so the drawn content is `TARGET_DRAWN` px in both axes. */
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
  // getBBox returns user units. Convert to rendered px using the viewBox.
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
  // clamp so a very-thin glyph can't blow up past the 32px cell (which gets
  // clipped by the grid container's `overflow-x-hidden`), and so an
  // already-large glyph can't shrink the visual content to nothing.
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
  /* allow scaled-up icons to render beyond the box if a glyph's viewBox
     padding is unusually large */
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
