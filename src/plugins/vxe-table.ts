import VxePcUi from 'vxe-pc-ui';
import VxeTable, { VxeUI } from 'vxe-table';
import * as ExcelJS from 'exceljs';
import { VxeUIPluginExportXLSX } from '@vxe-ui/plugin-export-xlsx';
import 'vxe-pc-ui/lib/style.css';
import 'vxe-table/lib/style.css';
import { watch } from 'vue';
import type { App } from 'vue';
import { getColorPalette } from '@sa/color';
import { useThemeStore } from '@/store/modules/theme';

export function setupVxeTable(app: App) {
  app.use(VxePcUi);
  app.use(VxeTable);

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
