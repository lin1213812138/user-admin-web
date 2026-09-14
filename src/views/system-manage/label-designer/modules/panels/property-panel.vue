<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { NCard } from 'naive-ui';
import { $t } from '@/locales';
import NFormWrap from '@/components/Form/index.vue';
import type { FormItemConfig } from '@/components/Form/form-config';
import type { ElementType, LabelElement } from '../core/types';
import { getFieldLabel } from '../core/constant';
import { measureElementHeight } from '../canvas/measure-element';
import { useLabelDesignStore } from '@/store/modules/label-design';

const store = useLabelDesignStore();
const selected = computed(() => store.selected);

const model = ref<Record<string, unknown>>({});
let syncing = false;

/** 仅用于面板展示、不写回元素 options 的 model key（fieldTypeSelect 存 ElementType 值，切换走 updateElementType） */
const UI_ONLY_KEYS = ['fieldTypeSelect'];

/** 元素类型 → 字段类型文案 */
const TYPE_LABEL_KEYS: Partial<Record<ElementType, App.I18n.I18nKey>> = {
  text: 'page.manage.labelDesign.fieldTypeText',
  longText: 'page.manage.labelDesign.fieldTypeLongText',
  image: 'page.manage.labelDesign.fieldTypeImage',
  barcode: 'page.manage.labelDesign.fieldTypeBarcode',
  qrcode: 'page.manage.labelDesign.fieldTypeQrcode'
};

/** 字段类型下拉可选范围：5 种数据类；矩形 / 线条无数据语义，不参与互转 */
const SWITCHABLE_TYPES: ElementType[] = ['text', 'longText', 'image', 'barcode', 'qrcode'];

function typeLabel(type: ElementType): string {
  const key = TYPE_LABEL_KEYS[type];
  return key ? $t(key) : '';
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function buildModel() {
  const el = store.selected;
  if (!el) {
    model.value = {};
    return;
  }
  const base: Record<string, unknown> = { ...el.options, fieldTypeSelect: el.type };
  // 受控空值兜底，必须在展开 options 之后：defaultOptionsFor 会写入显式为 undefined 的键
  // （title: seed.title 等），展开时 undefined 会覆盖掉前置空串；undefined 会让 naive
  // 输入组件回落到实例内部非受控值，残留上一元素显示的旧值。
  // 内容键按元素类型限定：曾不分类型兜 text/value/src，把空 text 键回写进条码 options，
  // resolveDisplayText 按键存在优先取 text，空串遮蔽了编码值（value），画布永远渲染空。
  base.title ??= '';
  base.field ??= '';
  const contentKeyMap: Partial<Record<ElementType, string>> = {
    text: 'text',
    longText: 'text',
    barcode: 'value',
    qrcode: 'value',
    image: 'src'
  };
  const contentKey = contentKeyMap[el.type];
  if (contentKey) base[contentKey] ??= '';
  // 旧 designJson 的文本元素可能缺 verticalAlign：补受控默认值，避免 NSelect 走非受控分支残留上一元素的选中项
  if (el.type === 'text' || el.type === 'longText') base.verticalAlign ??= 'top';
  // 旧 designJson 的 barcode 可能缺 displayValue：补默认开，保证「显示值」开关与渲染兜底一致
  if (el.type === 'barcode' && !('displayValue' in el.options)) base.displayValue = true;
  model.value = {
    x: round2(el.x),
    y: round2(el.y),
    width: round2(el.width),
    height: round2(el.height),
    ...base
  };
}

watch(
  () => store.selectedId,
  () => {
    syncing = true;
    buildModel();
    nextTick(() => (syncing = false));
  },
  { immediate: true }
);

// 拖拽/缩放时实时同步右侧面板：优先消费拖动预览（画布高频帧写入），否则读元素实际值
// （预览只驱动本面板，画布模板不依赖它，不会触发画布渲染；rAF 节流 + syncing 防回写）
let geoRaf = 0;
watch(
  () => {
    const p = store.dragPreview;
    if (p) return `${p.x},${p.y},${p.width},${p.height}`;
    const el = store.selected;
    return el ? `${el.x},${el.y},${el.width},${el.height}` : '';
  },
  () => {
    if (geoRaf) return;
    geoRaf = requestAnimationFrame(() => {
      geoRaf = 0;
      const el = store.selected;
      if (!el) return;
      const src = store.dragPreview ?? el;
      syncing = true;
      model.value = {
        ...model.value,
        x: round2(src.x),
        y: round2(src.y),
        width: round2(src.width),
        height: round2(src.height)
      };
      nextTick(() => (syncing = false));
    });
  }
);

watch(
  model,
  () => {
    if (syncing) return;
    const el = store.selected;
    if (!el) return;
    // 类型切换是结构性变更（迁移 options + 重置尺寸）：单独处理，不落入下方几何 + options 的常规写回
    const nextType = model.value.fieldTypeSelect;
    if (nextType && nextType !== el.type) {
      syncing = true;
      store.updateElementType(el.id, nextType as ElementType);
      // 切到文本：高度按内容实测自适应（与拖拽落纸同口径）；测量异步、只写回 height，
      // 不再额外入撤销栈（与类型切换同属一次操作），undo 一步即可恢复切换前状态
      if (nextType === 'text') {
        const snapshot = JSON.parse(JSON.stringify(el)) as LabelElement;
        measureElementHeight(snapshot).then(h => {
          // 测量期间元素可能被删除或再次切换类型，写回前校验仍是该元素的文本形态
          if (h && store.selected?.id === el.id && store.selected.type === 'text') {
            store.updateElement(el.id, { height: h });
          }
        });
      }
      // 迁移后元素 options / 尺寸已变，重建面板受控值（新类型各项默认全部写入 model）
      buildModel();
      nextTick(() => (syncing = false));
      return;
    }
    const reservedKeys = ['x', 'y', 'width', 'height', ...UI_ONLY_KEYS];
    const rest = Object.fromEntries(Object.entries(model.value).filter(([key]) => !reservedKeys.includes(key)));
    store.updateElement(el.id, {
      x: Number(model.value.x) || 0,
      y: Number(model.value.y) || 0,
      width: Number(model.value.width) || 1,
      height: Number(model.value.height) || 1
    });
    store.updateElementOptions(el.id, rest as Record<string, unknown>);
  },
  { deep: true }
);

const SYMBOLOGIES = ['code128', 'code39'];

const geoItems = computed<FormItemConfig[]>(() => [
  { key: 'x', label: $t('page.manage.labelDesign.propX'), type: 'number', span: 12 },
  { key: 'y', label: $t('page.manage.labelDesign.propY'), type: 'number', span: 12 },
  { key: 'width', label: $t('page.manage.labelDesign.propW'), type: 'number', span: 12 },
  { key: 'height', label: $t('page.manage.labelDesign.propH'), type: 'number', span: 12 }
]);

// ===================== 数据预览（合并原「内容与绑定」字段 + 标题 / 关联标题 / 占位文本） =====================

/** 数据预览栏适用元素（矩形 / 线条无数据语义，不显示） */
const showDataPreview = computed(() => {
  const type = selected.value?.type;
  return !!type && ['text', 'longText', 'image', 'barcode', 'qrcode'].includes(type);
});

const dataItems = computed<FormItemConfig[]>(() => {
  const type = selected.value?.type;
  if (!type) return [];
  const fieldTypeItem: FormItemConfig = {
    key: 'fieldTypeSelect',
    label: $t('page.manage.labelDesign.propFieldType'),
    type: 'select',
    span: 24,
    options: SWITCHABLE_TYPES.map(t => ({ label: typeLabel(t), value: t }))
  };
  const titleItems: FormItemConfig[] = [
    { key: 'title', label: $t('page.manage.labelDesign.propTitleName'), type: 'custom', span: 24 },
    fieldTypeItem,
    { key: 'showTitle', label: $t('page.manage.labelDesign.propLinkTitle'), type: 'switch', span: 24 }
  ];
  const fieldItem: FormItemConfig = {
    key: 'field',
    label: $t('page.manage.labelDesign.propField'),
    type: 'input',
    span: 24
  };
  switch (type) {
    case 'text':
    case 'longText':
      return [
        ...titleItems,
        { key: 'text', label: $t('page.manage.labelDesign.propTestData'), type: 'input', span: 24 },
        fieldItem
      ];
    case 'barcode':
      return [
        ...titleItems,
        { key: 'value', label: $t('page.manage.labelDesign.propTestData'), type: 'input', span: 24 },
        // 「显示编码值」开关紧跟编码值输入（控制条码下方人读文本，从样式卡挪入，状态一目了然）
        { key: 'displayValue', label: $t('page.manage.labelDesign.propDisplayValue'), type: 'switch', span: 24 },
        fieldItem
      ];
    case 'qrcode':
      return [
        ...titleItems,
        { key: 'value', label: $t('page.manage.labelDesign.propTestData'), type: 'input', span: 24 },
        fieldItem
      ];
    case 'image':
      return [
        fieldTypeItem,
        { key: 'src', label: $t('page.manage.labelDesign.propSrc'), type: 'input', span: 24 },
        fieldItem
      ];
    default:
      return [];
  }
});

/** 底部绑定信息：`字段: {字段中文名} ({字段key})`，未绑定时提示 */
const fieldBindText = computed(() => {
  const o = selected.value?.options;
  const field = o && 'field' in o ? o.field : undefined;
  const prefix = $t('page.manage.labelDesign.fieldLabel');
  if (!field) return `${prefix}: ${$t('page.manage.labelDesign.fieldUnbound')}`;
  return `${prefix}: ${getFieldLabel(field) || field} (${field})`;
});

/** 「关联标题」是否开启：关闭时标题已不显示，样式卡里的标题样式项随之隐藏 */
const titleEnabled = computed(() => {
  const o = selected.value?.options;
  return !!o && 'showTitle' in o && Boolean(o.showTitle);
});

/** 标题样式配置（文本 / 条码 / 二维码共用，置于各类型样式项最前；行内流下标题对齐跟随内容，无「标题对齐」项） */
const titleStyleItems = computed<FormItemConfig[]>(() => [
  { key: 'titleFontSize', label: $t('page.manage.labelDesign.propTitleFontSize'), type: 'number', span: 12 },
  { key: 'titleColor', label: $t('page.manage.labelDesign.propTitleColor'), type: 'color', span: 12 },
  {
    key: 'titleFontWeight',
    label: $t('page.manage.labelDesign.propTitleWeight'),
    type: 'select',
    span: 12,
    options: [
      { label: $t('page.manage.labelDesign.weightNormal'), value: 'normal' },
      { label: $t('page.manage.labelDesign.weightBold'), value: 'bold' }
    ]
  }
]);

/** 水平对齐选项（样式区由 custom slot 渲染两列，抽为常量避免模板内重复定义） */
const alignOptions = computed(() => [
  { label: $t('page.manage.labelDesign.alignLeft'), value: 'left' },
  { label: $t('page.manage.labelDesign.alignCenter'), value: 'center' },
  { label: $t('page.manage.labelDesign.alignRight'), value: 'right' }
]);

/** 垂直对齐选项 */
const valignOptions = computed(() => [
  { label: $t('page.manage.labelDesign.valignTop'), value: 'top' },
  { label: $t('page.manage.labelDesign.valignMiddle'), value: 'middle' },
  { label: $t('page.manage.labelDesign.valignBottom'), value: 'bottom' }
]);

/** 「显示边框」是否开启：关闭时边框宽度/颜色项随之隐藏 */
const borderEnabled = computed(() => {
  const o = selected.value?.options;
  return !!o && 'showBorder' in o && Boolean(o.showBorder);
});

/** 边框样式配置（文本 / 条码 / 二维码共用） */
const borderStyleItems = computed<FormItemConfig[]>(() => [
  { key: 'showBorder', label: $t('page.manage.labelDesign.propShowBorder'), type: 'switch', span: 12 },
  ...(borderEnabled.value
    ? ([
        { key: 'borderWidth', label: $t('page.manage.labelDesign.propBorderWidth'), type: 'number', span: 12 },
        { key: 'borderColor', label: $t('page.manage.labelDesign.propBorderColor'), type: 'color', span: 12 }
      ] as FormItemConfig[])
    : [])
]);

const styleItems = computed<FormItemConfig[]>(() => {
  const type = selected.value?.type;
  switch (type) {
    case 'text':
    case 'longText':
      return [
        ...(titleEnabled.value ? titleStyleItems.value : []),
        { key: 'fontSize', label: $t('page.manage.labelDesign.propFontSize'), type: 'number', span: 12 },
        { key: 'color', label: $t('page.manage.labelDesign.propColor'), type: 'color', span: 12 },
        {
          key: 'fontWeight',
          label: $t('page.manage.labelDesign.propWeight'),
          type: 'select',
          span: 12,
          options: [
            { label: $t('page.manage.labelDesign.weightNormal'), value: 'normal' },
            { label: $t('page.manage.labelDesign.weightBold'), value: 'bold' }
          ]
        },
        // 水平 / 垂直对齐合并为一个整行（custom slot 内两列并排），避免被标题样式项的奇偶变化拆到两行；
        // label 为空必须显式 showLabel:false，否则 naive 的 mergedShowLabel 默认为 true，会留一行空 label 高度
        { key: 'alignGroup', label: '', type: 'custom', span: 24, showLabel: false },
        { key: 'lineHeight', label: $t('page.manage.labelDesign.propLineHeight'), type: 'number', span: 12 },
        ...borderStyleItems.value
      ];
    case 'barcode':
      // 条码标题拼进图内编码值行（与编码值同字号、黑白），无独立标题样式，不显示 titleStyleItems
      return [
        {
          key: 'symbology',
          label: $t('page.manage.labelDesign.propSymbology'),
          type: 'select',
          span: 12,
          options: SYMBOLOGIES.map(v => ({ label: v, value: v }))
        },
        { key: 'fontSize', label: $t('page.manage.labelDesign.propFontSize'), type: 'number', span: 12 },
        { key: 'textGap', label: $t('page.manage.labelDesign.propTextGap'), type: 'number', span: 12 },
        ...borderStyleItems.value
      ];
    case 'qrcode':
      return [
        ...(titleEnabled.value ? titleStyleItems.value : []),
        {
          key: 'ecc',
          label: $t('page.manage.labelDesign.propEcc'),
          type: 'select',
          span: 12,
          options: ['L', 'M', 'Q', 'H'].map(v => ({ label: v, value: v }))
        },
        ...borderStyleItems.value
      ];
    case 'rect':
      return [
        { key: 'borderWidth', label: $t('page.manage.labelDesign.propBorderWidth'), type: 'number', span: 12 },
        { key: 'borderColor', label: $t('page.manage.labelDesign.propBorderColor'), type: 'color', span: 12 },
        { key: 'bgColor', label: $t('page.manage.labelDesign.propBgColor'), type: 'color', span: 12 },
        { key: 'radius', label: $t('page.manage.labelDesign.propRadius'), type: 'number', span: 12 }
      ];
    case 'hline':
    case 'vline':
      return [
        { key: 'borderWidth', label: $t('page.manage.labelDesign.propBorderWidth'), type: 'number', span: 12 },
        { key: 'borderColor', label: $t('page.manage.labelDesign.propBorderColor'), type: 'color', span: 12 }
      ];
    default:
      return [];
  }
});

function handleDelete() {
  if (selected.value) store.removeElement(selected.value.id);
}
</script>

<template>
  <div class="property-panel flex h-full min-w-0 flex-col overflow-hidden">
    <NEmpty v-if="!selected" :description="$t('page.manage.labelDesign.noSelection')" class="m-auto" />
    <template v-else>
      <NScrollbar class="flex-1 overflow-hidden">
        <div class="p-12px">
          <!-- 与左侧字段面板同款：无卡片、单个 NCollapse、header flex-1 让箭头贴右；各 item 内容包白底描边卡 -->
          <NCollapse :default-expanded-names="['geo', 'dataPreview', 'style']" arrow-placement="right">
            <NCollapseItem name="geo">
              <template #header>
                <span class="flex-1">{{ $t('page.manage.labelDesign.sectionGeo') }}</span>
              </template>
              <!-- 窄面板（300px）下 NGrid cols=24 的 23 个列间隙（23×16=368px）会压塌轨道导致表单溢出，此处调小 x-gap -->
              <NCard size="small">
                <NFormWrap
                  :model="model"
                  :items="geoItems"
                  size="small"
                  label-placement="top"
                  grid-responsive="self"
                  :grid-x-gap="8"
                />
              </NCard>
            </NCollapseItem>
            <NCollapseItem v-if="showDataPreview" name="dataPreview">
              <template #header>
                <span class="flex-1">{{ $t('page.manage.labelDesign.dataPreview') }}</span>
              </template>
              <NCard size="small">
                <NFormWrap
                  :model="model"
                  :items="dataItems"
                  size="small"
                  label-placement="left"
                  grid-responsive="self"
                  :grid-x-gap="8"
                >
                  <template #title>
                    <NInput
                      v-model:value="model.title as string"
                      :placeholder="$t('page.manage.labelDesign.placeholderInputTip')"
                      clearable
                    >
                      <template #suffix>
                        <NTooltip trigger="hover" placement="top">
                          <template #trigger>
                            <icon-ic-baseline-help-outline class="cursor-help text-14px text-#999 dark:text-#666" />
                          </template>
                          {{ $t('page.manage.labelDesign.titleNameTip') }}
                        </NTooltip>
                      </template>
                    </NInput>
                  </template>
                </NFormWrap>
                <div
                  class="mt-8px rounded-4px bg-#f5f5f5 px-8px py-6px text-12px text-#666 dark:bg-#262626 dark:text-#999"
                >
                  {{ fieldBindText }}
                </div>
              </NCard>
            </NCollapseItem>
            <NCollapseItem v-if="styleItems.length" name="style">
              <template #header>
                <span class="flex-1">{{ $t('page.manage.labelDesign.sectionStyle') }}</span>
              </template>
              <NCard size="small">
                <NFormWrap
                  :model="model"
                  :items="styleItems"
                  size="small"
                  label-placement="top"
                  grid-responsive="self"
                  :grid-x-gap="8"
                >
                  <!-- 对齐组：水平 / 垂直对齐并排一行，两个 NFormItem 各带 label、样式与其它项一致 -->
                  <template #alignGroup>
                    <div class="w-full flex gap-8px">
                      <NFormItem
                        class="min-w-0 flex-1"
                        :label="$t('page.manage.labelDesign.propAlignH')"
                        :show-feedback="false"
                      >
                        <NSelect
                          v-model:value="model.align as 'left' | 'center' | 'right'"
                          size="small"
                          :options="alignOptions"
                        />
                      </NFormItem>
                      <NFormItem
                        class="min-w-0 flex-1"
                        :label="$t('page.manage.labelDesign.propAlignV')"
                        :show-feedback="false"
                      >
                        <NSelect
                          v-model:value="model.verticalAlign as 'top' | 'middle' | 'bottom'"
                          size="small"
                          :options="valignOptions"
                        />
                      </NFormItem>
                    </div>
                  </template>
                </NFormWrap>
              </NCard>
            </NCollapseItem>
          </NCollapse>
        </div>
      </NScrollbar>
      <div class="border-t border-#e5e7eb px-12px py-8px dark:border-#2a2a2a">
        <NButton type="error" block @click="handleDelete">{{ $t('page.manage.labelDesign.deleteElement') }}</NButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.property-panel :deep(.n-card) {
  min-width: 0;
}
.property-panel :deep(.n-form-item-label) {
  font-size: 12px;
}
.property-panel :deep(.n-grid) {
  width: 100%;
}
.property-panel :deep(.n-grid-item),
.property-panel :deep(.n-form-item),
.property-panel :deep(.n-form-item-blank),
.property-panel :deep(.n-input),
.property-panel :deep(.n-input-number),
.property-panel :deep(.n-select) {
  min-width: 0;
  width: 100%;
}
</style>
