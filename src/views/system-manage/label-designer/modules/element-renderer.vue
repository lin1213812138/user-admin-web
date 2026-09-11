<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import type { LabelElement } from './types';
import { renderBarcode, renderQrcode } from './barcode';
import { resolveDisplayText } from './render-utils';

const props = defineProps<{ element: LabelElement }>();

const isText = computed(() => props.element.type === 'text' || props.element.type === 'longText');
const text = computed(() => resolveDisplayText(props.element.options));

const imgSrc = computed(() => {
  const o = props.element.options;
  if (props.element.type === 'image' && 'src' in o) return o.src;
  if (props.element.type === 'barcode' && 'symbology' in o) {
    return renderBarcode({
      symbology: o.symbology,
      text: text.value,
      displayValue: o.displayValue,
      fontSize: o.fontSize
    });
  }
  if (props.element.type === 'qrcode' && 'ecc' in o) {
    return renderQrcode({ text: text.value, ecc: o.ecc });
  }
  return '';
});

const textStyle = computed<CSSProperties>(() => {
  const o = props.element.options;
  if (isText.value && 'text' in o) {
    return {
      fontSize: `${o.fontSize}pt`,
      color: o.color,
      fontWeight: o.fontWeight,
      textAlign: o.align,
      lineHeight: o.lineHeight
    };
  }
  return {};
});

const rectStyle = computed<CSSProperties>(() => {
  const o = props.element.options;
  if (props.element.type === 'rect' && 'bgColor' in o) {
    return {
      border: `${o.borderWidth}px solid ${o.borderColor}`,
      background: o.bgColor,
      borderRadius: `${o.radius}px`
    };
  }
  return {};
});

const lineStyle = computed<CSSProperties>(() => {
  const o = props.element.options;
  if (props.element.type === 'hline' && 'borderWidth' in o) {
    return { borderTop: `${o.borderWidth}px solid ${o.borderColor}` };
  }
  if (props.element.type === 'vline' && 'borderWidth' in o) {
    return { borderLeft: `${o.borderWidth}px solid ${o.borderColor}` };
  }
  return {};
});
</script>

<template>
  <div class="h-full w-full overflow-hidden">
    <div v-if="isText" class="h-full w-full break-all" :style="textStyle">{{ text }}</div>
    <img v-else-if="imgSrc" :src="imgSrc" class="h-full w-full object-contain" alt="" draggable="false" />
    <div v-else-if="element.type === 'rect'" class="h-full w-full" :style="rectStyle" />
    <div v-else-if="element.type === 'hline'" class="w-full" :style="lineStyle" />
    <div v-else-if="element.type === 'vline'" class="h-full" :style="lineStyle" />
  </div>
</template>
