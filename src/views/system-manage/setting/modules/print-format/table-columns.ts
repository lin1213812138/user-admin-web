import { $t } from '@/locales';
import type { VxeColumnConfig } from '@/components/Table';

/** 打印格式列表列配置（页面 useVxeTable 消费；列持久化 cacheKey 由页面管理） */
export function buildPrintFormatColumns(): VxeColumnConfig[] {
  return [
    {
      key: 'name',
      title: $t('page.manage.setting.printFormat.name'),
      visible: true,
      sortable: false
    },
    {
      key: 'templateType',
      title: $t('page.manage.setting.printFormat.category'),
      visible: true,
      width: 120,
      sortable: false
    },
    { key: 'sizeType', title: $t('page.manage.setting.printFormat.labelSize'), visible: true, sortable: false },
    {
      key: 'isDefault',
      title: $t('page.manage.setting.printFormat.isDefault'),
      visible: true,
      width: 100,
      align: 'center',
      sortable: false
    },
    {
      key: 'generate',
      title: $t('page.manage.setting.printFormat.generatedCount'),
      visible: true,
      width: 120,
      align: 'center',
      sortable: false
    },
    { key: 'note', title: $t('page.manage.setting.printFormat.remark'), visible: true, sortable: false },
    {
      key: 'updateBy',
      title: $t('page.manage.setting.printFormat.lastEditor'),
      visible: true,
      width: 120,
      sortable: false
    },
    {
      key: 'updateDate',
      title: $t('page.manage.setting.printFormat.editTime'),
      visible: true,
      width: 160,
      sortable: false
    }
  ];
}
