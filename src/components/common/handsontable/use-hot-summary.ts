/**
 * 汇总条（footer）：数值计算 + 列宽读取 + 横向滚动同步
 *
 * 为什么自绘而不使用 HOT 的 columnSummary 插件：
 * 该插件不会自动新增行，必须占用一条真实数据行并把结果写回该行单元格；
 * 一旦启用排序/筛选，该行会被移动甚至覆盖真实数据。自绘条不写数据、可与排序/筛选共存。
 * 已知限制：启用 fixedColumnsLeft（冻结列）时汇总条不平移冻结列。
 */

import { onBeforeUnmount, ref, type Ref } from 'vue';
import type { HotInstance } from 'handsontable';
import type { HotColumn, HotRow, HotSummary, HotSummaryItem, HotSummaryType } from './types';

/** 汇总条内部使用的行勾选列标识 */
const CHECKBOX_SUMMARY_KEY = '__rowCheckbox';

export interface HotSummaryContext {
  /** 原生实例 */
  getInstance: () => HotInstance | null;
  /** 表格容器元素（用于读取行头宽度与滚动容器） */
  getContainer: () => HTMLElement | null;
  /** 当前数据行（源数据顺序） */
  getRows: () => HotRow[];
  /** 用户列配置（不含行勾选列） */
  getColumns: () => HotColumn[];
  /** 汇总配置 */
  getSummaries: () => HotSummary[];
  /** 是否启用了行勾选列（物理列索引 0） */
  hasCheckboxColumn: () => boolean;
  /** 行头占位文案（如「合计」） */
  getLeadText: () => string;
}

export interface UseHotSummaryReturn {
  /** 汇总项（按 HOT 可视列顺序） */
  items: Ref<HotSummaryItem[]>;
  /** 行头占位宽度（px） */
  leadWidth: Ref<number>;
  /** 行头占位文案 */
  leadText: Ref<string>;
  /** 横向滚动偏移（px） */
  scrollLeft: Ref<number>;
  /** 重算汇总数值与列宽（数据/列结构/容器尺寸变化时调用） */
  refresh: () => void;
  /** 绑定滚动同步与尺寸监听（实例创建后调用） */
  bind: () => void;
  /** 解绑监听（实例销毁时调用） */
  unbind: () => void;
}

function isBlank(value: unknown) {
  return value === null || value === undefined || value === '';
}

/** 汇总参与计算的数值（跳过空值与非数字） */
function toNumbers(values: unknown[]) {
  const numbers: number[] = [];

  for (const value of values) {
    if (isBlank(value)) continue;

    const num = typeof value === 'number' ? value : Number(value);

    if (Number.isFinite(num)) numbers.push(num);
  }

  return numbers;
}

/** 抹掉浮点累加噪声（仅用于展示） */
function roundFloat(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

/** 默认数值展示：整数原样，小数保留最多两位有效展示 */
function defaultFormat(value: number) {
  return Number.isInteger(value) ? String(value) : String(roundFloat(value));
}

function computeValue(summary: HotSummary, values: unknown[], rows: HotRow[]): number | string {
  if (summary.type === 'custom') {
    return summary.customFunction ? String(summary.customFunction(values, rows) ?? '') : '';
  }

  if (summary.type === 'count') {
    return values.filter(value => !isBlank(value)).length;
  }

  const numbers = toNumbers(values);

  if (!numbers.length) return '';

  switch (summary.type as HotSummaryType) {
    case 'sum':
      return roundFloat(numbers.reduce((total, num) => total + num, 0));
    case 'average':
      return roundFloat(numbers.reduce((total, num) => total + num, 0) / numbers.length);
    case 'min':
      return Math.min(...numbers);
    case 'max':
      return Math.max(...numbers);
    default:
      return '';
  }
}

/**
 * 汇总条状态与对齐同步
 *
 * @param context 由组件提供的取值上下文（全部为惰性函数，保证读到最新值）
 */
export function useHotSummary(context: HotSummaryContext): UseHotSummaryReturn {
  const items = ref<HotSummaryItem[]>([]);
  const leadWidth = ref(0);
  const leadText = ref('');
  const scrollLeft = ref(0);

  let holder: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;

  function syncScrollLeft() {
    scrollLeft.value = holder?.scrollLeft ?? 0;
  }

  /** 行头宽度取自首个数据单元格的 offsetLeft（行头列宽随主题/密度变化，不宜写死） */
  function syncLeadWidth() {
    const container = context.getContainer();
    const cell = container?.querySelector<HTMLElement>('.ht_master tbody tr td');

    leadWidth.value = cell ? Math.round(cell.offsetLeft) : 0;
  }

  function refresh() {
    const hot = context.getInstance();
    const summaries = context.getSummaries() ?? [];

    leadText.value = context.getLeadText();

    if (!hot || hot.isDestroyed || !summaries.length) {
      items.value = [];
      return;
    }

    const rows = context.getRows() ?? [];
    const columns = context.getColumns() ?? [];
    const hasCheckbox = context.hasCheckboxColumn();
    const columnOffset = hasCheckbox ? 1 : 0;
    const summaryMap = new Map(summaries.map(summary => [summary.column, summary]));
    const next: HotSummaryItem[] = [];
    const columnCount = hot.countCols();

    for (let visual = 0; visual < columnCount; visual += 1) {
      const width = hot.getColWidth(visual);
      const physical = hot.toPhysicalColumn(visual);
      const isCheckboxColumn = hasCheckbox && physical === 0;
      const field = isCheckboxColumn ? CHECKBOX_SUMMARY_KEY : columns[physical - columnOffset]?.data;
      const summary = field ? summaryMap.get(field) : undefined;
      let value = '';

      if (summary && field) {
        const raw = computeValue(
          summary,
          rows.map(row => row[field]),
          rows
        );

        value = typeof raw === 'number' ? (summary.formatter ? summary.formatter(raw) : defaultFormat(raw)) : raw;
      }

      next.push({
        key: isCheckboxColumn ? `${CHECKBOX_SUMMARY_KEY}-${visual}` : (field ?? `col-${visual}`),
        value,
        width
      });
    }

    items.value = next;
    syncLeadWidth();
    syncScrollLeft();
  }

  function unbind() {
    if (holder) {
      holder.removeEventListener('scroll', syncScrollLeft);
      holder = null;
    }

    resizeObserver?.disconnect();
    resizeObserver = null;

    scrollLeft.value = 0;
  }

  function bind() {
    unbind();

    const container = context.getContainer();
    holder = container?.querySelector<HTMLElement>('.ht_master .wtHolder') ?? null;
    holder?.addEventListener('scroll', syncScrollLeft, { passive: true });

    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => refresh());
      resizeObserver.observe(container);
    }

    refresh();
  }

  onBeforeUnmount(unbind);

  return { items, leadWidth, leadText, scrollLeft, refresh, bind, unbind };
}
