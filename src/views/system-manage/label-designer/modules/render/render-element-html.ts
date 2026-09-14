import type { LabelElement, LabelTemplate } from '../core/types';
import { renderBarcode, renderQrcode } from './barcode';
import { resolveDisplayText, vAlignToJustify } from './render-utils';
import { parsePaper } from '../core/constant';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function elementHtml(el: LabelElement): string {
  // 元素几何单位 pt；纸张容器（getTemplateHtml）仍是 mm，CSS 绝对单位混排合法
  const pos = `position:absolute;left:${el.x}pt;top:${el.y}pt;width:${el.width}pt;height:${el.height}pt;overflow:hidden;box-sizing:border-box;`;
  const o = el.options;
  // 可选边框（文本/条码/二维码开启「显示边框」时生效；rect/line 自带边框不在此列）。pos 已含 box-sizing:border-box，边框不撑大元素
  const showBorder = 'showBorder' in o ? Boolean(o.showBorder) : false;
  const borderCss = showBorder
    ? `border:${('borderWidth' in o ? o.borderWidth : undefined) ?? 1}px solid ${('borderColor' in o ? o.borderColor : undefined) ?? '#000000'};`
    : '';
  // 「关联标题」开启且标题非空：span 版标题，文本里作行内前缀，非文本 flex 里作左侧子项（与画布渲染保持一致）
  const title = ('title' in o ? (o.title ?? '') : '').trim();
  const showTitle = ('showTitle' in o ? Boolean(o.showTitle) : false) && title.length > 0;
  const titleHtml = showTitle
    ? `<span style="flex:none;white-space:nowrap;margin-right:8px;font-size:${('titleFontSize' in o ? o.titleFontSize : undefined) ?? 8}pt;color:${('titleColor' in o ? o.titleColor : undefined) ?? '#000000'};font-weight:${('titleFontWeight' in o ? o.titleFontWeight : undefined) ?? 'normal'};">${escapeHtml(title)}:</span>`
    : '';
  // 统一包裹（非文本用）：无标题时保持原结构；有标题时套水平 flex 容器（标题在左、内容在右）
  const wrapContent = (innerStyle: string, innerHtml: string, src?: string): string => {
    if (!showTitle) {
      return src !== undefined
        ? `<img src="${src}" style="${pos}${borderCss}${innerStyle}" />`
        : `<div style="${pos}${borderCss}${innerStyle}">${innerHtml}</div>`;
    }
    const body =
      src !== undefined
        ? `<img src="${src}" style="width:100%;height:100%;object-fit:contain;" />`
        : `<div style="width:100%;height:100%;overflow:hidden;${innerStyle}">${innerHtml}</div>`;
    return `<div style="${pos}${borderCss}display:flex;align-items:flex-start;">${titleHtml}<div style="flex:1;min-width:0;height:100%;overflow:hidden;">${body}</div></div>`;
  };

  // 文本：标题作为行内前缀与内容连续排版（同一文本流基线天然对齐、折行行首顶格、整块内容随 verticalAlign 纵向定位）
  if ((el.type === 'text' || el.type === 'longText') && 'text' in o) {
    const inner = escapeHtml(resolveDisplayText(o));
    const style = `font-size:${o.fontSize}pt;color:${o.color};font-weight:${o.fontWeight};text-align:${o.align};line-height:${o.lineHeight};word-break:break-all;`;
    const body = showTitle ? `${titleHtml}${inner}` : inner;
    // 外层 flex column 只做纵向定位；内层 100% 宽 div 保持「标题前缀+内容」同一文本流，不被 flex 拆成两块
    const justify = vAlignToJustify('verticalAlign' in o ? o.verticalAlign : undefined);
    return `<div style="${pos}${borderCss}display:flex;flex-direction:column;justify-content:${justify};"><div style="width:100%;${style}">${body}</div></div>`;
  }
  if (el.type === 'image' && 'src' in o) {
    return wrapContent('object-fit:contain;', '', o.src);
  }
  if (el.type === 'barcode' && 'symbology' in o) {
    // PNG 只画条形；标题+编码值合为下方 DOM 文本行（bwip-js 内置字体不支持中文，alttext 乱码已实证）。
    // displayValue 关闭且无标题时不渲染行；textGap 原为图内文本偏移(pt)，现为行与条形的间距(px)
    const src = renderBarcode({ symbology: o.symbology, text: resolveDisplayText(o) });
    const showValue = 'displayValue' in o ? o.displayValue !== false : true;
    if (!showValue && !showTitle) {
      return `<img src="${src}" style="${pos}${borderCss}object-fit:contain;" />`;
    }
    const lineStyle = `flex:none;text-align:center;word-break:break-all;font-size:${('fontSize' in o ? o.fontSize : undefined) || 8}pt;${'textGap' in o && o.textGap ? `margin-top:${o.textGap}px;` : ''}`;
    const lineHtml = `${showTitle ? `${escapeHtml(title)}:` : ''}${showValue ? escapeHtml(resolveDisplayText(o)) : ''}`;
    return `<div style="${pos}${borderCss}display:flex;flex-direction:column;"><div style="width:100%;flex:1;min-height:0;"><img src="${src}" style="width:100%;height:100%;object-fit:contain;" /></div><div style="${lineStyle}">${lineHtml}</div></div>`;
  }
  if (el.type === 'qrcode' && 'ecc' in o) {
    const src = renderQrcode({ text: resolveDisplayText(o), ecc: o.ecc });
    return wrapContent('object-fit:contain;', '', src);
  }
  if (el.type === 'rect' && 'bgColor' in o) {
    return wrapContent(
      `border:${o.borderWidth}px solid ${o.borderColor};background:${o.bgColor};border-radius:${o.radius}px;`,
      ''
    );
  }
  if ((el.type === 'hline' || el.type === 'vline') && 'borderWidth' in o) {
    if (el.type === 'hline') {
      return wrapContent(`border-top:${o.borderWidth}px solid ${o.borderColor};`, '');
    }
    return wrapContent(`border-left:${o.borderWidth}px solid ${o.borderColor};`, '');
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
