<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import type { PrintTemplate } from 'vue-plugin-hiprint';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetPrintTemplateDetail, fetchSavePrintTemplateDesign } from '@/service/api/print-format';
import FieldPanel from './modules/field-panel.vue';
import PreviewModal from './modules/preview-modal.vue';
import ToolBar from './modules/tool-bar.vue';
import { basicElements } from './modules/basic-elements';
import { parseLabelSize } from './modules/paper-sizes';
import { buildSampleData, printFieldGroups } from './modules/print-fields';
import printLockCss from 'vue-plugin-hiprint/dist/print-lock.css?url';
import {
  buildDraggableItems,
  createDesignTemplate,
  initHiprint,
  resetPaperNumberPosition,
  type HiprintApi
} from './modules/use-hiprint';

const route = useRoute();
const { routerPushByKey } = useRouterPush();

const templateId = Number(route.query.id ?? 0);
const templateName = String(route.query.name ?? '');

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const SCALE_STEP = 0.1;

const paperSize = ref('100×150mm');
const scale = ref(1);
const showGrid = ref(true);
const saving = ref(false);
const previewVisible = ref(false);
const currentJson = ref('');
const previewHtml = ref('');

/** getHtml 的返回值在部分版本是 DTO / 数组，这里统一取字符串 */
function toHtmlString(result: unknown): string {
  if (typeof result === 'string') return result;
  if (Array.isArray(result)) return result.map(toHtmlString).join('');
  const target = result as { html?: () => string };
  return typeof target.html === 'function' ? target.html() : '';
}

/** hiprint 实例与模板实例用 shallowRef，避免被深度响应式代理 */
const apiRef = shallowRef<HiprintApi | null>(null);
const templateRef = shallowRef<PrintTemplate | null>(null);

/** 字段面板拖拽注册的清理函数 */
let unbindDraggable: (() => void) | undefined;

function applyPaper(resetPageNumber = false) {
  const paper = parseLabelSize(paperSize.value);
  // 先让 hiprint 把页码视为“超出边界”，setPaper 内部 resize 时会自动钳制回右下角默认值
  if (resetPageNumber && templateRef.value) {
    resetPaperNumberPosition(templateRef.value);
  }
  templateRef.value?.setPaper(paper.width, paper.height);
}

function handlePanelReady(root: HTMLElement | null) {
  const api = apiRef.value;
  if (!api) return;
  unbindDraggable?.();
  unbindDraggable = buildDraggableItems(api, root);
}

function handleBack() {
  // 返回系统设置页，并自动切换到「打印格式」分页
  void routerPushByKey('system-manage_setting', { query: { tab: 'print-format' } });
}

function handleZoom(delta: number) {
  const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number((scale.value + delta).toFixed(1))));
  scale.value = next;
  templateRef.value?.zoom(next, true);
}

function handleToggleGrid() {
  showGrid.value = !showGrid.value;
}

function handlePaperChange(value: string) {
  paperSize.value = value;
  applyPaper(true);
}

/** 重建一个空白设计器实例（清空时若实例不支持 clear 则走这里） */
function rebuildTemplate() {
  const api = apiRef.value;
  if (!api) return;

  const instance = createDesignTemplate(api, {});
  instance.design('#hiprint-printTemplate');
  templateRef.value = instance;
  applyPaper(true);
}

function handleClear() {
  window.$dialog?.warning({
    title: $t('page.manage.printDesign.clearConfirm'),
    content: $t('page.manage.printDesign.clearContent'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      const instance = templateRef.value;
      if (instance?.clear) {
        instance.clear();
        applyPaper();
      } else {
        rebuildTemplate();
      }
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
}

async function handleSave() {
  const instance = templateRef.value;
  if (!instance || !templateId) return;

  saving.value = true;
  try {
    currentJson.value = JSON.stringify(instance.getJson());
    await fetchSavePrintTemplateDesign({ id: templateId, designJson: currentJson.value, paperSize: paperSize.value });
    window.$message?.success($t('page.manage.printDesign.saveSuccess'));
  } finally {
    saving.value = false;
  }
}

function handlePreview() {
  const api = apiRef.value;
  const instance = templateRef.value;
  if (!api || !instance) return;

  currentJson.value = JSON.stringify(instance.getJson());
  // 用已加载的 hiprint 实例直接生成预览 HTML，避免 PreviewModal 内异步加载导致首开空白、需点两次
  const tpl = new api.PrintTemplate({ template: JSON.parse(currentJson.value) });
  const body = toHtmlString(tpl.getHtml(buildSampleData()));
  // 在预览文档内隐藏滚动条（保留滚轮滚动），避免预览界面出现滚动条
  const hideScrollStyle =
    '<style>html,body{scrollbar-width:none}html::-webkit-scrollbar,body::-webkit-scrollbar{width:0;height:0}</style>';
  previewHtml.value = `<!DOCTYPE html><html><head><meta charset="utf-8" /><link rel="stylesheet" href="${printLockCss}" />${hideScrollStyle}</head><body>${body}</body></html>`;
  previewVisible.value = true;
}

onMounted(async () => {
  // 进入设计页后禁用整页滚动，避免元素拖到可视区外时撑出浏览器滚动条
  document.body.classList.add('print-design-no-scroll');

  if (!templateId) {
    window.$message?.error($t('page.manage.printDesign.noTemplate'));
    return;
  }

  try {
    // 该模块 DEV 下返回裸数据（无 { data, error } 包裹），故此处直接断言为模板实体
    const detail = (await fetchGetPrintTemplateDetail(templateId)) as Api.PrintFormat.Template;
    paperSize.value = detail.paperSize || detail.labelSize;

    const api = await initHiprint();
    apiRef.value = api;

    let template: unknown = {};
    if (detail.designJson) {
      try {
        template = JSON.parse(detail.designJson) as unknown;
      } catch {
        template = {};
      }
    }

    const instance = createDesignTemplate(api, template);
    instance.design('#hiprint-printTemplate');
    templateRef.value = instance;
    applyPaper();

    await nextTick();
    handlePanelReady(document.querySelector<HTMLElement>('.print-design-panel'));
  } catch (error) {
    console.error('[print-design] load failed', error);
    window.$message?.error(`${$t('page.manage.printDesign.loadFailed')}: ${String(error)}`);
  }
});

onBeforeUnmount(() => {
  unbindDraggable?.();
  document.body.classList.remove('print-design-no-scroll');
});
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden">
    <ToolBar
      :title="templateName"
      :paper-size="paperSize"
      :scale="scale"
      :show-grid="showGrid"
      @back="handleBack"
      @update:paper-size="handlePaperChange"
      @zoom-out="handleZoom(-SCALE_STEP)"
      @zoom-in="handleZoom(SCALE_STEP)"
      @toggle-grid="handleToggleGrid"
      @clear="handleClear"
      @save="handleSave"
      @preview="handlePreview"
    />

    <div class="min-h-0 flex flex-1">
      <div class="print-design-panel w-240px shrink-0 border-r border-#eee dark:border-#333">
        <FieldPanel :groups="printFieldGroups" :basic-elements="basicElements" @ready="handlePanelReady" />
      </div>

      <div class="min-w-0 flex-1 bg-#f5f5f5 p-16px dark:bg-#1f1f1f print-design-canvas">
        <NScrollbar class="h-full" x-scrollable>
          <div id="hiprint-printTemplate" :class="{ 'show-grid': showGrid }"></div>
        </NScrollbar>
      </div>

      <div class="w-300px shrink-0 border-l border-#eee dark:border-#333">
        <NScrollbar class="h-full">
          <div id="PrintElementOptionSetting"></div>
        </NScrollbar>
      </div>
    </div>

    <PreviewModal v-model:show="previewVisible" :html="previewHtml" />
  </div>
</template>

<style>
/* 仅在设计模式下显示网格辅助线，打印/预览时不带 grid 类因此不会出现 */
.show-grid .hiprint-printPaper.design {
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
  background-size: 5mm 5mm;
}

.dark .show-grid .hiprint-printPaper.design {
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px);
}

/* 设计页禁用整页滚动：布局主滚动容器（__SCROLL_EL_ID__）、body、html 一起关掉，
   避免元素拖到可视区外/内容撑高时在最右侧出现整页滚动条。 */
body.print-design-no-scroll,
body.print-design-no-scroll #__SCROLL_EL_ID__,
html:has(body.print-design-no-scroll) {
  overflow: hidden !important;
}

/* 右侧属性面板：hiprint 原生 #PrintElementOptionSetting 重做成接近 Naive UI 风格。
   复用 Naive 的 CSS 变量，自动跟随明暗主题。 */
#PrintElementOptionSetting {
  --pp-primary: var(--n-primary-color, #2080f0);
  --pp-primary-hover: var(--n-primary-color-hover, #4098fc);
  --pp-primary-suppl: var(--n-primary-color-suppl, rgba(32, 128, 240, 0.2));
  --pp-text: var(--n-text-color, #333639);
  --pp-text-2: var(--n-text-color-2, #646a73);
  --pp-text-3: var(--n-text-color-3, #8a8f99);
  --pp-border: var(--n-border-color, #e5e6eb);
  --pp-divider: var(--n-divider-color, #f0f0f0);
  --pp-input-bg: var(--n-input-color, #ffffff);
  --pp-fill: var(--n-fill-color, #f7f8fa);
  --pp-radius: var(--n-border-radius, 3px);
  --pp-font: var(
    --n-font-family,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'PingFang SC',
    'Microsoft YaHei',
    Arial,
    sans-serif
  );

  font-family: var(--pp-font);
  font-size: 13px;
  line-height: 1.6;
  color: var(--pp-text);
  padding: 12px;
}

#PrintElementOptionSetting input[type='text'],
#PrintElementOptionSetting input[type='number'],
#PrintElementOptionSetting input:not([type]),
#PrintElementOptionSetting select,
#PrintElementOptionSetting textarea {
  box-sizing: border-box !important;
  width: 100% !important;
  height: 30px !important;
  padding: 0 10px !important;
  font-family: var(--pp-font);
  font-size: 13px !important;
  color: var(--pp-text) !important;
  background-color: var(--pp-input-bg) !important;
  border: 1px solid var(--pp-border) !important;
  border-radius: var(--pp-radius) !important;
  outline: none !important;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

#PrintElementOptionSetting textarea {
  height: auto !important;
  padding: 6px 10px !important;
  resize: vertical;
}

#PrintElementOptionSetting input:focus,
#PrintElementOptionSetting select:focus,
#PrintElementOptionSetting textarea:focus {
  border-color: var(--pp-primary) !important;
  box-shadow: 0 0 0 2px var(--pp-primary-suppl) !important;
}

#PrintElementOptionSetting input[type='checkbox'],
#PrintElementOptionSetting input[type='radio'] {
  width: 14px !important;
  height: 14px !important;
  vertical-align: -2px;
  accent-color: var(--pp-primary);
}

#PrintElementOptionSetting input[type='color'] {
  width: 36px !important;
  height: 28px !important;
  padding: 2px !important;
  background: transparent !important;
  border: 1px solid var(--pp-border) !important;
  border-radius: var(--pp-radius) !important;
  cursor: pointer;
}

#PrintElementOptionSetting label {
  display: inline-block;
  margin-bottom: 4px;
  color: var(--pp-text-2);
  font-size: 13px;
}

#PrintElementOptionSetting .hiprint-option-item,
#PrintElementOptionSetting > div > div {
  margin-bottom: 14px;
}

#PrintElementOptionSetting .hiprint-option-title,
#PrintElementOptionSetting .hiprint-printElement-option-title,
#PrintElementOptionSetting details > summary {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: var(--pp-text);
  font-size: 13px;
  padding: 8px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--pp-divider);
  cursor: pointer;
  user-select: none;
  list-style: none;
}

#PrintElementOptionSetting details > summary::-webkit-details-marker {
  display: none;
}

#PrintElementOptionSetting .hiprint-option-value {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

#PrintElementOptionSetting .hiprint-option-value > * {
  flex: 1 1 120px;
  min-width: 0;
}
</style>
