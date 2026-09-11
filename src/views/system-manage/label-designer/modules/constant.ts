/** 逻辑单位统一 mm；屏幕 96dpi 下 1mm ≈ 3.7795px */
export const PX_PER_MM = 96 / 25.4;

/** 预设纸张尺寸（格式 W×Hmm） */
export const PAPER_SIZES = ['100×150mm', '80×80mm', '70×50mm', '60×40mm', '50×30mm', 'A4(210×297mm)', '自定义'];

interface PaperSize {
  w: number;
  h: number;
}

/** 解析纸张尺寸字符串，返回 mm 宽高，失败回退 100×150 */
export function parsePaper(paper: string): PaperSize {
  const m = paper.match(/(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*mm/i);
  if (m) return { w: parseFloat(m[1]), h: parseFloat(m[2]) };
  const a4 = paper.match(/a4/i);
  if (a4) return { w: 210, h: 297 };
  return { w: 100, h: 150 };
}
