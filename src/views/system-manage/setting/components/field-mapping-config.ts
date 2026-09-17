/** 字段映射中的单个可勾选项 */
export interface FieldMappingField {
  /** 字段标识，作为 modelValue 中存储与比对的值，组内唯一 */
  key: string;
  /** 展示文案 */
  label: string;
  /** 24 栅格宽度（1..24），同 FormItemConfig.span；缺省 6（一行 4 个） */
  span?: number;
  /** 锁定字段：显示态不可取消（用于客户端固定字段），必填仍可切换 */
  disabled?: boolean;
}

/** 字段映射分组 */
export interface FieldMappingGroup {
  /** 分组标识，同时作为 modelValue 的键 */
  key: string;
  /** 分组标题 */
  title: string;
  fields: FieldMappingField[];
}

/** 某个分组下的字段映射：显示 / 必填两个维度各自独立存储 */
export interface FieldMappingValue {
  /** 显示该字段的 key 列表 */
  show: string[];
  /** 设为必填的字段 key 列表 */
  required: string[];
}
