/**
 * 打印格式标签尺寸映射（与 wms-user `lib/services/print-template.js` 的 sizeMap 对齐）。
 * 尺寸单位统一为 mm；sizeType=5 为自定义，取 width/height。
 * 使用方：打印格式列表/表单、自研标签设计器（label-designer）、hiprint 打印设计（print-design）。
 */

/** 后端固定档位尺寸表（sizeType 0-4） */
const SIZE_TYPE_DIMENSIONS: Record<number, { w: number; h: number }> = {
  0: { w: 50, h: 30 },
  1: { w: 100, h: 100 },
  2: { w: 100, h: 150 },
  3: { w: 100, h: 200 },
  4: { w: 210, h: 297 }
};

/** 标签尺寸下拉选项（尺寸文案与后端固定档位一致，「自定义」时由表单追加宽高输入） */
export const SIZE_TYPE_OPTIONS: { label: string; value: Api.PrintFormat.SizeType }[] = [
  { label: '50×30mm', value: 0 },
  { label: '100×100mm', value: 1 },
  { label: '100×150mm', value: 2 },
  { label: '100×200mm', value: 3 },
  { label: 'A4(210×297mm)', value: 4 },
  { label: '自定义', value: 5 }
];

/** sizeType → 实际尺寸（0-4 查固定表；5 用自定义宽高，缺省回退 100×150） */
export function sizeTypeToDimensions(sizeType: number, width?: number, height?: number): { w: number; h: number } {
  const fixed = SIZE_TYPE_DIMENSIONS[sizeType];
  if (fixed) return { ...fixed };
  return { w: width ?? 100, h: height ?? 150 };
}

/** 实际尺寸 → sizeType（命中固定档位返回 0-4，否则 5 + 自定义宽高） */
export function dimensionsToSizeType(
  w: number,
  h: number
): { sizeType: Api.PrintFormat.SizeType; width?: number; height?: number } {
  const hit = Object.keys(SIZE_TYPE_DIMENSIONS).find(key => {
    const dim = SIZE_TYPE_DIMENSIONS[Number(key)];
    return dim.w === w && dim.h === h;
  });
  if (hit) return { sizeType: Number(hit) as Api.PrintFormat.SizeType };
  return { sizeType: 5, width: w, height: h };
}

/** 标签尺寸展示文案（固定档位用下拉文案，自定义用 宽×高mm） */
export function sizeTypeLabel(sizeType: number, width?: number, height?: number): string {
  const option = SIZE_TYPE_OPTIONS.find(item => item.value === sizeType);
  if (option && sizeType !== 5) return option.label;
  const { w, h } = sizeTypeToDimensions(sizeType, width, height);
  return `${w}×${h}mm`;
}
