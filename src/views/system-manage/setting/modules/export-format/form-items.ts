import { $t } from '@/locales';
import type { FormItemConfig } from '@/components/Form/index.vue';
import { getTemplateTypeOptions } from './template-type';

/** 导出格式抽屉表单项（模板类别选项每次调用取当前语言） */
export function buildExportFormatFormItems(): FormItemConfig[] {
  return [
    {
      key: 'name',
      label: $t('page.manage.setting.exportFormat.name'),
      type: 'input',
      required: true,
      span: 24,
      placeholder: '请输入模板名称'
    },
    {
      key: 'templateType',
      label: $t('page.manage.setting.exportFormat.templateType'),
      type: 'select',
      required: true,
      span: 24,
      options: getTemplateTypeOptions(),
      filterable: false
    },
    {
      key: 'file',
      label: $t('page.manage.setting.exportFormat.excelTemplate'),
      type: 'custom',
      required: true,
      requiredMsg: $t('page.manage.setting.exportFormat.excelTemplateRequired'),
      span: 24
    },
    {
      key: 'thPos',
      label: $t('page.manage.setting.exportFormat.thPos'),
      type: 'input',
      span: 24,
      placeholder: '请输入(字母+数字,如A1)'
    },
    {
      key: 'tdPos',
      label: $t('page.manage.setting.exportFormat.tdPos'),
      type: 'input',
      required: true,
      span: 24,
      placeholder: '请输入(字母+数字,如B1)'
    },
    {
      key: 'note',
      label: $t('page.manage.setting.exportFormat.note'),
      type: 'textarea',
      span: 24,
      placeholder: '请输入'
    }
  ];
}
