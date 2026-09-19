import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';

/**
 * 结算周期选项（对齐后端 BillMode.billPeriod：0-每天 1-每周 2-每月），
 * 搜索栏 / 表格列 / 抽屉表单共用；builder 内调用 $t，语言切换后重新取值即刷新文案
 */
export function buildBillPeriodOptions(): SelectOption[] {
  return [
    { label: $t('page.dataManage.finance.settlement.periodOptions.day'), value: 0 },
    { label: $t('page.dataManage.finance.settlement.periodOptions.week'), value: 1 },
    { label: $t('page.dataManage.finance.settlement.periodOptions.month'), value: 2 }
  ];
}

/**
 * 结算日期选项：含义随结算周期变化（对齐后端 BillMode.billDay 注释）
 * - 0-每天：0-23（小时）
 * - 1-每周：1-7（周一 ~ 周日）
 * - 2-每月：1-28 及 -1（最后一天）
 * 未选周期时返回空数组（表单中该项随之为空且置灰）
 */
export function buildBillDayOptions(period?: number | null): SelectOption[] {
  if (period === 0) {
    return Array.from({ length: 24 }, (_, hour) => ({
      label: $t('page.dataManage.finance.settlement.billDayOptions.hour', { n: hour }),
      value: hour
    }));
  }

  if (period === 1) {
    return [
      { label: $t('page.dataManage.finance.settlement.billDayOptions.week1'), value: 1 },
      { label: $t('page.dataManage.finance.settlement.billDayOptions.week2'), value: 2 },
      { label: $t('page.dataManage.finance.settlement.billDayOptions.week3'), value: 3 },
      { label: $t('page.dataManage.finance.settlement.billDayOptions.week4'), value: 4 },
      { label: $t('page.dataManage.finance.settlement.billDayOptions.week5'), value: 5 },
      { label: $t('page.dataManage.finance.settlement.billDayOptions.week6'), value: 6 },
      { label: $t('page.dataManage.finance.settlement.billDayOptions.week7'), value: 7 }
    ];
  }

  if (period === 2) {
    return [
      ...Array.from({ length: 28 }, (_, i) => ({
        label: $t('page.dataManage.finance.settlement.billDayOptions.monthDay', { n: i + 1 }),
        value: i + 1
      })),
      { label: $t('page.dataManage.finance.settlement.billDayOptions.last'), value: -1 }
    ];
  }

  return [];
}

/** 关联运单状态选项（0-已预报 1-已收货 2-已出库 3-转运中 4-已送达） */
export function buildBillGenStatusOptions(): SelectOption[] {
  return [
    { label: $t('page.dataManage.finance.settlement.genStatusOptions.forecast'), value: 0 },
    { label: $t('page.dataManage.finance.settlement.genStatusOptions.received'), value: 1 },
    { label: $t('page.dataManage.finance.settlement.genStatusOptions.outbound'), value: 2 },
    { label: $t('page.dataManage.finance.settlement.genStatusOptions.transit'), value: 3 },
    { label: $t('page.dataManage.finance.settlement.genStatusOptions.delivered'), value: 4 }
  ];
}

/** 结算周期展示文案（列表列，空值回落 '-'） */
export function formatBillPeriod(period: number | null | undefined, options: SelectOption[]): string {
  if (period === null || period === undefined) return '-';

  return String(options.find(opt => opt.value === period)?.label ?? period);
}

/** 结算日期展示文案（列表列；按周期语义渲染，空值回落 '-'） */
export function formatBillDay(period: number | null | undefined, day: number | null | undefined): string {
  if (day === null || day === undefined) return '-';

  return String(buildBillDayOptions(period).find(opt => opt.value === day)?.label ?? day);
}

/** 关联运单状态展示文案（列表列，多选值逗号连接；空值回落 '-'） */
export function formatBillGenStatus(statusList: number[] | undefined, options: SelectOption[]): string {
  if (!statusList?.length) return '-';

  return statusList.map(value => String(options.find(opt => opt.value === value)?.label ?? value)).join('、');
}
