import { createApp, nextTick } from 'vue';
import ElementRenderer from './element-renderer.vue';
import { PX_PER_PT } from '../core/constant';
import type { LabelElement } from '../core/types';

/** 文本单行高度下限（pt）：空内容不塌 0，与 drag-preview 的 minHeight 同口径 */
function minTextHeight(el: LabelElement): number {
  const o = el.options as unknown as Record<string, unknown>;
  const fontSize = typeof o.fontSize === 'number' ? o.fontSize : 8;
  const lineHeight = typeof o.lineHeight === 'number' ? o.lineHeight : 1.2;
  return fontSize * lineHeight;
}

/**
 * 离屏实测元素内容高度（pt）：临时挂载与画布同源的 ElementRenderer，宽度按元素宽、高度交内容撑开。
 * 供「类型切换到文本」的高度自适应使用（与拖拽落纸的预览实测同一口径，保证两种路径结果一致）。
 * 返回 null 表示未测到有效高度（调用方保持默认高度）。
 */
export async function measureElementHeight(el: LabelElement): Promise<number | null> {
  if (typeof document === 'undefined') return null;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;pointer-events:none;';
  host.style.width = `${el.width * PX_PER_PT}px`;
  // 高度不设死、交内容撑开（同 drag-preview：height auto + 单行高度下限）
  host.style.height = 'auto';
  host.style.minHeight = `${minTextHeight(el) * PX_PER_PT}px`;
  document.body.appendChild(host);
  const app = createApp(ElementRenderer, { element: el });
  app.mount(host);
  // 等一帧：与预览实测同节奏，避免字体/换行尚未参与布局就取值
  await nextTick();
  const height = host.offsetHeight;
  app.unmount();
  host.remove();
  return height > 0 ? height / PX_PER_PT : null;
}
