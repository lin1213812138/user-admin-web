/** 字段取值方式：field=按 key 从行数据取值，fixed=所有行写同一个固定值 */
export type ExportValueMode = 'field' | 'fixed';

/** 单个可导出的字段 */
export interface ExportField {
  key: string;
  title: string;
  /** 自定义取值格式化；缺省时按 sourceType 走内置格式化，最后退化 row[key] 原样字符串化 */
  formatter?: (value: unknown, row: Record<string, unknown>) => string | number;
  /** 由表格列推导时携带的列类型，用于默认取值方式（如 status 导出为启用/禁用） */
  sourceType?: 'status' | 'detail';
  /** sourceType='status' 时视为「启用」的值，默认 1 */
  activeValue?: string | number;
  /** 取值方式：缺省（或 field）按 key 取数据；fixed 则所有行写 fixedValue */
  valueMode?: ExportValueMode;
  /** valueMode='fixed' 时写入每行的固定文本 */
  fixedValue?: string;
}

/** 可作为导出字段来源的表格列的最小结构（渲染列 / 列配置均可满足） */
export interface ExportColumnSource {
  key: string;
  title: string;
  type?: 'status' | 'detail';
  activeValue?: string | number;
}

/** 将列配置转换成导出行取值字段（保留 status 等内置列的格式化信息） */
export function toExportFields(list: ExportColumnSource[]): ExportField[] {
  return list.map(col => ({
    key: col.key,
    title: col.title,
    sourceType: col.type,
    activeValue: col.activeValue
  }));
}

/** 导出数据范围：all=全部数据，page=当前页，checked=勾选的数据 */
export type ExportScope = 'all' | 'page' | 'checked';

/** 范围选项（弹窗渲染用）：disabled 时灰显，hint 说明不可用的原因 */
export interface ExportScopeOption {
  value: ExportScope;
  label: string;
  disabled: boolean;
  /** 禁用时展示的原因说明（挂在 title 上悬浮可见） */
  hint?: string;
}

/** 字段弹窗确认回传：数据范围（未启用范围区时为 null）+ 勾选且排序后的字段 */
export interface ExportConfirmPayload {
  scope: ExportScope | null;
  fields: ExportField[];
}
