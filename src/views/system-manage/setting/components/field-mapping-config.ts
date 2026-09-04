/** 字段映射中的单个可勾选项 */
export interface FieldMappingField {
  /** 字段标识，作为 modelValue 中存储与比对的值，组内唯一 */
  key: string;
  /** 展示文案 */
  label: string;
  /** 24 栅格宽度（1..24），同 FormItemConfig.span；缺省 8 */
  span?: number;
}

/** 字段映射分组 */
export interface FieldMappingGroup {
  /** 分组标识，同时作为 modelValue 的键 */
  key: string;
  /** 分组标题 */
  title: string;
  fields: FieldMappingField[];
}
