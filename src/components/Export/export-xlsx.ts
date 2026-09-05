/** exceljs 写 xlsx 的唯一出口：TableExportAction（表格左侧操作栏）与 DataExport 共用 */

import { $t } from '@/locales';
import type { ExportField } from './type';

/** 运行时 exceljs 只需要 Workbook 构造函数（其余类型用于推导局部变量） */
type ExcelJSModule = {
  Workbook: typeof import('exceljs').Workbook;
};

/** exceljs 走动态 import，避免进入首屏主包；CJS 默认导出经 Vite 预构建后挂在 default 上 */
async function loadExcelJS(): Promise<ExcelJSModule> {
  const raw = (await import('exceljs')) as ExcelJSModule | { default: ExcelJSModule };
  return 'default' in raw && raw.default ? raw.default : (raw as ExcelJSModule);
}

/** 值字符串化：null/undefined 空串，对象 JSON 序列化 */
function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object Object]';
    }
  }
  return String(value);
}

/** 按字段取单元格文本：固定值 > formatter > 内置 status 文案 > 原值 */
function resolveCellText(field: ExportField, row: Record<string, unknown>): string {
  // 弹窗内新增的「固定值」字段：整列写同一个文本
  if (field.valueMode === 'fixed') {
    return field.fixedValue ?? '';
  }
  const raw = row[field.key];
  if (field.formatter) {
    return toText(field.formatter(raw, row));
  }
  if (field.sourceType === 'status') {
    const active = field.activeValue ?? 1;
    return String(raw) === String(active) ? $t('common.enable') : $t('common.disable');
  }
  return toText(raw);
}

/** 计算单元格「显示宽度」：中文按 2 个半角宽度计 */
function displayWidth(text: string): number {
  let width = 0;
  for (const ch of text) {
    width += ch.charCodeAt(0) > 255 ? 2 : 1;
  }
  return width;
}

/** 默认导出文件名：`导出_yyyyMMdd_HHmmss`，无 i18n 页面文案（如原生 vxe 导出）时也可直接用 */
export function createDefaultExportName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(
    now.getMinutes()
  )}${pad(now.getSeconds())}`;
  return `${$t('common.export')}_${stamp}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  link.click();
  // 延迟释放，避免部分浏览器在下载开始前撤销 URL 导致失败
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 按勾选字段顺序导出行数据为 xlsx 并触发下载
 * @param rows 行数据（全量或当前页）
 * @param fields 勾选且排序后的导出字段
 * @param filename 文件名（不含扩展名，缺省为「导出_时间戳」）
 */
export async function exportRowsToXlsx(rows: unknown[], fields: ExportField[], filename?: string): Promise<void> {
  const name = filename?.trim() ? filename.trim() : createDefaultExportName();
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet();

  // 1. 表头行
  const headerRow = worksheet.addRow(fields.map(field => field.title));
  headerRow.height = 22;
  headerRow.eachCell((cell, colNumber) => {
    const field = fields[colNumber - 1];
    if (!field) return;
    cell.font = { bold: true, color: { argb: 'FF000000' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    };
  });

  // 2. 数据行（全部按单元格文本写）
  const textRows = rows.map(row => fields.map(field => resolveCellText(field, (row ?? {}) as Record<string, unknown>)));
  for (const values of textRows) {
    const row = worksheet.addRow(values);
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };
    });
  }

  // 3. 列宽：表头与内容取较宽者自适应（上限 50，防止超长字段把表拉得过宽）
  fields.forEach((field, index) => {
    const widths = [field.title, ...textRows.map(row => row[index])];
    const maxWidth = widths.reduce((max, text) => Math.max(max, displayWidth(text ?? '')), 0);
    worksheet.getColumn(index + 1).width = Math.min(50, Math.max(10, maxWidth + 2));
  });

  // 4. 首行冻结，方便滚动查看
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    name
  );
}
