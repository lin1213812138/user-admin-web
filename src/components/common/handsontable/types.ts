/**
 * Handsontable 通用可编辑电子表格组件 · 对外类型
 *
 * 设计说明见 docs/superpowers/specs/2026-09-20-handsontable-component-design.md
 */

import type { CellChange, GridSettings } from 'handsontable';

/** 行数据对象：字段名 → 值 */
export type HotRow = Record<string, unknown>;

/** 组件显式支持的单元格类型 */
export type HotCellType = 'text' | 'numeric' | 'date' | 'time' | 'dropdown' | 'autocomplete' | 'checkbox' | 'password';

/** 内置主题名（对应 handsontable/themes 的 main / horizon / classic） */
export type HotThemeName = 'main' | 'horizon' | 'classic';

/** 表格密度 */
export type HotDensity = 'default' | 'compact' | 'comfortable';

/** 表格界面语言（缺省跟随项目 i18n） */
export type HotLanguage = 'zh-CN' | 'en-US';

/** 单元格水平对齐 */
export type HotColumnAlign = 'left' | 'center' | 'right';

/** 汇总方式 */
export type HotSummaryType = 'sum' | 'count' | 'average' | 'min' | 'max' | 'custom';

/** 列校验规则：按 `required` → `rules` 顺序执行，首个失败即产出错误 */
export interface HotColumnRule {
  /** 正则校验（不匹配即失败） */
  pattern?: RegExp;
  /** 自定义校验：返回 true 通过；返回 string 作为错误信息（可与 message 并存，以返回值优先） */
  validator?: (value: unknown, row: HotRow, rowIndex: number) => true | string;
  /** 失败提示；缺省使用内置文案「格式不正确」 */
  message?: string;
  /** 触发时机：validate=提交校验（默认）；change=编辑后即时校验该列所在表格 */
  trigger?: 'validate' | 'change';
}

/** 列配置：HOT 原生列设置的常用子集 + 组件扩展（title / required / rules / align / summary） */
export interface HotColumn {
  /** 字段名（对象数据模式必填） */
  data: string;
  /** 表头文案（未显式传 colHeaders 时取它） */
  title?: string;
  /** 单元格类型 */
  type?: HotCellType;
  /** 列宽（px） */
  width?: number;
  /** 是否只读（可按行动态判定） */
  readOnly?: boolean | ((row: HotRow, rowIndex: number) => boolean);
  /** 水平对齐（映射为 htLeft / htCenter / htRight） */
  align?: HotColumnAlign;
  /** 追加的单元格类名 */
  className?: string;
  /** 单元格占位文案 */
  placeholder?: string;
  /** dropdown / autocomplete 候选项 */
  source?: Array<string | number>;
  /** dropdown 严格模式（仅允许候选项） */
  strict?: boolean;
  /** 日期格式（HOT dateFormat 语义） */
  dateFormat?: Intl.DateTimeFormatOptions;
  /** 时间格式（HOT timeFormat 语义） */
  timeFormat?: Intl.DateTimeFormatOptions;
  /** 数字格式（HOT numericFormat 语义，如 { pattern: '0,0.00' }） */
  numericFormat?: { pattern: string; culture?: string };
  /** 允许非法值（HOT 语义：校验失败仍写入数据） */
  allowInvalid?: boolean;
  /** 快捷必填（等价在 rules 之前插入一条必填规则） */
  required?: boolean;
  /** 校验规则 */
  rules?: HotColumnRule[];
  /** 该列在汇总条中的默认汇总方式（可被 summaries 覆盖） */
  summary?: HotSummaryType;
}

/** 汇总条配置（组件自绘在表格下方，不写入数据行） */
export interface HotSummary {
  /** 目标列字段名 */
  column: string;
  /** 汇总方式 */
  type: HotSummaryType;
  /** type='custom' 时的自定义汇总：返回值作为展示文本 */
  customFunction?: (values: unknown[], rows: HotRow[]) => unknown;
  /** 展示格式化（仅影响汇总条文本，缺省按数值输出） */
  formatter?: (value: number) => string;
}

/** 合并单元格（初始配置；也可用 mergeSelection()/unmergeSelection() 动态合并） */
export interface HotMergeCell {
  /** 起始行（可视行索引） */
  row: number;
  /** 起始列（可视列索引） */
  col: number;
  /** 跨行数，默认 1 */
  rowspan?: number;
  /** 跨列数，默认 1 */
  colspan?: number;
}

/** 嵌套表头（HOT nestedHeaders 语义，启用时默认关闭平铺表头） */
export type HotNestedHeaders = NonNullable<GridSettings['nestedHeaders']>;

/** 校验错误 */
export interface HotError {
  /** 数据行索引（源数据顺序） */
  rowIndex: number;
  /** 字段名 */
  field: string;
  /** 表头文案 */
  title: string;
  /** 已国际化的错误文案 */
  message: string;
  /** HOT 可视列索引（与 selectCell / scrollToCell 同坐标系） */
  colIndex: number;
}

/** 校验结果 */
export interface HotValidationResult {
  valid: boolean;
  errors: HotError[];
}

/** 行勾选状态 */
export interface HotCheckedState {
  /** 已勾选行（净化后的行数据） */
  rows: HotRow[];
  /** 已勾选行的数据行索引 */
  indexes: number[];
  /** 是否全选 */
  allChecked: boolean;
  /** 是否半选 */
  indeterminate: boolean;
}

/** 汇总条渲染项 */
export interface HotSummaryItem {
  /** 列标识（字段名；行勾选列使用固定串） */
  key: string;
  /** 展示文本 */
  value: string;
  /** 列宽（px） */
  width: number;
}

/** 默认右键菜单项 */
export const DEFAULT_CONTEXT_MENU_ITEMS = [
  'row_above',
  'row_below',
  'remove_row',
  '---------',
  'undo',
  'redo',
  '---------',
  'cut',
  'copy',
  '---------',
  'mergeCells',
  'unmergeCells',
  '---------',
  'alignment'
] as const;

/** 默认行勾选字段名 */
export const DEFAULT_ROW_CHECKBOX_KEY = '__checked';

/** 组件 props */
export interface HotProps {
  /** 数据源（v-model）：行对象数组，请使用稳定引用（不要每次传入新数组，否则会触发 loadData 丢失光标与撤销栈） */
  modelValue?: HotRow[];
  /** 列配置（不含行勾选列，勾选列由组件注入） */
  columns: HotColumn[];
  /** 表头：缺省取 columns[].title；false 关闭；数组则覆盖 */
  colHeaders?: boolean | string[];
  /** 嵌套表头（HOT nestedHeaders） */
  nestedHeaders?: HotNestedHeaders;
  /** 行头（行序号）：默认 true */
  rowHeaders?: boolean | string[];
  /** 高度：number=px，string=CSS 值，'auto'=内容撑开（默认） */
  height?: number | string;
  /** 整表只读 */
  readOnly?: boolean;

  /* ---------- 行级增强 ---------- */
  /** 行勾选列，默认 false */
  rowCheckbox?: boolean;
  /** 行勾选列宽，默认 40 */
  rowCheckboxWidth?: number;
  /** 行勾选绑定字段名，默认 __checked（getData() 会剔除该内部字段） */
  rowCheckboxKey?: string;
  /** 汇总条配置，默认 []（不渲染） */
  summaries?: HotSummary[];

  /* ---------- 交互增强 ---------- */
  /** 右键菜单：false 关闭；true=默认常用项；数组=完全自定义 */
  contextMenu?: boolean | string[];
  /** 复制粘贴（Excel 双向兼容），默认 true；'crossSheet' 为 HOT 跨表粘贴语义 */
  copyPaste?: boolean | 'crossSheet';
  /** 撤销重做，默认 true */
  undoRedo?: boolean;
  /** 列排序，默认 true */
  columnSorting?: boolean;
  /** 筛选 + 表头筛选面板，默认 true */
  filters?: boolean;
  /** 搜索（启用插件，配合 search()/clearSearch() 使用），默认 true */
  search?: boolean;
  /** 列宽拖拽，默认 true */
  manualColumnResize?: boolean;
  /** 行高拖拽，默认 true */
  manualRowResize?: boolean;
  /** 列拖拽换位，默认 false */
  manualColumnMove?: boolean;
  /** 行拖拽换位，默认 false */
  manualRowMove?: boolean;
  /** 冻结顶部行数，默认 0 */
  fixedRowsTop?: number;
  /** 冻结左侧列数，默认 0 */
  fixedColumnsLeft?: number;
  /** 冻结底部行数，默认 0 */
  fixedRowsBottom?: number;
  /** 初始合并单元格配置 */
  mergeCells?: HotMergeCell[] | boolean;

  /* ---------- 基础与编辑 ---------- */
  /** 底部留白行数，默认 0（HOT 会作为真实空行写入数据，getData() 会包含） */
  minSpareRows?: number;
  /** 空表占位文案 */
  placeholder?: string;
  /** 列宽拉伸策略，默认 'last' */
  stretchH?: 'last' | 'all' | 'none';
  /** 必填/非法单元格即时高亮，默认 true */
  highlightInvalid?: boolean;

  /* ---------- 主题与国际化 ---------- */
  /** 主题，默认 'main' */
  themeName?: HotThemeName;
  /** 密度，默认 'default' */
  density?: HotDensity;
  /** 语言，缺省跟随项目 i18n */
  language?: HotLanguage;

  /** 高级透传：组件未覆盖的 HOT 选项；与组件管理项（data/columns/theme/language/height）冲突时以组件为准 */
  settings?: Record<string, unknown>;
}

/** 组件事件 */
export interface HotEmits {
  /** 数据变化（单元格编辑、粘贴、增删行等） */
  'update:modelValue': [rows: HotRow[]];
  /** HOT afterChange 原始参数透传 */
  change: [changes: CellChange[] | null, source: string];
  /** 行勾选变化 */
  'check-change': [state: HotCheckedState];
  /** 校验未通过（已自动定位第一处） */
  'validation-failed': [errors: HotError[]];
  /** 实例创建完成（可拿原生实例做兜底操作） */
  ready: [instance: unknown];
}

/** 组件对外方法 */
export interface HotExposedApi {
  /* 数据 */
  getData: () => HotRow[];
  getSourceData: () => HotRow[];
  setData: (rows: HotRow[]) => void;
  addRow: (row?: HotRow, index?: number) => void;
  removeRow: (index: number) => void;
  removeRows: (indexes: number[]) => void;
  duplicateRow: (index: number) => void;
  clear: () => void;

  /* 校验 */
  validate: (options?: { scrollToFirst?: boolean }) => HotValidationResult;
  clearValidation: () => void;
  errorsToText: (errors: HotError[]) => string;

  /* 行勾选 */
  getCheckedRows: () => HotRow[];
  getCheckedIndexes: () => number[];
  setAllChecked: (checked: boolean) => void;
  clearChecked: () => void;
  removeCheckedRows: () => void;

  /* 视图与操作 */
  undo: () => void;
  redo: () => void;
  search: (keyword: string) => number;
  clearSearch: () => void;
  scrollToRow: (index: number) => void;
  scrollToCell: (position: { row: number; col: number }) => void;
  mergeSelection: () => void;
  unmergeSelection: () => void;
  getColumnIndex: (field: string) => number;
  getHotInstance: () => unknown;
}
