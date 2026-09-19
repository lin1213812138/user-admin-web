/**
 * 打印格式模板类型映射（对齐后端 templateType 6 类）。
 * 使用方：打印格式列表（表格列 / 搜索筛选）与新增/复制抽屉。
 */

/** 模板类型下拉 / 筛选选项 */
export const TEMPLATE_TYPE_OPTIONS: { label: string; value: Api.PrintFormat.TemplateType }[] = [
  { label: '收货标签', value: 0 },
  { label: '发货标签', value: 1 },
  { label: '派送标签', value: 2 },
  { label: '发货发票', value: 3 },
  { label: '派送发票', value: 4 },
  { label: '提单标签', value: 5 }
];

/** 模板类型名（表格列展示用） */
export function templateTypeLabel(value: number) {
  return TEMPLATE_TYPE_OPTIONS.find(item => item.value === value)?.label ?? '';
}
