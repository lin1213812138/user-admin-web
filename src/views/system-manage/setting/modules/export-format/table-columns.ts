import { $t } from '@/locales';
import type { VxeColumnConfig } from '@/components/Table';

/** 导出格式列表列配置（页面 useVxeTable 消费；列持久化 cacheKey 由页面管理） */
export function buildExportFormatColumns(): VxeColumnConfig[] {
  return [
    {
      key: 'name',
      title: $t('page.manage.setting.exportFormat.name'),
      visible: true,
      minWidth: 160,
      sortable: false
    },
    {
      key: 'templateType',
      title: $t('page.manage.setting.exportFormat.templateType'),
      visible: true,
      width: 140,
      sortable: false
    },
    {
      key: 'thPos',
      title: $t('page.manage.setting.exportFormat.thPos'),
      visible: true,
      width: 150,
      sortable: false
    },
    {
      key: 'tdPos',
      title: $t('page.manage.setting.exportFormat.tdPos'),
      visible: true,
      width: 150,
      sortable: false
    },
    {
      key: 'note',
      title: $t('page.manage.setting.exportFormat.note'),
      visible: true,
      minWidth: 160,
      sortable: false
    },
    {
      key: 'updateBy',
      title: $t('page.manage.setting.exportFormat.lastOperation'),
      visible: true,
      width: 120,
      fixed: 'right',
      align: 'center',
      sortable: false
    },
    {
      key: 'updateDate',
      title: $t('page.manage.setting.exportFormat.lastUpdateTime'),
      visible: true,
      width: 170,
      fixed: 'right',
      align: 'center',
      sortable: false
    }
  ];
}
