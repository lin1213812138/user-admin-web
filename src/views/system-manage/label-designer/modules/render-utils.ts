import type { ElementOptions } from './types';

/**
 * 解析元素最终显示/编码的文本。
 * 绑定字段时优先用测试数据，否则展示 `{{字段}}` 占位；未绑字段时用样例/固定值。
 */
export function resolveDisplayText(opts: ElementOptions): string {
  if ('field' in opts && opts.field) {
    // 绑定字段时，优先用「文本」作为设计/打印内容（即示例值）；为空才回退占位符
    const t = 'text' in opts ? (opts.text ?? '') : '';
    return t.length > 0 ? t : `{{${opts.field}}}`;
  }
  if ('text' in opts) return opts.text ?? '';
  if ('value' in opts) return opts.value ?? '';
  if ('src' in opts) return opts.src ?? '';
  return '';
}
