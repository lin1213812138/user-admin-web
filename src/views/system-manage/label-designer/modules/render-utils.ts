import type { ElementOptions } from './types';

/**
 * 解析元素最终显示/编码的文本。
 * 回退链：text → value → src 依次取第一个「非空」值 → 占位文本（placeholder）→ 空。
 * 不能按「键是否存在」取值：旧版属性面板曾不分类型给条码/二维码 options 回写空 text 键，
 * 键存在优先会让空 text 永远遮蔽 value（编码值），导致改编码值画布也不更新。
 */
export function resolveDisplayText(opts: ElementOptions): string {
  let direct = '';
  if ('text' in opts && opts.text) direct = opts.text;
  else if ('value' in opts && opts.value) direct = opts.value;
  else if ('src' in opts && opts.src) direct = opts.src;
  if (direct.length > 0) return direct;
  if ('placeholder' in opts && opts.placeholder) return opts.placeholder;
  return '';
}
