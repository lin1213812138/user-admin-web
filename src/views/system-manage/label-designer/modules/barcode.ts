import * as bwipjs from 'bwip-js/browser';

type QrRenderOptions = Parameters<typeof bwipjs.toCanvas>[1] & { eclevel?: 'L' | 'M' | 'Q' | 'H' };

/** 离屏绘制，失败返回红色 ERR 占位图，避免画布崩溃 */
function draw(opts: Parameters<typeof bwipjs.toCanvas>[1]): string {
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

/**
 * 绘制一维条码（只画条形，不含编码值文本），返回 dataURL。
 * 编码值/标题由调用方 DOM 文本行渲染：bwip-js 内置位图字体仅覆盖 Latin-1，
 * 中文会渲染成乱码（node 渲染 PNG 已实证），无法用 alttext 把标题拼进图内。
 */
export function renderBarcode(opts: { symbology: string; text: string }): string {
  return draw({
    bcid: opts.symbology,
    text: opts.text || ' ',
    scale: 3,
    height: 10
  });
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
