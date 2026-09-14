import type { BasicElementDef } from './types';

/**
 * 图片元素默认示例：内嵌 SVG 占位图（虚线框 + 山形/圆点，纯 ASCII 无需 URL 编码），
 * 拖出即有可见内容、可随时替换为真实图片地址（与条码 / 二维码带示例值的口径一致）。
 */
const IMAGE_PLACEHOLDER_SRC = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect x='1' y='1' width='118' height='118' fill='none' stroke='%23d9d9d9' stroke-width='2' stroke-dasharray='6 4'/><circle cx='42' cy='40' r='7' fill='%23cccccc'/><path d='M20 92 L48 62 L68 82 L86 64 L100 92' fill='none' stroke='%23cccccc' stroke-width='3'/></svg>`;

/** 左侧基础元素（拖入画布时按 type 创建默认元素） */
export const basicElements: BasicElementDef[] = [
  { type: 'text', labelKey: 'page.manage.labelDesign.basicText', defaultOptions: { sample: '文本示例' } },
  {
    type: 'longText',
    labelKey: 'page.manage.labelDesign.basicLongText',
    defaultOptions: { sample: '长文本示例，可输入多行内容' }
  },
  { type: 'image', labelKey: 'page.manage.labelDesign.basicImage', defaultOptions: { sample: IMAGE_PLACEHOLDER_SRC } },
  { type: 'barcode', labelKey: 'page.manage.labelDesign.basicBarcode', defaultOptions: { sample: '123456' } },
  {
    type: 'qrcode',
    labelKey: 'page.manage.labelDesign.basicQrcode',
    defaultOptions: { sample: 'https://example.com' }
  },
  { type: 'rect', labelKey: 'page.manage.labelDesign.basicRect', defaultOptions: {} },
  { type: 'hline', labelKey: 'page.manage.labelDesign.basicHline', defaultOptions: {} },
  { type: 'vline', labelKey: 'page.manage.labelDesign.basicVline', defaultOptions: {} }
];
