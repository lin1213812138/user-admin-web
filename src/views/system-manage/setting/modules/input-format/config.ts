import type { SelectOption } from 'naive-ui';
import { $t } from '@/locales';
import { getGlobalOptions } from '@/constants/options';
import type { FormItemConfig } from '@/components/Form/index.vue';
import type { VxeColumnConfig } from '@/components/Table';

/**
 * 录单格式 UI 配置：列表列 + 抽屉表单项。
 *
 * `$t` 在 builder 内调用（不在模块顶层取常量），语言切换时随调用方 `computed` / `columns` 重建。
 */

/** 录单格式列表列配置（页面 useVxeTable 消费；列持久化 cacheKey 由页面管理） */
export function buildInputFormatColumns(): VxeColumnConfig[] {
  return [
    {
      key: 'name',
      title: $t('page.manage.setting.inputFormat.name'),
      visible: true,
      minWidth: 180,
      sortable: false
    },
    {
      key: 'customerEnable',
      title: $t('page.manage.setting.inputFormat.customerEnable'),
      visible: true,
      width: 100,
      align: 'center',
      sortable: false
    },
    {
      key: 'isDefault',
      title: $t('page.manage.setting.inputFormat.isDefault'),
      visible: true,
      width: 100,
      align: 'center',
      sortable: false
    },
    {
      key: 'order',
      title: $t('page.manage.setting.inputFormat.order'),
      visible: true,
      width: 80,
      align: 'center',
      sortable: false
    },
    { key: 'note', title: $t('common.remark'), visible: true, minWidth: 220, sortable: false },
    {
      key: 'status',
      title: $t('common.status'),
      type: 'status',
      visible: true,
      width: 100,
      fixed: 'right',
      align: 'center',
      sortable: false
    },
    {
      key: 'updateBy',
      title: $t('page.manage.setting.inputFormat.lastOperation'),
      visible: true,
      width: 100,
      fixed: 'right',
      align: 'center',
      sortable: false
    },
    {
      key: 'updateDate',
      title: $t('page.manage.setting.inputFormat.lastUpdateTime'),
      visible: true,
      width: 170,
      fixed: 'right',
      align: 'center',
      sortable: false
    }
  ];
}

/** 状态下拉：启用(1) / 禁用(0)，统一取全局 status 选项 */
function statusOptions(): SelectOption[] {
  return getGlobalOptions('status');
}

/** 是 / 否下拉（客户可用、是否默认共用）：是(1) / 否(0) */
function yesNoOptions(): SelectOption[] {
  return [
    { label: $t('page.manage.setting.inputFormat.yes'), value: 1 },
    { label: $t('page.manage.setting.inputFormat.no'), value: 0 }
  ];
}

// 三态字段（status/customerEnable/isDefault）用下拉而非开关：禁止清空（clearable:false）、两选项不需要搜索框（filterable:false）
const triStateProps = { type: 'select', span: 8, clearable: false, filterable: false } as const;

/** 录单格式抽屉表单项（三态下拉选项每次调用取当前语言） */
export function buildInputFormatFormItems(): FormItemConfig[] {
  return [
    {
      key: 'name',
      label: $t('page.manage.setting.inputFormat.name'),
      type: 'input',
      required: true,
      span: 8,
      placeholder: $t('page.manage.setting.inputFormat.namePlaceholder')
    },
    {
      ...triStateProps,
      key: 'status',
      label: $t('common.status'),
      options: statusOptions()
    },
    {
      ...triStateProps,
      key: 'customerEnable',
      label: $t('page.manage.setting.inputFormat.customerEnable'),
      options: yesNoOptions()
    },
    {
      ...triStateProps,
      key: 'isDefault',
      label: $t('page.manage.setting.inputFormat.isDefault'),
      options: yesNoOptions()
    },
    {
      key: 'order',
      label: $t('page.manage.setting.inputFormat.order'),
      type: 'number',
      span: 8,
      placeholder: $t('page.manage.setting.inputFormat.orderPlaceholder')
    },
    {
      key: 'note',
      label: $t('common.remark'),
      type: 'input',
      span: 8,
      placeholder: $t('page.manage.setting.inputFormat.remarkPlaceholder')
    }
  ];
}
