/** 元素类型 */
export type ElementType = 'text' | 'longText' | 'image' | 'barcode' | 'qrcode' | 'rect' | 'hline' | 'vline';

/** 新建元素时的初始种子（样例值 / 绑定字段 / 测试数据） */
export interface ElementSeed {
  sample?: string;
  field?: string;
  testData?: string;
}

/** 左侧基础元素定义 */
export interface BasicElementDef {
  type: ElementType;
  labelKey: App.I18n.I18nKey;
  defaultOptions: ElementSeed;
}

export type ElementDescriptor = BasicElementDef;

/** 文本类元素配置 */
export interface TextOptions {
  text: string;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  field?: string;
  testData?: string;
}

/** 图片元素配置 */
export interface ImageOptions {
  src: string;
  field?: string;
  testData?: string;
}

/** 条码元素配置 */
export interface BarcodeOptions {
  symbology: string;
  displayValue: boolean;
  fontSize: number;
  /** 编码值（无字段绑定时使用） */
  value?: string;
  field?: string;
  testData?: string;
}

/** 二维码元素配置 */
export interface QrcodeOptions {
  ecc: 'L' | 'M' | 'Q' | 'H';
  /** 编码值（无字段绑定时使用） */
  value?: string;
  field?: string;
  testData?: string;
}

/** 矩形元素配置 */
export interface RectOptions {
  borderWidth: number;
  borderColor: string;
  bgColor: string;
  radius: number;
}

/** 线条元素配置（hline / vline） */
export interface LineOptions {
  borderWidth: number;
  borderColor: string;
}

export type ElementOptions = TextOptions | ImageOptions | BarcodeOptions | QrcodeOptions | RectOptions | LineOptions;

/** 画布上的单个元素 */
export interface LabelElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  options: ElementOptions;
}

/** 标签模板（可序列化存入 designJson） */
export interface LabelTemplate {
  paperSize: string;
  elements: LabelElement[];
}
