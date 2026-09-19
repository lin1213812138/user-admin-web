import { fieldsConfig } from './fields-config';
import type { OrderFieldType } from './fields-config';
import type { FieldMappingGroup, FieldMappingValue } from '../../components/field-mapping-config';

/**
 * 录单格式字段映射：后端 fieldList ⇄ FieldMapping 编辑器模型
 *
 * 语义对照（后端 fieldList 无 show 字段）：
 * - 显示  = 该字段项是否存在于 fieldList
 * - 必填  = 该项的 `required === 1`
 */

/** 本地字段域 → 后端 fieldType 数字（0-运单 1-收件人 2-发件人 3-物品 4-子件） */
const domainToFieldType: Record<OrderFieldType, Api.InputFormat.FieldType> = {
  order: 0,
  shipTo: 1,
  shipper: 2,
  product: 3,
  item: 4
};

/** 编辑器分组（顺序与标题按后端 fieldType 语义，不依赖 fields-config 的分区书写顺序） */
const fieldTypeGroups: Array<{ key: string; fieldType: Api.InputFormat.FieldType; title: string }> = [
  { key: '0', fieldType: 0, title: '运单信息' },
  { key: '1', fieldType: 1, title: '收件人信息' },
  { key: '2', fieldType: 2, title: '发件人信息' },
  { key: '3', fieldType: 3, title: '物品信息' },
  { key: '4', fieldType: 4, title: '子件信息' }
];

/** 组装分组键：底稿中 disabled 的字段在编辑器里锁定（勾选态不可取消） */
function fieldKeyOf(fieldType: number, key: string) {
  return `${Number(fieldType)}:${key}`;
}

/** 编辑器分组（字段清单来自 fields-config，锁定态来自底稿 fieldList） */
export function buildNavGroups(baseFieldList?: Api.InputFormat.Field[]): FieldMappingGroup[] {
  const lockedKeys = new Set(
    (baseFieldList ?? []).filter(item => item.disabled === true).map(item => fieldKeyOf(item.fieldType, item.key))
  );

  return fieldTypeGroups.map(group => ({
    key: group.key,
    title: group.title,
    fields: fieldsConfig
      .filter(field => domainToFieldType[field.fieldType] === group.fieldType)
      .map(field => {
        const disabled = lockedKeys.has(fieldKeyOf(group.fieldType, field.key));
        return { key: field.key, label: field.label, disabled };
      })
  }));
}

/** 后端 fieldList → 编辑器模型（按 fieldType 分组，项存在即显示，required=1 即必填） */
export function fieldListToMapping(fieldList?: Api.InputFormat.Field[]): Record<string, FieldMappingValue> {
  const mapping: Record<string, FieldMappingValue> = {};

  (fieldList ?? []).forEach(item => {
    const groupKey = String(Number(item.fieldType));
    const group = mapping[groupKey] ?? { show: [], required: [] };
    mapping[groupKey] = group;

    if (!group.show.includes(item.key)) group.show.push(item.key);
    if (item.required === 1 && !group.required.includes(item.key)) group.required.push(item.key);
  });

  return mapping;
}

/**
 * 底稿 → 编辑器模型（新增态：默认一个都不勾）
 *
 * 用于「新增」：底稿仍整体保留以保证字段附加属性完整，但初始勾选为空。
 * 唯一例外是 `disabled === true` 的锁定项 —— 锁定项在编辑器里勾选框不可取消，
 * 且 `mappingToFieldList` 对锁定项强制保留，初始不勾会造成「看着没选、保存却被带上」的错位。
 */
export function initialMappingOf(fieldList?: Api.InputFormat.Field[]): Record<string, FieldMappingValue> {
  const checkedKeys = new Set(
    (fieldList ?? []).filter(item => item.disabled === true).map(item => fieldKeyOf(item.fieldType, item.key))
  );

  const result: Record<string, FieldMappingValue> = {};
  Object.entries(fieldListToMapping(fieldList)).forEach(([groupKey, value]) => {
    const show = value.show.filter(key => checkedKeys.has(`${groupKey}:${key}`));
    if (show.length) result[groupKey] = { show, required: value.required.filter(key => show.includes(key)) };
  });

  return result;
}

/** 取某分组在编辑器模型里的勾选值（缺省视为全空） */
function groupMappingOf(mapping: Record<string, FieldMappingValue>, groupKey: string): FieldMappingValue {
  return mapping[groupKey] ?? { show: [], required: [] };
}

/**
 * 编辑器模型 + 底稿 → 后端 fieldList
 *
 * 1. 底稿项按原顺序保留，**附加属性（keyMap/options/disabled/renderName…）原样透传**，只改写 required；
 * 2. 被取消显示的底稿项丢弃（`disabled` 的锁定项强制保留）；
 * 3. fields-config 中有、底稿中没有、但本次勾选的字段，追加到所属分组末尾（生成最小项）。
 */
export function mappingToFieldList(
  mapping: Record<string, FieldMappingValue>,
  baseFieldList?: Api.InputFormat.Field[]
): Api.InputFormat.Field[] {
  const base = baseFieldList ?? [];
  const result: Api.InputFormat.Field[] = [];

  fieldTypeGroups.forEach(({ key: groupKey, fieldType }) => {
    const { show, required } = groupMappingOf(mapping, groupKey);
    const showSet = new Set(show);
    const requiredSet = new Set(required);
    const baseItems = base.filter(item => Number(item.fieldType) === fieldType);
    const baseKeys = new Set(baseItems.map(item => item.key));

    baseItems.forEach(item => {
      if (!showSet.has(item.key) && item.disabled !== true) return;
      result.push({ ...item, required: requiredSet.has(item.key) ? 1 : 0 });
    });

    fieldsConfig
      .filter(
        field => domainToFieldType[field.fieldType] === fieldType && showSet.has(field.key) && !baseKeys.has(field.key)
      )
      .forEach(field => {
        result.push({
          label: field.label,
          key: field.key,
          type: field.type,
          fieldType,
          required: requiredSet.has(field.key) ? 1 : 0
        });
      });
  });

  // 兜底：底稿里 fieldType 超出 0-4 的项，编辑器不展示也不应该被保存流程丢掉
  base
    .filter(item => !fieldTypeGroups.some(group => group.fieldType === Number(item.fieldType)))
    .forEach(item => result.push({ ...item }));

  return result;
}
