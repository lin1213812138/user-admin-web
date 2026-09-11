<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { NCard } from 'naive-ui';
import { $t } from '@/locales';
import NFormWrap from '@/components/Form/index.vue';
import type { FormItemConfig } from '@/components/Form/form-config';
import { useLabelDesignStore } from '@/store/modules/label-design';

const store = useLabelDesignStore();
const selected = computed(() => store.selected);

const model = ref<Record<string, unknown>>({});
let syncing = false;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function buildModel() {
  const el = store.selected;
  model.value = el
    ? {
        x: round2(el.x),
        y: round2(el.y),
        width: round2(el.width),
        height: round2(el.height),
        ...el.options
      }
    : {};
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

// 拖拽/缩放时元素 x/y/w/h 会变化，实时同步回右侧面板（轻量、按帧节流，避免卡顿）
let geoRaf = 0;
watch(
  () => {
    const el = store.selected;
    return el ? `${el.x},${el.y},${el.width},${el.height}` : '';
  },
  () => {
    if (geoRaf) return;
    geoRaf = requestAnimationFrame(() => {
      geoRaf = 0;
      const el = store.selected;
      if (!el) return;
      syncing = true;
      model.value = {
        ...model.value,
        x: round2(el.x),
        y: round2(el.y),
        width: round2(el.width),
        height: round2(el.height)
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
    const { x, y, width, height, ...rest } = model.value;
    store.updateElement(el.id, {
      x: Number(x) || 0,
      y: Number(y) || 0,
      width: Number(width) || 1,
      height: Number(height) || 1
    });
    store.updateElementOptions(el.id, rest as Record<string, unknown>);
  },
  { deep: true }
);

const SYMBOLOGIES = ['code128', 'code39', 'ean13', 'ean8', 'upca'];

const geoItems = computed<FormItemConfig[]>(() => [
  { key: 'x', label: $t('page.manage.labelDesign.propX'), type: 'number', span: 12 },
  { key: 'y', label: $t('page.manage.labelDesign.propY'), type: 'number', span: 12 },
  { key: 'width', label: $t('page.manage.labelDesign.propW'), type: 'number', span: 12 },
  { key: 'height', label: $t('page.manage.labelDesign.propH'), type: 'number', span: 12 }
]);

const contentItems = computed<FormItemConfig[]>(() => {
  const type = selected.value?.type;
  const fieldItem: FormItemConfig = {
    key: 'field',
    label: $t('page.manage.labelDesign.propField'),
    type: 'input',
    span: 12
  };
  switch (type) {
    case 'text':
    case 'longText':
      return [{ key: 'text', label: $t('page.manage.labelDesign.propText'), type: 'input', span: 12 }, fieldItem];
    case 'image':
      return [{ key: 'src', label: $t('page.manage.labelDesign.propSrc'), type: 'input', span: 12 }, fieldItem];
    case 'barcode':
    case 'qrcode':
      return [{ key: 'value', label: $t('page.manage.labelDesign.propValue'), type: 'input', span: 12 }, fieldItem];
    case 'rect':
    case 'hline':
    case 'vline':
      return [];
    default:
      return [];
  }
});

const styleItems = computed<FormItemConfig[]>(() => {
  const type = selected.value?.type;
  switch (type) {
    case 'text':
    case 'longText':
      return [
        { key: 'fontSize', label: $t('page.manage.labelDesign.propFontSize'), type: 'number', span: 12 },
        { key: 'color', label: $t('page.manage.labelDesign.propColor'), type: 'color', span: 12 },
        {
          key: 'fontWeight',
          label: $t('page.manage.labelDesign.propWeight'),
          type: 'select',
          span: 12,
          options: [
            { label: 'normal', value: 'normal' },
            { label: 'bold', value: 'bold' }
          ]
        },
        {
          key: 'align',
          label: $t('page.manage.labelDesign.propAlign'),
          type: 'select',
          span: 12,
          options: [
            { label: 'left', value: 'left' },
            { label: 'center', value: 'center' },
            { label: 'right', value: 'right' }
          ]
        },
        { key: 'lineHeight', label: $t('page.manage.labelDesign.propLineHeight'), type: 'number', span: 12 }
      ];
    case 'barcode':
      return [
        {
          key: 'symbology',
          label: $t('page.manage.labelDesign.propSymbology'),
          type: 'select',
          span: 12,
          options: SYMBOLOGIES.map(v => ({ label: v, value: v }))
        },
        { key: 'displayValue', label: $t('page.manage.labelDesign.propDisplayValue'), type: 'switch', span: 12 },
        { key: 'fontSize', label: $t('page.manage.labelDesign.propFontSize'), type: 'number', span: 12 }
      ];
    case 'qrcode':
      return [
        {
          key: 'ecc',
          label: $t('page.manage.labelDesign.propEcc'),
          type: 'select',
          span: 12,
          options: ['L', 'M', 'Q', 'H'].map(v => ({ label: v, value: v }))
        }
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
        <div class="space-y-12px p-12px">
          <NCard size="small" title="位置与尺寸" :segmented="{ content: true }">
            <NFormWrap :model="model" :items="geoItems" label-placement="top" grid-responsive="self" />
          </NCard>

          <NCard v-if="contentItems.length" size="small" title="内容与绑定" :segmented="{ content: true }">
            <NFormWrap :model="model" :items="contentItems" label-placement="top" grid-responsive="self" />
          </NCard>

          <NCard v-if="styleItems.length" size="small" title="样式" :segmented="{ content: true }">
            <NFormWrap :model="model" :items="styleItems" label-placement="top" grid-responsive="self" />
          </NCard>
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
