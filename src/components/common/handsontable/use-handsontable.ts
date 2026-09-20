/**
 * Handsontable 通用可编辑电子表格 · 组合式函数
 *
 * 职责：
 * 1. 一次性注册模块 / 主题 / 语言字典，并静态引入样式（避免核心自动注入导致重复）；
 * 2. 组装 HOT settings（列、表头、主题、语言、交互开关、组件扩展）；
 * 3. 管理实例生命周期与 props 变更（数据、结构、主题、密度、语言）；
 * 4. 提供校验、行勾选、行操作、搜索、撤销重做等对外方法。
 *
 * 设计说明见 docs/superpowers/specs/2026-09-20-handsontable-component-design.md
 */

import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import Handsontable from 'handsontable';
import type {
  BaseTheme,
  CellChange,
  CellProperties,
  ChangeSource,
  ColumnSettings,
  GridSettings,
  HotInstance
} from 'handsontable';
import type { MergeCells } from 'handsontable/plugins/mergeCells';
import type { Search } from 'handsontable/plugins/search';
import type { ThemeBuilder } from 'handsontable/themes';
import { classicTheme, getTheme, horizonTheme, mainTheme, registerTheme } from 'handsontable/themes';
import { registerLanguageDictionary } from 'handsontable/i18n';
import { registerAllModules } from 'handsontable/registry';
import enUS from 'handsontable/i18n/languages/en-US';
import zhCN from 'handsontable/i18n/languages/zh-CN';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import 'handsontable/styles/ht-theme-horizon.min.css';
import 'handsontable/styles/ht-theme-classic.min.css';
import { $t, getLocale } from '@/locales';
import { useThemeStore } from '@/store/modules/theme';
import { useHotSummary } from './use-hot-summary';
import {
  DEFAULT_CONTEXT_MENU_ITEMS,
  DEFAULT_ROW_CHECKBOX_KEY,
  type HotCheckedState,
  type HotColumn,
  type HotColumnRule,
  type HotEmits,
  type HotError,
  type HotProps,
  type HotRow,
  type HotValidationResult
} from './types';

/** 必填未填的即时高亮类名（单元格级，见组件样式） */
const REQUIRED_CELL_CLASS = 'hot-cell-required';
/** 表头全选复选框类名 */
const HEAD_CHECKBOX_CLASS = 'hot-head-checkbox';

/** 对齐方式 → HOT 类名 */
const ALIGN_CLASS: Record<NonNullable<HotColumn['align']>, string> = {
  left: 'htLeft',
  center: 'htCenter',
  right: 'htRight'
};

/** 筛选表头下拉面板默认项 */
const DEFAULT_DROPDOWN_MENU_ITEMS = [
  'filter_by_condition',
  'filter_by_value',
  'filter_operators',
  '---------',
  'filter_action_bar'
];

/** 组件内部使用的 HOT settings（theme / injectCoreCss 尚未进入官方类型） */
interface HotInternalSettings extends GridSettings {
  /** 主题：ThemeBuilder 实例或主题配置对象（仅传字符串时 colorScheme/density 会失效） */
  theme?: BaseTheme | ThemeBuilder;
  /** 已静态引入 base CSS，关闭核心自动注入避免重复 */
  injectCoreCss?: boolean;
}

/** 归一化后的校验规则 */
interface NormalizedRule {
  required?: boolean;
  pattern?: RegExp;
  validator?: HotColumnRule['validator'];
  message?: string;
  trigger: 'validate' | 'change';
}

type HotEmit = <K extends keyof HotEmits>(event: K, ...args: HotEmits[K]) => void;

/** 模块 / 主题 / 语言字典只注册一次 */
let hotSetupDone = false;

function setupOnce() {
  if (hotSetupDone) return;

  registerAllModules();
  registerTheme(mainTheme);
  registerTheme(horizonTheme);
  registerTheme(classicTheme);
  registerLanguageDictionary(zhCN);
  registerLanguageDictionary(enUS);

  hotSetupDone = true;
}

function isBlank(value: unknown) {
  return value === null || value === undefined || value === '';
}

/** 归一化列规则：required 优先，其余按声明顺序 */
function normalizeRules(column: HotColumn): NormalizedRule[] {
  const rules: NormalizedRule[] = [];

  if (column.required) {
    rules.push({ required: true, trigger: 'validate' });
  }

  for (const rule of column.rules ?? []) {
    rules.push({
      pattern: rule.pattern,
      validator: rule.validator,
      message: rule.message,
      trigger: rule.trigger ?? 'validate'
    });
  }

  return rules;
}

/** 行规则执行：返回 true 通过，返回 string 为已国际化的错误文案 */
function runRules(
  rules: NormalizedRule[],
  value: unknown,
  row: HotRow,
  rowIndex: number,
  title: string
): true | string {
  for (const rule of rules) {
    if (rule.required && isBlank(value)) {
      return $t('handsontable.required', { row: rowIndex + 1, title });
    }

    // 非必填的空值不参与 pattern / 自定义校验
    if (isBlank(value)) continue;

    if (rule.pattern) {
      rule.pattern.lastIndex = 0;

      if (!rule.pattern.test(String(value))) {
        return rule.message
          ? $t('handsontable.invalidWithMessage', { row: rowIndex + 1, title, message: rule.message })
          : $t('handsontable.invalid', { row: rowIndex + 1, title });
      }
    }

    if (rule.validator) {
      const result = rule.validator(value, row, rowIndex);

      if (result !== true) {
        const detail = typeof result === 'string' && result ? result : rule.message;

        return detail
          ? $t('handsontable.invalidWithMessage', { row: rowIndex + 1, title, message: detail })
          : $t('handsontable.invalid', { row: rowIndex + 1, title });
      }
    }
  }

  return true;
}

export interface UseHandsonTableOptions {
  props: Readonly<HotProps>;
  emit: HotEmit;
}

/**
 * 表格实例与能力编排
 *
 * @param options 组件 props（响应式）与事件派发器
 */
export function useHandsonTable(options: UseHandsonTableOptions) {
  const { props, emit } = options;

  const containerRef = ref<HTMLElement | null>(null);
  const instance = shallowRef<HotInstance | null>(null);

  /** 当前数据源（与 HOT 源数据同引用，HOT 就地修改） */
  const rows = shallowRef<HotRow[]>([]);
  /** 内部操作数据时抑制 watcher 回环 */
  let syncing = false;
  /** 最近一次已知的数据行数（用于识别外部 push / splice） */
  let lastLength = -1;

  const themeStore = useThemeStore();

  const checkboxEnabled = computed(() => Boolean(props.rowCheckbox));
  const checkboxKey = computed(() => props.rowCheckboxKey || DEFAULT_ROW_CHECKBOX_KEY);
  const language = computed(() => props.language ?? (getLocale() === 'en-US' ? 'en-US' : 'zh-CN'));
  const colorScheme = computed(() => (themeStore.darkMode ? 'dark' : 'light'));

  /** 字段 → 列配置 */
  const columnMap = computed(() => {
    const map = new Map<string, HotColumn>();

    for (const column of props.columns ?? []) map.set(column.data, column);

    return map;
  });

  /** 字段 → 归一化规则 */
  const rulesByField = computed(() => {
    const map = new Map<string, NormalizedRule[]>();

    for (const column of props.columns ?? []) {
      const rules = normalizeRules(column);

      if (rules.length) map.set(column.data, rules);
    }

    return map;
  });

  /** 有「即时校验」规则的字段集合 */
  const changeTriggerFields = computed(() => {
    const fields = new Set<string>();

    for (const column of props.columns ?? []) {
      if (normalizeRules(column).some(rule => rule.trigger === 'change')) fields.add(column.data);
    }

    return fields;
  });

  /** 必填字段集合（用于即时高亮） */
  const requiredFields = computed(() => {
    const fields = new Set<string>();

    for (const column of props.columns ?? []) {
      if (column.required) fields.add(column.data);
    }

    return fields;
  });

  /* ------------------------------------------------------------------ 生成 settings */

  function resolveTheme(): BaseTheme | ThemeBuilder {
    return getTheme(props.themeName ?? 'main') ?? getTheme('main') ?? mainTheme;
  }

  function resolveHeight() {
    // 'auto' → 不设高度，由内容撑开
    return props.height === 'auto' ? undefined : props.height;
  }

  function resolveColHeaders(): GridSettings['colHeaders'] {
    if (props.colHeaders !== undefined) return props.colHeaders;
    if (props.nestedHeaders) return false;

    const titles: string[] = [];

    if (checkboxEnabled.value) titles.push('');

    for (const column of props.columns ?? []) titles.push(column.title ?? column.data);

    return titles;
  }

  function resolveContextMenu(): GridSettings['contextMenu'] {
    if (props.contextMenu === false) return false;
    if (Array.isArray(props.contextMenu)) return props.contextMenu;

    return [...DEFAULT_CONTEXT_MENU_ITEMS];
  }

  function resolveMergeCells(): GridSettings['mergeCells'] {
    if (!props.mergeCells || props.mergeCells === true) return props.mergeCells;

    return props.mergeCells.map(cell => ({
      row: cell.row,
      col: cell.col,
      rowspan: cell.rowspan ?? 1,
      colspan: cell.colspan ?? 1
    }));
  }

  /** 物理列索引（含注入的行勾选列） */
  function physicalColumnIndex(field: string) {
    const index = (props.columns ?? []).findIndex(column => column.data === field);

    if (index < 0) return -1;

    return index + (checkboxEnabled.value ? 1 : 0);
  }

  /** 单元格类名：对齐 + 自定义 + 必填未填即时高亮 */
  function createCellsCallback(): GridSettings['cells'] | undefined {
    if (!props.highlightInvalid) return undefined;

    return (_row: number, _col: number, prop: string | number) => {
      if (typeof prop !== 'string' || !requiredFields.value.has(prop)) return {};

      const hot = instance.value;
      const physicalRow = hot && !hot.isDestroyed ? hot.toPhysicalRow(_row) : _row;
      const value = rows.value[physicalRow]?.[prop];

      if (!isBlank(value)) return {};

      const column = columnMap.value.get(prop);
      const className = [column?.align ? ALIGN_CLASS[column.align] : '', column?.className, REQUIRED_CELL_CLASS]
        .filter(Boolean)
        .join(' ');

      return { className };
    };
  }

  function buildColumns(): ColumnSettings[] {
    const columns: ColumnSettings[] = [];

    if (checkboxEnabled.value) {
      columns.push({
        data: checkboxKey.value,
        type: 'checkbox',
        width: props.rowCheckboxWidth,
        className: 'htCenter htMiddle',
        readOnly: false
      } as ColumnSettings);
    }

    for (const column of props.columns ?? []) {
      const settings = {
        data: column.data,
        type: column.type,
        width: column.width,
        readOnly: column.readOnly,
        placeholder: column.placeholder,
        source: column.source,
        strict: column.strict,
        dateFormat: column.dateFormat,
        timeFormat: column.timeFormat,
        numericFormat: column.numericFormat,
        allowInvalid: column.allowInvalid
      } as ColumnSettings;

      const className = [column.align ? ALIGN_CLASS[column.align] : '', column.className].filter(Boolean).join(' ');

      if (className) settings.className = className;
      if (column.title !== undefined) settings.title = column.title;

      const rules = normalizeRules(column);

      if (rules.length) {
        settings.validator = createValidator(column.data, rules);
      }

      columns.push(settings);
    }

    return columns;
  }

  /** 列校验器：HOT 只回调 (value, callback)，行信息从 this（cellProperties）取 */
  function createValidator(field: string, rules: NormalizedRule[]) {
    return function validator(this: CellProperties, value: unknown, callback: (valid: boolean) => void) {
      const hot = this.instance as HotInstance | undefined;

      if (!hot || hot.isDestroyed) {
        callback(true);
        return;
      }

      const visualRow = this.visualRow ?? 0;
      const physicalRow = hot.toPhysicalRow(visualRow);
      const row = (hot.getSourceDataAtRow(physicalRow) as HotRow | undefined) ?? rows.value[physicalRow] ?? {};

      // 整行皆空的行不参与校验（minSpareRows / 手动留白不报必填错）
      if (isRowBlank(row)) {
        callback(true);
        return;
      }

      const title = columnMap.value.get(field)?.title ?? field;

      callback(runRules(rules, value, row, physicalRow, title) === true);
    };
  }

  function createSettings(withData: boolean): HotInternalSettings {
    const settings: HotInternalSettings = {
      licenseKey: 'non-commercial-and-evaluation',
      language: language.value,
      theme: resolveTheme(),
      colorScheme: colorScheme.value,
      density: props.density,
      width: '100%',
      height: resolveHeight(),
      readOnly: props.readOnly,
      rowHeaders: props.rowHeaders ?? true,
      colHeaders: resolveColHeaders(),
      columns: buildColumns(),
      nestedHeaders: props.nestedHeaders,
      stretchH: props.stretchH,
      minSpareRows: props.minSpareRows,
      placeholder: props.placeholder,
      cells: createCellsCallback(),
      mergeCells: resolveMergeCells(),
      // 交互增强
      contextMenu: resolveContextMenu(),
      copyPaste: props.copyPaste as GridSettings['copyPaste'],
      undo: props.undoRedo,
      columnSorting: props.columnSorting,
      filters: props.filters,
      dropdownMenu: props.filters ? [...DEFAULT_DROPDOWN_MENU_ITEMS] : false,
      search: props.search,
      manualColumnResize: props.manualColumnResize,
      manualRowResize: props.manualRowResize,
      manualColumnMove: props.manualColumnMove,
      manualRowMove: props.manualRowMove,
      fixedRowsTop: props.fixedRowsTop,
      fixedColumnsLeft: props.fixedColumnsLeft,
      fixedRowsBottom: props.fixedRowsBottom,
      injectCoreCss: false,
      ...props.settings
    };

    if (withData) settings.data = rows.value;

    return settings;
  }

  /* ------------------------------------------------------------------ 行勾选 */

  function ensureCheckedFields(list: HotRow[]) {
    if (!checkboxEnabled.value) return;

    const key = checkboxKey.value;

    for (const row of list) {
      if (row && row[key] === undefined) row[key] = false;
    }
  }

  function isCheckedRow(row: HotRow) {
    return row?.[checkboxKey.value] === true;
  }

  /** 净化行数据：剔除内部勾选字段（浅拷贝，不改动源对象） */
  function cleanRow(row: HotRow): HotRow {
    if (!checkboxEnabled.value) return { ...row };

    const copy: HotRow = { ...row };

    delete copy[checkboxKey.value];

    return copy;
  }

  function computeCheckedState(): HotCheckedState {
    const indexes: number[] = [];
    const checkedRows: HotRow[] = [];

    rows.value.forEach((row, index) => {
      if (isCheckedRow(row)) {
        indexes.push(index);
        checkedRows.push(row);
      }
    });

    const total = rows.value.length;

    return {
      rows: checkedRows.map(cleanRow),
      indexes,
      allChecked: total > 0 && indexes.length === total,
      indeterminate: indexes.length > 0 && indexes.length < total
    };
  }

  function emitCheckChange() {
    emit('check-change', computeCheckedState());
  }

  /** 同步表头全选复选框状态（渲染后由 afterRender 钩子调用） */
  function syncCheckboxHeader() {
    const container = containerRef.value;

    if (!container || !checkboxEnabled.value) return;

    const box = container.querySelector<HTMLInputElement>(`.${HEAD_CHECKBOX_CLASS}`);

    if (!box) return;

    const state = computeCheckedState();

    box.checked = state.allChecked;
    box.indeterminate = state.indeterminate;
  }

  /* ------------------------------------------------------------------ 数据同步 */

  function refreshSummary() {
    summary.refresh();
  }

  function emitModel() {
    emit('update:modelValue', rows.value);
  }

  /** 采用外部数据（换数组 / 长度变化）：不派发 update:modelValue，避免与父层互推 */
  function adopt(next: HotRow[]) {
    const list = Array.isArray(next) ? next : [];

    ensureCheckedFields(list);

    syncing = true;
    rows.value = list;
    lastLength = list.length;
    instance.value?.loadData(list);
    syncing = false;

    refreshSummary();
    syncCheckboxHeader();
  }

  /** 组件内部替换数据（setData / clear）：需要把新数组回写给父层 */
  function replace(next: HotRow[]) {
    const list = Array.isArray(next) ? next : [];

    ensureCheckedFields(list);

    syncing = true;
    rows.value = list;
    lastLength = list.length;
    instance.value?.loadData(list);
    syncing = false;

    refreshSummary();
    syncCheckboxHeader();
    emitModel();
  }

  function isRowBlank(row: HotRow) {
    if (!row) return true;

    return (props.columns ?? []).every(column => isBlank(row[column.data]));
  }

  /* ------------------------------------------------------------------ 对外方法 */

  function getData(): HotRow[] {
    return rows.value.map(cleanRow);
  }

  function getSourceData(): HotRow[] {
    const hot = instance.value;

    if (hot && !hot.isDestroyed) return (hot.getSourceData() as HotRow[]) ?? [];

    return rows.value;
  }

  function setData(next: HotRow[]) {
    replace(next ?? []);
  }

  function addRow(row: HotRow = {}, index?: number) {
    const hot = instance.value;

    if (!hot || hot.isDestroyed) return;

    const total = hot.countRows();
    const target = Math.max(0, Math.min(index ?? total, total));

    if (total === 0) {
      hot.alter('insert_row_above', 0, 1, 'edit');
    } else if (target >= total) {
      hot.alter('insert_row_below', total - 1, 1, 'edit');
    } else {
      hot.alter('insert_row_above', target, 1, 'edit');
    }

    const visualRow = target;

    hot.batch(() => {
      for (const [field, value] of Object.entries(row)) {
        const physical = physicalColumnIndex(field);

        if (physical >= 0) hot.setDataAtCell(visualRow, hot.toVisualColumn(physical), value, 'edit');
      }

      if (checkboxEnabled.value) hot.setDataAtCell(visualRow, 0, false, 'edit');
    });

    afterRowMutation();
  }

  function removeRows(indexes: number[]) {
    const hot = instance.value;

    if (!hot || hot.isDestroyed || !indexes.length) return;

    const valid = [...new Set(indexes)].filter(index => index >= 0 && index < hot.countRows()).sort((a, b) => a - b);

    if (!valid.length) return;

    // HOT 的 alter 数组索引格式仅接受 [[index, amount], ...]，这里改用「自下而上逐个删除」保证索引有效
    hot.batch(() => {
      for (let i = valid.length - 1; i >= 0; i -= 1) {
        hot.alter('remove_row', valid[i], 1, 'edit');
      }
    });

    afterRowMutation();
  }

  function removeRow(index: number) {
    removeRows([index]);
  }

  function duplicateRow(index: number) {
    const hot = instance.value;

    if (!hot || hot.isDestroyed) return;

    const physical = hot.toPhysicalRow(index);
    const source = (hot.getSourceDataAtRow(physical) as HotRow | undefined) ?? {};

    addRow({ ...source }, index + 1);
  }

  function clear() {
    replace([]);
  }

  /** HOT 直接增删行后：补齐内部字段 + 同步计数/汇总/勾选态 + 回写父层 */
  function afterRowMutation() {
    ensureCheckedFields(rows.value);
    lastLength = rows.value.length;
    refreshSummary();
    syncCheckboxHeader();
    emitModel();
    emitCheckChange();
  }

  /* ---------- 校验 ---------- */

  function focusError(error: HotError) {
    const hot = instance.value;

    if (!hot || hot.isDestroyed) return;

    const visualRow = hot.toVisualRow(error.rowIndex);

    hot.selectCell(visualRow, error.colIndex, undefined, undefined, true);
  }

  function validate(validateOptions?: { scrollToFirst?: boolean }): HotValidationResult {
    const hot = instance.value;
    const errors: HotError[] = [];
    const list = rows.value;

    for (let rowIndex = 0; rowIndex < list.length; rowIndex += 1) {
      const row = list[rowIndex] ?? {};

      if (isRowBlank(row)) continue;

      for (const [field, rules] of rulesByField.value) {
        const title = columnMap.value.get(field)?.title ?? field;
        const result = runRules(rules, row[field], row, rowIndex, title);

        if (result !== true) {
          const physical = physicalColumnIndex(field);

          errors.push({
            rowIndex,
            field,
            title,
            message: result,
            colIndex: hot && !hot.isDestroyed && physical >= 0 ? hot.toVisualColumn(physical) : physical
          });
        }
      }
    }

    // 交给 HOT 统一打高亮（validator 与上面同源，行规则同样按行判定）
    if (hot && !hot.isDestroyed) {
      hot.validateCells();

      if (errors.length && validateOptions?.scrollToFirst !== false) focusError(errors[0]);
    }

    if (errors.length) emit('validation-failed', errors);

    return { valid: errors.length === 0, errors };
  }

  function clearValidation() {
    const hot = instance.value;

    if (!hot || hot.isDestroyed) return;

    hot.batch(() => {
      for (let row = 0; row < hot.countRows(); row += 1) {
        for (let col = 0; col < hot.countCols(); col += 1) {
          hot.setCellMeta(row, col, 'valid', true);
        }
      }

      hot.render();
    });
  }

  function errorsToText(errors: HotError[]) {
    return errors.map(error => error.message).join('\n');
  }

  /* ---------- 行勾选 ---------- */

  function getCheckedRows() {
    return rows.value.filter(isCheckedRow).map(cleanRow);
  }

  function getCheckedIndexes() {
    return computeCheckedState().indexes;
  }

  function setAllChecked(checked: boolean) {
    const hot = instance.value;

    if (!hot || hot.isDestroyed || !checkboxEnabled.value) return;

    hot.batch(() => {
      for (let row = 0; row < hot.countRows(); row += 1) {
        hot.setDataAtCell(row, 0, checked, 'edit');
      }
    });

    syncCheckboxHeader();
    emitCheckChange();
  }

  function clearChecked() {
    setAllChecked(false);
  }

  function removeCheckedRows() {
    removeRows(getCheckedIndexes());
  }

  /* ---------- 视图与操作 ---------- */

  function undo() {
    const hot = instance.value;

    if (!hot || hot.isDestroyed || !props.undoRedo) return;

    hot.getPlugin('undoRedo').undo();
  }

  function redo() {
    const hot = instance.value;

    if (!hot || hot.isDestroyed || !props.undoRedo) return;

    hot.getPlugin('undoRedo').redo();
  }

  function search(keyword: string) {
    const hot = instance.value;

    if (!hot || hot.isDestroyed || !props.search) return 0;

    const plugin = hot.getPlugin('search') as Search | undefined;

    if (!plugin || typeof plugin.query !== 'function') return 0;

    let hits = 0;

    plugin.query(keyword ?? '', (_instance, _row, _col, _data, testResult) => {
      if (testResult) hits += 1;
    });

    return hits;
  }

  function clearSearch() {
    const hot = instance.value;

    if (!hot || hot.isDestroyed || !props.search) return;

    (hot.getPlugin('search') as Search | undefined)?.query('');
  }

  function scrollToRow(index: number) {
    const hot = instance.value;

    if (!hot || hot.isDestroyed) return;

    hot.scrollViewportTo({ row: hot.toVisualRow(index), verticalSnap: 'top' });
  }

  function scrollToCell(position: { row: number; col: number }) {
    const hot = instance.value;

    if (!hot || hot.isDestroyed) return;

    hot.selectCell(position.row, position.col, position.row, position.col, true);
  }

  function mergeSelection() {
    const hot = instance.value;

    if (!hot || hot.isDestroyed) return;

    (hot.getPlugin('mergeCells') as MergeCells | undefined)?.mergeSelection();
  }

  function unmergeSelection() {
    const hot = instance.value;

    if (!hot || hot.isDestroyed) return;

    (hot.getPlugin('mergeCells') as MergeCells | undefined)?.unmergeSelection();
  }

  function getColumnIndex(field: string) {
    const hot = instance.value;
    const physical = physicalColumnIndex(field);

    if (physical < 0) return -1;
    if (!hot || hot.isDestroyed) return physical;

    return hot.toVisualColumn(physical);
  }

  function getHotInstance() {
    return instance.value;
  }

  /* ------------------------------------------------------------------ 汇总条 */

  const summary = useHotSummary({
    getInstance: () => instance.value,
    getContainer: () => containerRef.value,
    getRows: () => rows.value,
    getColumns: () => props.columns ?? [],
    getSummaries: () => props.summaries ?? [],
    hasCheckboxColumn: () => checkboxEnabled.value,
    getLeadText: () => $t('handsontable.summaryLead')
  });

  /* ------------------------------------------------------------------ 生命周期与钩子 */

  function handleAfterChange(changes: CellChange[] | null, source: ChangeSource) {
    if (syncing) return;

    lastLength = rows.value.length;

    if (source === 'loadData' || !changes?.length) return;

    emitModel();
    emit('change', changes, source);
    refreshSummary();

    const touchedCheckbox = changes.some(([, prop]) => prop === checkboxKey.value);

    if (touchedCheckbox) {
      syncCheckboxHeader();
      emitCheckChange();
    }

    const touchedValidatedField = changes.some(
      ([, prop]) => typeof prop === 'string' && changeTriggerFields.value.has(prop)
    );

    if (touchedValidatedField) instance.value?.validateCells();
  }

  function handleGetColHeader(column: number, TH: HTMLTableHeaderCellElement, headerLevel: number) {
    const hot = instance.value;

    if (!hot || hot.isDestroyed || !checkboxEnabled.value || headerLevel !== 0) return;

    const isCheckboxColumn = hot.toPhysicalColumn(column) === 0;
    const existed = TH.querySelector(`.${HEAD_CHECKBOX_CLASS}`);

    if (!isCheckboxColumn) {
      existed?.remove();
      return;
    }

    if (existed) return;

    const box = document.createElement('input');

    box.type = 'checkbox';
    box.className = HEAD_CHECKBOX_CLASS;
    box.addEventListener('click', event => event.stopPropagation());
    box.addEventListener('mousedown', event => event.stopPropagation());
    box.addEventListener('change', () => setAllChecked(box.checked));

    TH.textContent = '';
    TH.appendChild(box);
  }

  function handleRender() {
    syncCheckboxHeader();
  }

  function handleViewChange() {
    refreshSummary();
  }

  function registerHooks(hot: HotInstance) {
    hot.addHook('afterChange', handleAfterChange);
    hot.addHook('afterGetColHeader', handleGetColHeader);
    hot.addHook('afterRender', handleRender);
    hot.addHook('afterCreateRow', afterRowMutation);
    hot.addHook('afterRemoveRow', afterRowMutation);
    hot.addHook('afterColumnResize', handleViewChange);
    hot.addHook('afterColumnMove', handleViewChange);
  }

  onMounted(() => {
    const container = containerRef.value;

    if (!container) return;

    setupOnce();
    adopt(props.modelValue ?? []);

    const hot = new Handsontable(container, createSettings(true));

    instance.value = hot;
    registerHooks(hot);
    hot.render();

    summary.bind();
    refreshSummary();
    syncCheckboxHeader();

    emit('ready', hot);
  });

  /** 外部换数组 / 长度变化 → 重新加载数据 */
  watch(
    () => [props.modelValue, props.modelValue?.length] as const,
    () => {
      if (syncing) return;

      const next = props.modelValue;

      if (!Array.isArray(next)) return;
      if (next === rows.value && next.length === lastLength) return;

      adopt(next);
    }
  );

  /** 结构性配置变化（列、表头、交互开关等）→ updateSettings（不含 data，避免重载数据） */
  watch(
    () =>
      JSON.stringify({
        columns: props.columns,
        colHeaders: props.colHeaders,
        nestedHeaders: props.nestedHeaders,
        rowHeaders: props.rowHeaders,
        rowCheckbox: props.rowCheckbox,
        rowCheckboxWidth: props.rowCheckboxWidth,
        rowCheckboxKey: props.rowCheckboxKey,
        readOnly: props.readOnly,
        height: props.height,
        mergeCells: props.mergeCells,
        contextMenu: props.contextMenu,
        copyPaste: props.copyPaste,
        undoRedo: props.undoRedo,
        columnSorting: props.columnSorting,
        filters: props.filters,
        search: props.search,
        manualColumnResize: props.manualColumnResize,
        manualRowResize: props.manualRowResize,
        manualColumnMove: props.manualColumnMove,
        manualRowMove: props.manualRowMove,
        fixedRowsTop: props.fixedRowsTop,
        fixedColumnsLeft: props.fixedColumnsLeft,
        fixedRowsBottom: props.fixedRowsBottom,
        minSpareRows: props.minSpareRows,
        placeholder: props.placeholder,
        stretchH: props.stretchH,
        highlightInvalid: props.highlightInvalid,
        settings: props.settings
      }),
    () => {
      const hot = instance.value;

      if (!hot || hot.isDestroyed) return;

      hot.updateSettings(createSettings(false));
      refreshSummary();
      syncCheckboxHeader();
    }
  );

  /** 暗色模式 → 主题配色 */
  watch(colorScheme, value => {
    const hot = instance.value;

    if (!hot || hot.isDestroyed) return;

    hot.updateSettings({ colorScheme: value });
  });

  /** 密度 */
  watch(
    () => props.density,
    value => {
      const hot = instance.value;

      if (!hot || hot.isDestroyed) return;

      hot.updateSettings({ density: value });
    }
  );

  /** 主题切换 */
  watch(
    () => props.themeName,
    () => {
      const hot = instance.value;

      if (!hot || hot.isDestroyed) return;

      hot.updateSettings({ theme: resolveTheme() });
    }
  );

  /** 语言 */
  watch(language, value => {
    const hot = instance.value;

    if (!hot || hot.isDestroyed) return;

    hot.updateSettings({ language: value });
  });

  /** 汇总配置变化 */
  watch(
    () => props.summaries,
    () => refreshSummary(),
    { deep: true }
  );

  onBeforeUnmount(() => {
    summary.unbind();

    const hot = instance.value;

    if (hot && !hot.isDestroyed) hot.destroy();

    instance.value = null;
  });

  return {
    containerRef,
    instance,
    /** 当前数据源（与 HOT 源数据同引用） */
    rows,
    checkboxKey,
    /** 汇总条（模板 ref 与渲染数据） */
    summary,
    api: {
      getData,
      getSourceData,
      setData,
      addRow,
      removeRow,
      removeRows,
      duplicateRow,
      clear,
      validate,
      clearValidation,
      errorsToText,
      getCheckedRows,
      getCheckedIndexes,
      setAllChecked,
      clearChecked,
      removeCheckedRows,
      undo,
      redo,
      search,
      clearSearch,
      scrollToRow,
      scrollToCell,
      mergeSelection,
      unmergeSelection,
      getColumnIndex,
      getHotInstance
    }
  };
}
