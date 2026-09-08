export interface BasicElement {
  /** hiprint 默认 provider 注册的元素 tid */
  tid: string;
  /** 展示文案的 i18n key */
  labelKey: App.I18n.I18nKey;
}

/** 左侧面板的基础元素（tid 与 defaultElementTypeProvider 保持一致） */
export const basicElements: BasicElement[] = [
  { tid: 'defaultModule.text', labelKey: 'page.manage.printDesign.basicText' },
  { tid: 'defaultModule.longText', labelKey: 'page.manage.printDesign.basicLongText' },
  { tid: 'defaultModule.image', labelKey: 'page.manage.printDesign.basicImage' },
  { tid: 'defaultModule.barcode', labelKey: 'page.manage.printDesign.basicBarcode' },
  { tid: 'defaultModule.qrcode', labelKey: 'page.manage.printDesign.basicQrcode' },
  { tid: 'defaultModule.table', labelKey: 'page.manage.printDesign.basicTable' },
  { tid: 'defaultModule.hline', labelKey: 'page.manage.printDesign.basicHline' },
  { tid: 'defaultModule.vline', labelKey: 'page.manage.printDesign.basicVline' },
  { tid: 'defaultModule.rect', labelKey: 'page.manage.printDesign.basicRect' }
];
