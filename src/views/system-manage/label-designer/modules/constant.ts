import type { ElementType } from './types';

/** 纸张逻辑单位 mm；屏幕 96dpi 下 1mm ≈ 3.7795px */
export const PX_PER_MM = 96 / 25.4;
/** 元素几何逻辑单位统一 pt；屏幕 96dpi 下 1pt ≈ 1.3333px */
export const PX_PER_PT = 96 / 72;
/** mm → pt 换算系数（1mm = 72/25.4 pt ≈ 2.8346），旧模板几何迁移用 */
export const PT_PER_MM = 72 / 25.4;

/** mm 数值转 pt（保持物理尺寸不变） */
export function mmToPt(v: number): number {
  return v * PT_PER_MM;
}

/** 预设纸张尺寸（格式 W×Hmm） */
export const PAPER_SIZES = [
  '100×150mm',
  '80×80mm',
  '70×50mm',
  '60×40mm',
  '50×30mm',
  '235×235mm',
  'A4(210×297mm)',
  '自定义'
];

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

/** 业务字段定义（左侧字段面板与属性面板共用） */
export interface FieldDef {
  key: string;
  label: string;
  /** 字段标题：拖入画布时预填为元素「标题名称」；label 仅作列表显示名，不会带上画布 */
  title?: string;
  /** 拖到画布时直接作为「文本」显示的示例值 */
  sample?: string;
  /** 拖入画布时创建的元素类型，缺省 text；设置什么类型就创建什么类型 */
  elementType?: ElementType;
  /** 拖入画布时是否显示标题：title 非空时才生效，缺省 false */
  showTitle?: boolean;
}

/** 默认业务字段清单（elementType 按字段语义设置，可随时调整） */
export const BUSINESS_FIELDS: FieldDef[] = [
  {
    key: 'orderNo',
    label: '单号',
    title: '单号',
    sample: 'OO202609120246541534',
    elementType: 'text',
    showTitle: true
  },
  {
    key: 'orderNoCode',
    label: '单号（条形码）',
    title: '单号（条形码）',
    sample: 'OO202609120246541534',
    elementType: 'barcode',
    showTitle: false
  },
  { key: 'sku', label: 'SKU', title: 'SKU', sample: 'SKU-882910', elementType: 'text' },
  { key: 'goodsName', label: '商品名称', title: '商品名称', sample: '无线蓝牙耳机', elementType: 'longText' },
  { key: 'qty', label: '数量', title: '数量', sample: '100', elementType: 'text' },
  { key: 'batch', label: '批次', title: '批次', sample: 'B20260907', elementType: 'text' },
  { key: 'warehouse', label: '仓库', title: '仓库', sample: '上海仓', elementType: 'text' },
  { key: 'date', label: '日期', title: '日期', sample: '2026-09-07', elementType: 'text' }
];

/** 按字段 key 取中文名称，未定义时返回空串 */
export function getFieldLabel(fieldKey: string): string {
  return BUSINESS_FIELDS.find(f => f.key === fieldKey)?.label ?? '';
}
