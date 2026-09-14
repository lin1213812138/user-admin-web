import type { SelectOption } from 'naive-ui';

/** 表单支持的控件类型 */
export type FormItemType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'switch'
  | 'select'
  | 'color'
  | 'icon-picker'
  | 'checkbox'
  | 'date'
  | 'password'
  | 'file'
  | 'image'
  | 'section'
  | 'custom';

/** 单个表单项配置，驱动 FormWrap 自动渲染 */
export interface FormItemConfig {
  /** 字段名，对应 model[key] */
  key: string;
  /** 表单项标签 */
  label: string;
  /** 控件类型 */
  type?: FormItemType;
  /** 24 栅格系统中占用的栅格数（1..24），默认 24 表示整行 */
  span?: number | string;
  /** 是否必填，勾选后自动生成必填校验规则 */
  required?: boolean;
  /** 必填校验提示文案 */
  requiredMsg?: string;
  /** 占位提示文案 */
  placeholder?: string;
  /** 下拉选项（type 为 select 时使用） */
  options?: SelectOption[];
  /** 开关选中时文案 */
  checkedText?: string;
  /** 开关未选中时文案 */
  uncheckedText?: string;
  /** 开关选中时的值 */
  checkedValue?: string | number | boolean;
  /** 开关未选中时的值 */
  uncheckedValue?: string | number | boolean;
  /** 使用具名插槽自定义渲染内容，插槽名为 key */
  slot?: string;
  /** 是否渲染 label 行（透传 NFormItem 的 show-label）：label 为空的 custom 项需显式 false，否则会留一行空 label 高度 */
  showLabel?: boolean;
  /** 禁用该项 */
  disabled?: boolean;
  /** 表单项是否清空 */
  clearable?: boolean;
  /** 下拉是否可输入搜索（type 为 select 时使用），默认 true；个别下拉不需要搜索框时显式传 false */
  filterable?: boolean;
}
