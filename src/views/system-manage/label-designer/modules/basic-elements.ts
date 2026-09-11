import type { BasicElementDef } from './types';

/** 左侧基础元素（拖入画布时按 type 创建默认元素） */
export const basicElements: BasicElementDef[] = [
  { type: 'text', labelKey: 'page.manage.labelDesign.basicText', defaultOptions: { sample: '' } },
  { type: 'longText', labelKey: 'page.manage.labelDesign.basicLongText', defaultOptions: { sample: '' } },
  { type: 'image', labelKey: 'page.manage.labelDesign.basicImage', defaultOptions: { sample: '' } },
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
