import type { LabelElement, LabelTemplate } from './types';
import { renderBarcode, renderQrcode } from './barcode';
import { resolveDisplayText } from './render-utils';
import { parsePaper } from './constant';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function elementHtml(el: LabelElement): string {
  const pos = `position:absolute;left:${el.x}mm;top:${el.y}mm;width:${el.width}mm;height:${el.height}mm;overflow:hidden;box-sizing:border-box;`;
  const o = el.options;
  if ((el.type === 'text' || el.type === 'longText') && 'text' in o) {
    const inner = escapeHtml(resolveDisplayText(o));
    const s = `font-size:${o.fontSize}pt;color:${o.color};font-weight:${o.fontWeight};text-align:${o.align};line-height:${o.lineHeight};word-break:break-all;`;
    return `<div style="${pos}${s}">${inner}</div>`;
  }
  if (el.type === 'image' && 'src' in o) {
    return `<img src="${o.src}" style="${pos}object-fit:contain;" />`;
  }
  if (el.type === 'barcode' && 'symbology' in o) {
    const src = renderBarcode({
      symbology: o.symbology,
      text: resolveDisplayText(o),
      displayValue: o.displayValue,
      fontSize: o.fontSize
    });
    return `<img src="${src}" style="${pos}object-fit:contain;" />`;
  }
  if (el.type === 'qrcode' && 'ecc' in o) {
    const src = renderQrcode({ text: resolveDisplayText(o), ecc: o.ecc });
    return `<img src="${src}" style="${pos}object-fit:contain;" />`;
  }
  if (el.type === 'rect' && 'bgColor' in o) {
    const s = `border:${o.borderWidth}px solid ${o.borderColor};background:${o.bgColor};border-radius:${o.radius}px;`;
    return `<div style="${pos}${s}"></div>`;
  }
  if ((el.type === 'hline' || el.type === 'vline') && 'borderWidth' in o) {
    if (el.type === 'hline') {
      return `<div style="${pos}border-top:${o.borderWidth}px solid ${o.borderColor};"></div>`;
    }
    return `<div style="${pos}border-left:${o.borderWidth}px solid ${o.borderColor};"></div>`;
  }
  return '';
}

/** 生成纸张内部 HTML（不含外层文档，供预览/打印嵌入） */
export function renderTemplateHtml(template: LabelTemplate): string {
  const { w, h } = parsePaper(template.paperSize);
  const body = template.elements.map(elementHtml).join('');
  return `<div style="position:relative;width:${w}mm;height:${h}mm;background:#fff;box-sizing:border-box;">${body}</div>`;
}

/** 生成可直接打印的完整 HTML 文档 */
export function renderPrintDocument(template: LabelTemplate, title = 'label'): string {
  const inner = renderTemplateHtml(template);
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title>
<style>
  @page { margin: 0; }
  html, body { margin: 0; padding: 0; }
  body { display: flex; justify-content: center; }
</style></head>
<body>${inner}</body></html>`;
}
