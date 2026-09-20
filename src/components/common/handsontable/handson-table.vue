<script setup lang="ts">
/**
 * Handsontable 通用可编辑电子表格
 *
 * 能力概览（详见 docs/superpowers/specs/2026-09-20-handsontable-component-design.md）：
 * - 数据：v-model 双向绑定 + getData/setData/addRow/removeRow/duplicateRow/clear
 * - 编辑：文本/数字/日期/时间/下拉/自动完成/复选，必填与正则、自定义校验（高亮 + 自动定位）
 * - 交互：右键菜单、撤销重做、Excel 双向粘贴、排序、筛选、搜索、列宽行高拖拽、冻结行列、合并单元格、嵌套表头
 * - 行级：行勾选（含表头全选 / 半选）、footer 汇总条
 * - 主题：跟随项目暗色模式，中英文随 i18n 切换，密度可调
 *
 * 使用：`<HandsonTable v-model="rows" :columns="columns" />`（组件由 unplugin 自动注册，也可从本目录 index.ts 显式导入）
 */

import { useHandsonTable } from './use-handsontable';
import { DEFAULT_ROW_CHECKBOX_KEY, type HotEmits, type HotProps } from './types';

defineOptions({
  name: 'HandsonTable'
});

const props = withDefaults(defineProps<HotProps>(), {
  modelValue: () => [],
  colHeaders: undefined,
  nestedHeaders: undefined,
  rowHeaders: true,
  height: 'auto',
  readOnly: false,
  rowCheckbox: false,
  rowCheckboxWidth: 40,
  rowCheckboxKey: DEFAULT_ROW_CHECKBOX_KEY,
  summaries: () => [],
  contextMenu: true,
  copyPaste: true,
  undoRedo: true,
  columnSorting: true,
  filters: true,
  search: true,
  manualColumnResize: true,
  manualRowResize: true,
  manualColumnMove: false,
  manualRowMove: false,
  fixedRowsTop: 0,
  fixedColumnsLeft: 0,
  fixedRowsBottom: 0,
  mergeCells: false,
  minSpareRows: 0,
  placeholder: '',
  stretchH: 'last',
  highlightInvalid: true,
  themeName: 'main',
  density: 'default',
  language: undefined,
  settings: undefined
});

const emit = defineEmits<HotEmits>();

const { containerRef, summary, api } = useHandsonTable({ props, emit });
const { items: summaryItems, leadWidth, leadText, scrollLeft } = summary;

defineExpose(api);
</script>

<template>
  <div class="hot-wrapper">
    <div ref="containerRef" class="hot-container"></div>

    <div v-if="summaryItems.length" class="hot-summary">
      <div class="hot-summary__lead" :style="{ width: `${leadWidth}px` }">
        <span v-if="leadWidth">{{ leadText }}</span>
      </div>
      <div class="hot-summary__viewport">
        <div class="hot-summary__inner" :style="{ transform: `translateX(${-scrollLeft}px)` }">
          <div
            v-for="item in summaryItems"
            :key="item.key"
            class="hot-summary__cell"
            :style="{ width: `${item.width}px` }"
            :title="item.value"
          >
            {{ item.value }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hot-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.hot-container {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
}

/* 行勾选表头：注入的原生复选框（点击已阻止冒泡，不会触发表头排序） */
:deep(.hot-head-checkbox) {
  width: 16px;
  height: 16px;
  margin: 0;
  vertical-align: middle;
  cursor: pointer;
}

/* 必填未填的即时高亮（提交校验失败由 HOT 的 invalidCellClassName 负责，两者同源色） */
:deep(.htCore td.hot-cell-required) {
  background-color: var(--ht-cell-error-background-color, #fa4d3233);
}

.hot-summary {
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
  font-size: 12px;
  line-height: 28px;
  height: 28px;
  border-top: 1px solid #e5e7eb;
  background-color: rgb(var(--container-bg-color));
  color: rgb(var(--base-text-color));
}

.hot-summary__lead {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  overflow: hidden;
  font-weight: 600;
  white-space: nowrap;
  border-right: 1px solid #e5e7eb;
}

.hot-summary__viewport {
  flex: 1 1 auto;
  overflow: hidden;
}

.hot-summary__inner {
  display: flex;
  width: max-content;
}

.hot-summary__cell {
  flex: 0 0 auto;
  box-sizing: border-box;
  padding: 0 8px;
  overflow: hidden;
  white-space: nowrap;
  text-align: right;
  text-overflow: ellipsis;
  border-right: 1px solid #e5e7eb;
}

html.dark {
  .hot-summary,
  .hot-summary__lead,
  .hot-summary__cell {
    border-color: #3f3f46;
  }
}
</style>
