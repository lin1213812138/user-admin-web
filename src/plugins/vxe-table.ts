import VxePcUi from 'vxe-pc-ui';
import VxeTable, { VxeUI } from 'vxe-table';
import * as ExcelJS from 'exceljs';
import { VxeUIPluginExportXLSX } from '@vxe-ui/plugin-export-xlsx';
import 'vxe-pc-ui/lib/style.css';
import 'vxe-table/lib/style.css';
// ?raw 读取为纯文本，改由运行时注入到 <head> 末尾：
// 这样一定排在 vxe-table 自身注入的样式之后（覆盖有效），且不依赖 Vite 的 CSS 模块图刷新
import scrollbarCss from '../styles/css/scrollbar.css?raw';
import { watch } from 'vue';
import type { App } from 'vue';
import { getColorPalette } from '@sa/color';
import { useThemeStore } from '@/store/modules/theme';

/** 运行时注入 vxe-table 滚动条样式（默认透明、hover 才显形），保证一定进入 DOM。
   style 元素已存在时直接更新其内容，否则 HMR 修改 scrollbar.css 后因 early-return 不生效 */
function injectScrollbarStyle() {
  let style = document.getElementById('vxe-table-scrollbar-style') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = 'vxe-table-scrollbar-style';
    document.head.appendChild(style);
  }
  style.textContent = scrollbarCss;
}

/** 滚动条占位宽度的测量结果写入 :root，供 scrollbar.css 补偿横向滚动条 handle 的自身占位 */
function applyScrollbarSize(size: number) {
  document.documentElement.style.setProperty('--x-scrollbar-size', `${size}px`);
}

/** 探针测量（兜底）：复用 handle 的 class，使滚动条样式规则与真实 handle 一致；
   内联 !important 强制 overflow: scroll，避免被项目 CSS 的 overflow-x: auto 覆盖而测不到滚动条 */
function measureScrollbarSize() {
  const host = document.querySelector('.vxe-table') ?? document.documentElement;
  const probe = document.createElement('div');
  probe.className = 'vxe-table--scroll-x-handle';
  probe.style.cssText = 'position:absolute;top:-9999px;left:0;width:100px;height:100px';
  probe.style.setProperty('overflow', 'scroll', 'important');
  host.appendChild(probe);
  const size = probe.offsetWidth - probe.clientWidth;
  probe.remove();
  applyScrollbarSize(size);
}

/** 实测页面里真实 handle 的滚动条占位（最准）：临时强制 overflow: scroll 读一次再还原；
   handle 平时 opacity: 0（hover 才显形），不会闪烁 */
function calibrateScrollbarSize(): boolean {
  const handle = document.querySelector<HTMLElement>('.vxe-table--scroll-x-handle');
  if (!handle) return false;
  const prev = handle.style.getPropertyValue('overflow');
  const prevPriority = handle.style.getPropertyPriority('overflow');
  handle.style.setProperty('overflow', 'scroll', 'important');
  const size = handle.offsetWidth - handle.clientWidth;
  if (prev) {
    handle.style.setProperty('overflow', prev, prevPriority);
  } else {
    handle.style.removeProperty('overflow');
  }
  if (size > 0) {
    applyScrollbarSize(size);
  }
  return size > 0;
}

/** 表格渲染出真实 handle 后再校准一次（此前探针只能挂在 html 上，规则不匹配、值可能不准） */
function calibrateScrollbarSizeWhenReady() {
  if (calibrateScrollbarSize()) return;
  const observer = new MutationObserver(() => {
    if (calibrateScrollbarSize()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // 兜底：页面始终没有表格时不要长期观察
  window.setTimeout(() => observer.disconnect(), 10000);
}

export function setupVxeTable(app: App) {
  // 先于插件安装设置全局滚动条配置，确保实例挂载前拿到最终值
  VxeUI.setConfig({
    table: {
      scrollbarConfig: {
        width: 0,
        height: 0.0001,
        x: { visible: true },
        y: { visible: true }
      }
    }
  });

  app.use(VxePcUi);
  app.use(VxeTable);

  // 横向滚动条的宽度补偿基准：先探针兜底，表格渲染出真实 handle 后再实测校准
  measureScrollbarSize();
  calibrateScrollbarSizeWhenReady();

  // 滚动条样式（默认透明、hover 才显形）注入到 head 末尾，排在 vxe-table 样式之后
  injectScrollbarStyle();

  // 官方 xlsx 导出插件：表格实例 exportData({ type: 'xlsx' }) 依赖它；注入本项目 exceljs
  VxeUI.use(VxeUIPluginExportXLSX, { ExcelJS });

  const themeStore = useThemeStore();

  // 跟随系统主题（深/浅色）切换 vxe-table 主题
  const applyVxeTheme = (dark: boolean) => {
    VxeUI.setTheme(dark ? 'dark' : 'light');
  };

  // 跟随系统主题色，覆盖 vxe-table 主色相关 CSS 变量
  const applyVxePrimaryColor = (primary: string) => {
    const palette = getColorPalette(primary);
    const root = document.documentElement;
    const setVar = (name: string, value?: string) => {
      if (value) {
        root.style.setProperty(name, value);
      }
    };

    setVar('--vxe-ui-color-primary', palette.get(500));
    setVar('--vxe-ui-font-primary-color', palette.get(500));
    setVar('--vxe-ui-color-primary-lighten-1', palette.get(400));
    setVar('--vxe-ui-color-primary-lighten-2', palette.get(300));
    setVar('--vxe-ui-color-primary-lighten-3', palette.get(200));
    setVar('--vxe-ui-color-primary-lighten-4', palette.get(100));
    setVar('--vxe-ui-color-primary-lighten-5', palette.get(50));
    setVar('--vxe-ui-color-primary-darken-1', palette.get(600));
    setVar('--vxe-ui-color-primary-darken-2', palette.get(700));
  };

  applyVxeTheme(themeStore.darkMode);
  applyVxePrimaryColor(themeStore.themeColors.primary);

  watch(
    () => themeStore.darkMode,
    val => applyVxeTheme(val)
  );

  watch(
    () => themeStore.themeColors.primary,
    val => applyVxePrimaryColor(val)
  );
}
