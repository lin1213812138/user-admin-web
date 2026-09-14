import { mmToPt, parsePaper } from './constant';
import type { ElementOptions, ElementType, LabelElement, LabelTemplate } from './types';

/**
 * 目标存储格式（designJson / 导出文件统一格式）：
 * 顶层 { unit: 'pt', paper: { width, height, unit: 'mm' }, elements }
 * 元素 = { id, type, key, label, x, y, width, height, style, options }
 * - 内部模板几何自 2026-09-12 起即以 pt 存储（LabelTemplate.unit: 'pt'），与目标格式坐标单位一致，序列化直传不换算
 * - paper 恒为 mm；key/label/hideLabel/style 为目标格式字段
 * - options 为本项目原生字段兼容层（回读优先，无损还原画布全部能力）
 */

/** 目标格式 style 字段集（各类型按需取子集） */
export interface ExportStyle {
  rotation?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  verticalAlign?: string;
  textDecoration?: string;
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: string;
  borderRadius?: number;
  placeholder?: string;
  hideLabel?: boolean;
  wordWrap?: boolean;
  barcodeType?: string;
  showBarcodeText?: boolean;
  ecc?: string;
  src?: string;
  lineStyle?: string;
}

export interface ExportElement {
  id: string;
  type: ElementType;
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: ExportStyle;
  /** 原生字段兼容层：本项目存入时保留完整 options，回读优先消费 */
  options?: ElementOptions;
}

export interface ExportTemplate {
  unit: 'pt';
  paper: { width: number; height: number; unit: 'mm' };
  elements: ExportElement[];
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function num(v: unknown, d: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : d;
}

function pickAlign(v: unknown): 'left' | 'center' | 'right' {
  return v === 'center' || v === 'right' ? v : 'left';
}

function pickVAlign(v: unknown): 'top' | 'middle' | 'bottom' {
  return v === 'middle' || v === 'bottom' ? v : 'top';
}

/** id 兜底生成（外部数据可能缺 id；与 store 内 uid 同规则） */
function genId(): string {
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 每类型 options → 目标格式 style（目标缺省字段按目标系统示例填默认值） */
function buildStyle(el: LabelElement): ExportStyle {
  const o = el.options as unknown as Record<string, unknown>;
  const base = { rotation: 0, opacity: 1 };
  const border = {
    borderWidth: o.showBorder === true ? num(o.borderWidth, 1) : 0,
    borderColor: str(o.borderColor) || '#000000',
    borderStyle: 'solid',
    borderRadius: 0
  };
  const textLike = {
    fontSize: num(o.fontSize, 8),
    fontFamily: str(o.fontFamily) || 'Microsoft YaHei',
    fontWeight: str(o.fontWeight) || 'normal',
    fontStyle: 'normal',
    textAlign: str(o.align) || 'left',
    verticalAlign: str(o.verticalAlign) || 'top',
    color: str(o.color) || '#000000',
    backgroundColor: 'transparent',
    textDecoration: 'none',
    letterSpacing: 0,
    lineHeight: num(o.lineHeight, 1.2),
    hideLabel: o.showTitle !== true
  };
  switch (el.type) {
    case 'text':
    case 'longText':
      return { ...base, ...textLike, placeholder: str(o.text), ...border, wordWrap: el.type === 'longText' };
    case 'barcode':
      return {
        ...base,
        ...textLike,
        backgroundColor: '#ffffff',
        barcodeType: str(o.symbology) || 'code128',
        showBarcodeText: o.displayValue !== false,
        placeholder: str(o.value),
        ...border
      };
    case 'qrcode':
      return {
        ...base,
        ...textLike,
        backgroundColor: '#ffffff',
        ecc: str(o.ecc) || 'M',
        placeholder: str(o.value),
        ...border
      };
    case 'image':
      return { ...base, src: str(o.src), placeholder: '' };
    case 'rect':
      return {
        ...base,
        borderWidth: num(o.borderWidth, 1),
        borderColor: str(o.borderColor) || '#000000',
        borderStyle: 'solid',
        borderRadius: num(o.radius, 0),
        backgroundColor: str(o.bgColor) || 'transparent'
      };
    case 'hline':
    case 'vline':
      return {
        ...base,
        color: str(o.borderColor) || '#000000',
        ...(el.type === 'vline' ? { lineStyle: 'solid' } : {})
      };
  }
}

/** 内部模板（pt 几何）→ 目标存储格式（几何直传 + options 兼容层原样保留） */
export function toExportTemplate(t: LabelTemplate): ExportTemplate {
  const { w, h } = parsePaper(t.paperSize);
  return {
    unit: 'pt',
    paper: { width: w, height: h, unit: 'mm' },
    elements: t.elements.map(el => {
      const o = el.options as unknown as Record<string, unknown>;
      return {
        id: el.id,
        type: el.type,
        key: str(o.field),
        label: str(o.title),
        x: num(el.x, 0),
        y: num(el.y, 0),
        width: num(el.width, 0),
        height: num(el.height, 0),
        style: buildStyle(el),
        options: el.options
      };
    })
  };
}

/** 纯目标格式元素（无 options）→ 原生元素：按类型从 key/label/style 反推（几何 pt 直传） */
function fromExportElement(el: ExportElement): LabelElement {
  const style = (el.style ?? {}) as Record<string, unknown>;
  const geometry = {
    x: num(el.x, 0),
    y: num(el.y, 0),
    width: num(el.width, 0),
    height: num(el.height, 0)
  };
  // 本项目存入的超集：options 优先，无损还原
  if (el.options && typeof el.options === 'object') {
    return {
      id: el.id || genId(),
      type: el.type,
      ...geometry,
      options: JSON.parse(JSON.stringify(el.options)) as ElementOptions
    };
  }
  const field = str(el.key);
  const title = str(el.label);
  const data = {
    ...(field ? { field } : {}),
    ...(title ? { title, showTitle: style.hideLabel !== true } : {})
  };
  const border = {
    showBorder: num(style.borderWidth, 0) > 0,
    borderWidth: num(style.borderWidth, 1),
    borderColor: str(style.borderColor) || '#000000'
  };
  let type: ElementType = el.type;
  let options: ElementOptions;
  switch (el.type) {
    case 'text':
    case 'longText': {
      if (el.type === 'text' && style.wordWrap === true) type = 'longText';
      options = {
        text: str(style.placeholder),
        fontSize: num(style.fontSize, 8),
        color: str(style.color) || '#000000',
        fontWeight: style.fontWeight === 'bold' ? 'bold' : 'normal',
        align: pickAlign(style.textAlign),
        verticalAlign: pickVAlign(style.verticalAlign),
        lineHeight: num(style.lineHeight, 1.2),
        ...data,
        titleFontSize: 8,
        titleColor: '#000000',
        titleFontWeight: 'normal',
        ...border
      };
      break;
    }
    case 'barcode':
      options = {
        symbology: str(style.barcodeType) || 'code128',
        displayValue: style.showBarcodeText !== false,
        fontSize: num(style.fontSize, 8),
        value: str(style.placeholder) || undefined,
        ...data,
        titleFontSize: 8,
        titleColor: '#000000',
        titleFontWeight: 'normal',
        ...border
      };
      break;
    case 'qrcode': {
      const ecc = style.ecc;
      options = {
        ecc: ecc === 'L' || ecc === 'M' || ecc === 'Q' || ecc === 'H' ? ecc : 'M',
        value: str(style.placeholder) || undefined,
        ...data,
        titleFontSize: 8,
        titleColor: '#000000',
        titleFontWeight: 'normal',
        ...border
      };
      break;
    }
    case 'image':
      options = { src: str(style.src), ...(field ? { field } : {}) };
      break;
    case 'rect':
      options = {
        borderWidth: num(style.borderWidth, 1),
        borderColor: str(style.borderColor) || '#000000',
        bgColor: str(style.backgroundColor) || 'transparent',
        radius: num(style.borderRadius, 0)
      };
      break;
    default:
      options = { borderWidth: 1, borderColor: str(style.color) || '#000000' };
      break;
  }
  return { id: el.id || genId(), type, ...geometry, options };
}

/** 目标存储格式 → 内部模板（paper 重建 paperSize 字符串，几何 pt 直传） */
function fromExportTemplate(t: ExportTemplate): LabelTemplate {
  const paper = (t.paper ?? {}) as Partial<ExportTemplate['paper']>;
  return {
    paperSize: `${num(paper.width, 100)}×${num(paper.height, 150)}mm`,
    elements: (Array.isArray(t.elements) ? t.elements : []).map(fromExportElement)
  };
}

/** 旧模板（unit 缺省或 'mm'）几何迁移：mm 数值换算为 pt，视觉大小不变 */
function migrateGeometryToPt(t: LabelTemplate): LabelTemplate {
  return {
    ...t,
    unit: 'pt',
    elements: t.elements.map(el => ({
      ...el,
      x: mmToPt(el.x),
      y: mmToPt(el.y),
      width: mmToPt(el.width),
      height: mmToPt(el.height)
    }))
  };
}

/**
 * designJson 解析（兼容三种输入，统一输出 pt 几何内部模板）：
 * 1. 目标格式（顶层有 paper 对象）：options 优先无损还原、否则 style/key/label 反推
 * 2. 旧原生格式（顶层无 paper、有 elements）：原样加载；unit 缺省或 'mm' 时几何 mm→pt 迁移
 * 3. 空串/非法 JSON：回退空模板
 */
export function parseTemplateJson(json: string): LabelTemplate {
  const empty: LabelTemplate = { paperSize: '100×150mm', elements: [] };
  if (!json) return empty;
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== 'object') return empty;
    const obj = parsed as Record<string, unknown>;
    if (obj.paper && typeof obj.paper === 'object') {
      return fromExportTemplate(parsed as unknown as ExportTemplate);
    }
    if (Array.isArray(obj.elements)) {
      const legacy: LabelTemplate = {
        paperSize: typeof obj.paperSize === 'string' ? obj.paperSize : '100×150mm',
        elements: obj.elements as LabelElement[]
      };
      return obj.unit === 'pt' ? legacy : migrateGeometryToPt(legacy);
    }
    return empty;
  } catch {
    return empty;
  }
}
