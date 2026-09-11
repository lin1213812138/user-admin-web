import * as bwipjs from 'bwip-js/browser';

type BwipRenderOptions = Parameters<typeof bwipjs.toCanvas>[1];
type BarRenderOptions = BwipRenderOptions & {
  textxalign?: 'offleft' | 'left' | 'center' | 'right' | 'offright' | 'justify';
};
type QrRenderOptions = BwipRenderOptions & { eclevel?: 'L' | 'M' | 'Q' | 'H' };

/** 离屏绘制，失败返回红色 ERR 占位图，避免画布崩溃 */
function draw(opts: BwipRenderOptions): string {
  const canvas = document.createElement('canvas');
  try {
    bwipjs.toCanvas(canvas, opts);
    return canvas.toDataURL();
  } catch {
    canvas.width = 120;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0000';
      ctx.font = '12px sans-serif';
      ctx.fillText('ERR', 4, 24);
    }
    return canvas.toDataURL();
  }
}

/** 绘制一维条码，返回 dataURL */
export function renderBarcode(opts: {
  symbology: string;
  text: string;
  displayValue: boolean;
  fontSize: number;
}): string {
  return draw({
    bcid: opts.symbology,
    text: opts.text || ' ',
    scale: 3,
    height: 10,
    includetext: opts.displayValue,
    textxalign: 'center',
    textsize: opts.displayValue ? Math.max(4, Math.round(opts.fontSize)) : 4
  } as BarRenderOptions);
}

/** 绘制二维码，返回 dataURL */
export function renderQrcode(opts: { text: string; ecc: 'L' | 'M' | 'Q' | 'H' }): string {
  return draw({
    bcid: 'qrcode',
    text: opts.text || ' ',
    scale: 4,
    padding: 0,
    eclevel: opts.ecc
  } as QrRenderOptions);
}
