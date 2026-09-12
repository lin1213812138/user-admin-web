<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import type { LabelElement } from './types';
import { renderBarcode, renderQrcode } from './barcode';
import { resolveDisplayText } from './render-utils';

const props = defineProps<{ element: LabelElement }>();

const isText = computed(() => props.element.type === 'text' || props.element.type === 'longText');
const isBarcode = computed(() => props.element.type === 'barcode');
const text = computed(() => resolveDisplayText(props.element.options));

// 「关联标题」开启且标题非空时显示标题（与打印 HTML 渲染保持一致）
const titleText = computed(() => {
  const o = props.element.options;
  const title = 'title' in o ? (o.title ?? '') : '';
  const enabled = 'showTitle' in o ? Boolean(o.showTitle) : false;
  return enabled ? title.trim() : '';
});

// 标题样式：未配置时回退默认（8pt / 黑色 / normal）；行内前缀与内容间隔 8px，行高继承内容行高
const titleStyle = computed<CSSProperties>(() => {
  const o = props.element.options;
  return {
    fontSize: `${('titleFontSize' in o ? o.titleFontSize : undefined) ?? 8}pt`,
    color: ('titleColor' in o ? o.titleColor : undefined) ?? '#000000',
    fontWeight: ('titleFontWeight' in o ? o.titleFontWeight : undefined) ?? 'normal',
    marginRight: '8px'
  };
});

const imgSrc = computed(() => {
  const o = props.element.options;
  if (props.element.type === 'image' && 'src' in o) return o.src;
  if (props.element.type === 'barcode' && 'symbology' in o) {
    // PNG 只画条形；编码值/标题由 DOM 文本行渲染（bwip-js 内置字体不支持中文，无法拼进图内）
    return renderBarcode({ symbology: o.symbology, text: text.value });
  }
  if (props.element.type === 'qrcode' && 'ecc' in o) {
    return renderQrcode({ text: text.value, ecc: o.ecc });
  }
  return '';
});

// 条码编码值行：显示文本开启（缺省开启，旧数据缺字段视为显示）或标题开启时渲染；两者都关时整行不画
const barcodeLineVisible = computed(() => {
  if (!isBarcode.value) return false;
  const o = props.element.options;
  const showValue = 'displayValue' in o ? o.displayValue !== false : true;
  return showValue || Boolean(titleText.value);
});

// 条码文本行样式：标题与编码值同字号（统一用「字号」，不区分标题字号）；textGap 为行与条形的间距
const barcodeLineStyle = computed<CSSProperties>(() => {
  const o = props.element.options;
  return {
    fontSize: `${('fontSize' in o ? o.fontSize : undefined) || 8}pt`,
    marginTop: `${('textGap' in o ? o.textGap : undefined) ?? 0}px`
  };
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

/** 可选边框（文本 / 条码 / 二维码开启「显示边框」时生效；rect/line 自带边框不在此列） */
const borderStyle = computed<CSSProperties>(() => {
  const o = props.element.options;
  if (!('showBorder' in o) || !o.showBorder) return {};
  return {
    border: `${o.borderWidth ?? 1}px solid ${o.borderColor ?? '#000000'}`,
    boxSizing: 'border-box'
  };
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
  <!-- 文本：标题作为行内前缀与内容排在同一文本流（基线天然对齐、内容折行行首顶格、填满元素框不分块） -->
  <div v-if="isText" class="h-full w-full overflow-hidden break-all" :style="[textStyle, borderStyle]">
    <span v-if="titleText" class="whitespace-nowrap" :style="titleStyle">{{ titleText }}:</span>
    {{ text }}
  </div>
  <!-- 条码：PNG 只画条形，标题+编码值合为下方 DOM 文本行（与编码值同字号居中）；显示文本关闭且无标题时不渲染行 -->
  <div v-else-if="isBarcode" class="flex h-full w-full flex-col overflow-hidden" :style="borderStyle">
    <div class="min-h-0 w-full flex-1">
      <img :src="imgSrc" class="h-full w-full object-contain" alt="" draggable="false" />
    </div>
    <div v-if="barcodeLineVisible" class="w-full shrink-0 break-all text-center" :style="barcodeLineStyle">
      <template v-if="titleText">{{ titleText }}:</template>
      {{ text }}
    </div>
  </div>
  <!-- 非文本（图/二维码/矩形/线条）：标题开启时保持左标题右内容的水平 flex -->
  <div v-else class="flex h-full w-full items-stretch overflow-hidden" :style="borderStyle">
    <div v-if="titleText" class="shrink-0 whitespace-nowrap" :style="titleStyle">
      {{ titleText }}
    </div>
    <div class="h-full min-w-0 flex-1 overflow-hidden">
      <img v-if="imgSrc" :src="imgSrc" class="h-full w-full object-contain" alt="" draggable="false" />
      <div v-else-if="element.type === 'rect'" class="h-full w-full" :style="rectStyle" />
      <div v-else-if="element.type === 'hline'" class="w-full" :style="lineStyle" />
      <div v-else-if="element.type === 'vline'" class="h-full" :style="lineStyle" />
    </div>
  </div>
</template>
