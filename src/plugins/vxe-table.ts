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
