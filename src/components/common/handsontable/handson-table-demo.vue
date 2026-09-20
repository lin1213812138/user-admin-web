<script setup lang="ts">
/**
 * Handsontable 组件示例页（仅开发环境可访问：/handsontable-demo）
 *
 * 不接入业务菜单，只用于验收组件能力；路由在 src/router/index.ts 中以 import.meta.env.DEV 守卫注册。
 */

import { computed, ref, useTemplateRef } from 'vue';
import HandsonTable from './handson-table.vue';
import type { HotColumn, HotDensity, HotNestedHeaders, HotRow, HotSummary, HotThemeName } from './types';

defineOptions({
  name: 'HandsonTableDemo'
});

type GridInstance = InstanceType<typeof HandsonTable>;

const gridRef = useTemplateRef<GridInstance>('grid');

function createRow(index: number): HotRow {
  return {
    code: `A-${String(index).padStart(3, '0')}`,
    region: index % 2 === 0 ? 'A区' : 'B区',
    type: index % 3 === 0 ? '地堆区' : '横梁货架',
    capacity: 100 + index * 10,
    used: index * 5,
    enable: index % 2 === 0,
    inDate: '2026-09-20',
    note: ''
  };
}

/** 演示数据（v-model：稳定引用，组件就地修改） */
const rows = ref<HotRow[]>([createRow(1), createRow(2), createRow(3)]);

const columns: HotColumn[] = [
  {
    data: 'code',
    title: '库位编码',
    type: 'text',
    required: true,
    width: 120,
    rules: [{ pattern: /^[A-Z0-9-]{3,12}$/i, message: '仅允许字母、数字与短横线（3-12 位）' }]
  },
  {
    data: 'region',
    title: '所属库区',
    type: 'dropdown',
    source: ['A区', 'B区', 'C区'],
    strict: true,
    required: true,
    width: 110
  },
  { data: 'type', title: '库位类型', type: 'autocomplete', source: ['横梁货架', '地堆区', '冷藏区'], width: 120 },
  { data: 'capacity', title: '库容', type: 'numeric', width: 90 },
  {
    data: 'used',
    title: '库存',
    type: 'numeric',
    width: 90,
    // 行级规则：即时校验（编辑后立刻高亮）
    rules: [
      {
        trigger: 'change',
        validator: (value, row) => {
          const capacity = Number(row.capacity ?? 0);
          const used = Number(value ?? 0);

          return used > capacity ? '库存不能大于库容' : true;
        }
      }
    ]
  },
  { data: 'enable', title: '启用', type: 'checkbox', width: 60, align: 'center' },
  { data: 'inDate', title: '启用日期', type: 'date', width: 130 },
  {
    data: 'note',
    title: '备注',
    type: 'text',
    width: 140,
    rules: [{ pattern: /^.{0,20}$/, message: '最多 20 个字符' }]
  }
];

/** 演示开关 */
const rowCheckbox = ref(true);
const showSummary = ref(true);
const showNestedHeaders = ref(false);
const freezeFirstColumn = ref(false);
const themeName = ref<HotThemeName>('main');
const density = ref<HotDensity>('default');

const summaries = computed<HotSummary[]>(() =>
  showSummary.value
    ? [
        { column: 'capacity', type: 'sum' },
        { column: 'used', type: 'sum' },
        { column: 'code', type: 'count', formatter: value => `${value} 项` }
      ]
    : []
);

/** 嵌套表头示例：开启行勾选时首列需自行留出勾选列 */
const nestedHeaders = computed<HotNestedHeaders>(() => {
  const lead = rowCheckbox.value ? [''] : [];

  return [
    [...lead, { label: '基本信息', colspan: 3 }, { label: '容量', colspan: 2 }, { label: '状态', colspan: 3 }],
    [...lead, '库位编码', '所属库区', '库位类型', '库容', '库存', '启用', '启用日期', '备注']
  ];
});

const keyword = ref('');
const hint = ref('');

function showHint(text: string) {
  hint.value = text;
}

function handleAddRow() {
  gridRef.value?.addRow({ code: '', region: '', type: '', capacity: 0, used: 0, enable: false, note: '' });
}

function handleDuplicateRow() {
  const total = rows.value.length;

  if (total) gridRef.value?.duplicateRow(total - 1);
}

function handleRemoveChecked() {
  gridRef.value?.removeCheckedRows();
}

function handleValidate() {
  const result = gridRef.value?.validate();

  if (!result) return;

  if (result.valid) {
    window.$message?.success('校验通过');
    showHint('校验通过');
    return;
  }

  window.$message?.error(gridRef.value?.errorsToText(result.errors) ?? '');
  showHint(`校验未通过 ${result.errors.length} 处，已定位第一处`);
}

function handleSearch() {
  const hits = gridRef.value?.search(keyword.value) ?? 0;

  showHint(`搜索「${keyword.value}」命中 ${hits} 个单元格`);
}

function handleClearSearch() {
  gridRef.value?.clearSearch();
  keyword.value = '';
  showHint('已清除搜索高亮');
}

function handleClearAll() {
  gridRef.value?.clear();
}

const submitted = ref('');

function handleSubmit() {
  const result = gridRef.value?.validate();

  if (result && !result.valid) {
    window.$message?.error(gridRef.value?.errorsToText(result.errors) ?? '');
    return;
  }

  submitted.value = JSON.stringify(gridRef.value?.getData() ?? [], null, 2);
  window.$message?.success('已导出提交数据（见下方）');
}
</script>

<template>
  <div class="h-full w-full overflow-auto bg-layout p-16px">
    <div class="mb-12px flex flex-wrap items-center gap-8px">
      <span class="text-16px font-semibold text-base-text">HandsonTable 组件示例</span>
      <span class="text-12px text-base-text opacity-60">
        编辑单元格 / 右键 / 粘贴 Excel 数据 / 拖拽列宽 —— 数据与下方 JSON 实时同步
      </span>
    </div>

    <div class="mb-12px flex flex-wrap items-center gap-8px">
      <NSelect
        v-model:value="themeName"
        class="w-120px"
        size="small"
        :options="[
          { label: '主题 main', value: 'main' },
          { label: '主题 horizon', value: 'horizon' },
          { label: '主题 classic', value: 'classic' }
        ]"
      />
      <NSelect
        v-model:value="density"
        class="w-130px"
        size="small"
        :options="[
          { label: '密度 默认', value: 'default' },
          { label: '密度 紧凑', value: 'compact' },
          { label: '密度 舒适', value: 'comfortable' }
        ]"
      />
      <NCheckbox v-model:checked="rowCheckbox">行勾选</NCheckbox>
      <NCheckbox v-model:checked="showSummary">汇总条</NCheckbox>
      <NCheckbox v-model:checked="showNestedHeaders">嵌套表头</NCheckbox>
      <NCheckbox v-model:checked="freezeFirstColumn">冻结首列</NCheckbox>
    </div>

    <div class="mb-12px flex flex-wrap items-center gap-8px">
      <LButton size="small" @click="handleAddRow">新增行</LButton>
      <LButton size="small" @click="handleDuplicateRow">复制末行</LButton>
      <LButton size="small" :disabled="!rowCheckbox" @click="handleRemoveChecked">删除勾选行</LButton>
      <LButton size="small" @click="handleClearAll">清空</LButton>
      <LButton size="small" type="primary" @click="handleValidate">校验</LButton>
      <LButton size="small" @click="gridRef?.undo()">撤销</LButton>
      <LButton size="small" @click="gridRef?.redo()">重做</LButton>
      <LButton size="small" @click="gridRef?.mergeSelection()">合并选区</LButton>
      <LButton size="small" @click="gridRef?.unmergeSelection()">取消合并</LButton>
      <NInput v-model:value="keyword" class="w-160px" size="small" placeholder="搜索单元格内容" />
      <LButton size="small" @click="handleSearch">搜索</LButton>
      <LButton size="small" @click="handleClearSearch">清除搜索</LButton>
      <LButton size="small" type="primary" @click="handleSubmit">提交数据</LButton>
    </div>

    <div v-if="hint" class="mb-8px text-12px text-primary">{{ hint }}</div>

    <div class="h-460px rounded-8px border border-solid border-#e5e7eb bg-container p-2px dark:border-#3f3f46">
      <HandsonTable
        ref="grid"
        v-model="rows"
        :columns="columns"
        :row-checkbox="rowCheckbox"
        :summaries="summaries"
        :nested-headers="showNestedHeaders ? nestedHeaders : undefined"
        :fixed-columns-left="freezeFirstColumn ? 1 : 0"
        :theme-name="themeName"
        :density="density"
        :min-spare-rows="0"
        height="auto"
      />
    </div>

    <div class="mt-16px grid grid-cols-2 gap-12px">
      <div>
        <div class="mb-6px text-13px font-semibold text-base-text">v-model 数据（{{ rows.length }} 行）</div>
        <pre class="max-h-260px overflow-auto rounded-6px bg-container p-10px text-12px">{{
          JSON.stringify(rows, null, 2)
        }}</pre>
      </div>
      <div>
        <div class="mb-6px text-13px font-semibold text-base-text">getData() 提交快照</div>
        <pre class="max-h-260px overflow-auto rounded-6px bg-container p-10px text-12px">{{
          submitted || '点击「提交数据」后展示'
        }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
pre {
  margin: 0;
  border: 1px solid #e5e7eb;
}

html.dark pre {
  border-color: #3f3f46;
}
</style>
