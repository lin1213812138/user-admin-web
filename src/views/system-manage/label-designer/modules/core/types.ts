/** 元素类型 */
export type ElementType = 'text' | 'longText' | 'image' | 'barcode' | 'qrcode' | 'rect' | 'hline' | 'vline';

/** 新建元素时的初始种子（样例值 / 绑定字段 / 测试数据 / 字段标题） */
export interface ElementSeed {
  sample?: string;
  field?: string;
  testData?: string;
  /** 字段标题：有值时预填「标题名称」；是否开启关联标题由 showTitle 决定 */
  title?: string;
  /** 是否开启关联标题：与 title 同时为真才生效，缺省 false */
  showTitle?: boolean;
}

/** 左侧基础元素定义 */
export interface BasicElementDef {
  type: ElementType;
  labelKey: App.I18n.I18nKey;
  defaultOptions: ElementSeed;
}

export type ElementDescriptor = BasicElementDef;

/** 边框样式能力（文本 / 条码 / 二维码可选显示边框，默认关） */
interface BorderExtras {
  /** 是否显示边框（属性面板「显示边框」开关） */
  showBorder?: boolean;
  borderWidth?: number;
  borderColor?: string;
}

/** 数据语义字段（文本 / 条码 / 二维码共用的「数据预览」能力） */
interface DataPreviewExtras extends BorderExtras {
  /** 标题名称：显示在内容上方的标题文字 */
  title?: string;
  /** 是否显示标题（属性面板「关联标题」开关，默认关） */
  showTitle?: boolean;
  /** 占位文本：元素无内容时显示的文字 */
  placeholder?: string;
  /** 标题样式（未配置时渲染层回退默认值） */
  titleFontSize?: number;
  titleColor?: string;
  titleFontWeight?: 'normal' | 'bold';
}

/** 文本类元素配置 */
export interface TextOptions extends DataPreviewExtras {
  text: string;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  /** 水平对齐（CSS text-align） */
  align: 'left' | 'center' | 'right';
  /** 垂直对齐（内容在元素框内的纵向定位），缺省 top */
  verticalAlign?: 'top' | 'middle' | 'bottom';
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
export interface BarcodeOptions extends DataPreviewExtras {
  symbology: string;
  displayValue: boolean;
  fontSize: number;
  /** 编码值与条码的间距（pt，正数下移，缺省紧贴） */
  textGap?: number;
  /** 编码值（无字段绑定时使用） */
  value?: string;
  field?: string;
  testData?: string;
}

/** 二维码元素配置 */
export interface QrcodeOptions extends DataPreviewExtras {
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

/** 标签模板（可序列化存入 designJson）；unit 标记元素几何单位，缺省视为 mm（旧数据），加载时自动迁移为 pt */
export interface LabelTemplate {
  paperSize: string;
  unit?: 'mm' | 'pt';
  elements: LabelElement[];
}
