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

/** 把 labelSize / paperSize 字符串解析为纸张尺寸，未命中时回退 100×150mm */
export function parseLabelSize(size: string): PaperOption {
  return paperOptions.find(item => item.label === size) ?? paperOptions[0];
}
