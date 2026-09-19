import { $t } from '@/locales';

/**
 * 导出格式模板类别映射（后端固定枚举 0~8，文案走 i18n）。
 * 使用方：导出格式列表（表格列 / 搜索筛选）与新增/编辑抽屉。
 */

/** 模板类别选项（每次调用取当前语言） */
export function getTemplateTypeOptions() {
  return [
    { label: $t('page.manage.setting.exportFormat.type.sysList'), value: 0 },
    { label: $t('page.manage.setting.exportFormat.type.sendList'), value: 1 },
    { label: $t('page.manage.setting.exportFormat.type.billRec'), value: 2 },
    { label: $t('page.manage.setting.exportFormat.type.billPay'), value: 3 },
    { label: $t('page.manage.setting.exportFormat.type.blLoadList'), value: 4 },
    { label: $t('page.manage.setting.exportFormat.type.blInvoice'), value: 5 },
    { label: $t('page.manage.setting.exportFormat.type.blFile'), value: 6 },
    { label: $t('page.manage.setting.exportFormat.type.blCustoms'), value: 7 },
    { label: $t('page.manage.setting.exportFormat.type.shipOrder'), value: 8 }
  ];
}

/** 类别名（表格列展示用） */
export function templateTypeLabel(type?: number) {
  return getTemplateTypeOptions().find(item => item.value === type)?.label ?? '';
}
