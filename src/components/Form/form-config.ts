import type { SelectOption } from 'naive-ui';

/** 表单支持的控件类型 */
export type FormItemType = 'input' | 'textarea' | 'number' | 'switch' | 'select' | 'icon-picker' | 'checkbox';

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
  /** 禁用该项 */
  disabled?: boolean;
}
