import { $t } from '@/locales';
import type { FormItemConfig } from '@/components/Form/index.vue';
import { SIZE_TYPE_OPTIONS } from '@/service/api/print-format/size-map';
import { TEMPLATE_TYPE_OPTIONS } from './template-type';

/** 模板格式选项（对齐后端 templateMode；表单暂未开放该字段，保留备查） */
// const templateModeOptions: { label: string; value: Api.PrintFormat.TemplateMode }[] = [
//   { label: 'PDF', value: 0 },
//   { label: 'Excel', value: 1 }
// ];

/**
 * 打印格式抽屉表单项。
 *
 * @param sizeType 当前标签尺寸：5（自定义）时追加宽高输入（mm）
 */
export function buildPrintFormatFormItems(sizeType: number): FormItemConfig[] {
  const items: FormItemConfig[] = [
    {
      key: 'name',
      label: $t('page.manage.setting.printFormat.name'),
      type: 'input',
      required: true,
      span: 24,
      placeholder: '请输入模板名称'
    },
    {
      key: 'templateType',
      label: $t('page.manage.setting.printFormat.category'),
      type: 'select',
      required: true,
      span: 24,
      options: TEMPLATE_TYPE_OPTIONS
    },
    // 模板格式（templateMode）暂未开放表单项，保留位置备查
    {
      key: 'sizeType',
      label: $t('page.manage.setting.printFormat.labelSize'),
      type: 'select',
      required: true,
      span: 24,
      options: SIZE_TYPE_OPTIONS
    }
  ];

  // 自定义尺寸时追加宽高输入（mm）
  if (sizeType === 5) {
    items.push(
      { key: 'width', label: '宽度（mm）', type: 'number', required: true, span: 12 },
      { key: 'height', label: '高度（mm）', type: 'number', required: true, span: 12 }
    );
  }

  items.push(
    {
      key: 'isDefault',
      label: $t('page.manage.setting.printFormat.isDefault'),
      type: 'switch',
      span: 24,
      checkedText: $t('page.manage.setting.printFormat.yes'),
      uncheckedText: $t('page.manage.setting.printFormat.no'),
      checkedValue: 1,
      uncheckedValue: 0
    },
    { key: 'note', label: $t('page.manage.setting.printFormat.remark'), type: 'textarea', span: 24 }
  );

  return items;
}
