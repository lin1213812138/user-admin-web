import { sizeTypeToDimensions } from '@/service/api/print-format/size-map';

export interface PaperOption {
  label: string;
  /** 纸张宽（mm） */
  width: number;
  /** 纸张高（mm） */
  height: number;
}

export const paperOptions: PaperOption[] = [
  { label: '100×150mm', width: 100, height: 150 },
  { label: '100×100mm', width: 100, height: 100 },
  { label: '80×60mm', width: 80, height: 60 },
  { label: '76×130mm', width: 76, height: 130 },
  { label: 'A4', width: 210, height: 297 }
];

/**
 * 把 labelSize / paperSize 字符串解析为纸张尺寸：
 * 优先精确匹配下拉项，其次 W×Hmm / A4 文案，未命中回退 100×150mm。
 * （后端固定档位 50×30mm / 100×200mm 等不在下拉项里，靠正则分支兜底，避免误回退成 100×150）
 */
export function parseLabelSize(size: string): PaperOption {
  const matched = paperOptions.find(item => item.label === size);
  if (matched) return matched;

  const m = size.match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*mm/i);
  if (m) return { label: size, width: parseFloat(m[1]), height: parseFloat(m[2]) };
  if (/a4/i.test(size)) return { label: 'A4', width: 210, height: 297 };

  return paperOptions[0];
}

/** 后端标签尺寸（sizeType + 自定义宽高，mm）→ 设计器纸张字符串（A4 用下拉项 'A4'，其余 W×Hmm） */
export function paperOfSizeType(sizeType: number, width?: number, height?: number): string {
  const { w, h } = sizeTypeToDimensions(sizeType, width, height);
  if (w === 210 && h === 297) return 'A4';
  return `${w}×${h}mm`;
}
