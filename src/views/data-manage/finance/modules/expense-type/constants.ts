import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';

/**
 * 使用范围选项（对齐后端 FeeType.scope 常量：0-运单应收 1-运单应付 2-提单应付 3-杂支应付 4-杂支应收），
 * 搜索栏 / 表格列 / 抽屉表单共用；builder 内调用 $t，语言切换后重新取值即刷新文案
 */
export function buildExpenseScopeOptions(): SelectOption[] {
  return [
    { label: $t('page.dataManage.finance.expenseType.scopeOptions.orderRec'), value: 0 },
    { label: $t('page.dataManage.finance.expenseType.scopeOptions.orderPay'), value: 1 },
    { label: $t('page.dataManage.finance.expenseType.scopeOptions.blPay'), value: 2 },
    { label: $t('page.dataManage.finance.expenseType.scopeOptions.otherPay'), value: 3 },
    { label: $t('page.dataManage.finance.expenseType.scopeOptions.otherRec'), value: 4 }
  ];
}

/** 使用范围值数组 → 展示文案（空值回落 '-'，列表列渲染用） */
export function formatExpenseScope(scope: number[] | undefined, options: SelectOption[]): string {
  if (!scope?.length) return '-';

  return scope.map(value => String(options.find(opt => opt.value === value)?.label ?? value)).join('、');
}
