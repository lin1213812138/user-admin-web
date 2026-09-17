<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import type { PrintTemplate } from 'vue-plugin-hiprint';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetPrintTemplateDetail, fetchSavePrintTemplateDesign } from '@/service/api/print-format';
import { dimensionsToSizeType } from '@/service/api/print-format/size-map';
import FieldPanel from './modules/field-panel.vue';
import PreviewModal from './modules/preview-modal.vue';
import ToolBar from './modules/tool-bar.vue';
import { basicElements } from './modules/basic-elements';
import { parseLabelSize, paperOfSizeType } from './modules/paper-sizes';
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

const templateId = String(route.query.id ?? '');
const templateName = String(route.query.name ?? '');

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;
const SCALE_STEP = 0.1;

const paperSize = ref('100×150mm');
const scale = ref(1);
const showGrid = ref(true);
const showRuler = ref(true);
const tx = ref(0);
const ty = ref(0);
const panning = ref(false);
const saving = ref(false);
const previewVisible = ref(false);
const currentJson = ref('');
const previewHtml = ref('');
/** 当前模板（保存设计时需回带 templateType/templateMode，后端 update 必填） */
const currentTemplate = ref<Api.PrintFormat.Template | null>(null);

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

/** 兼容 hiprint 两种模板结构：{ panels:[{printElements}] } 或顶层 { printElements } 或裸数组 */
function resolvePanels(json: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(json)) return json as Array<Record<string, unknown>>;
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj.panels)) return obj.panels as Array<Record<string, unknown>>;
  if (Array.isArray(obj.printElements)) return [obj];
  return [];
}

/**
 * 从设计器当前模板里提取各字段元素的「测试数据」作为预览填充数据。
 * 这样在右侧属性面板修改测试数据后，预览会显示最新编辑值，而不被固定的 buildSampleData 覆盖。
 * 未编辑（测试数据为空）的字段回退到 buildSampleData 的默认值。
 */
function extractPreviewData(fallback: Record<string, string>): Record<string, string> {
  const data: Record<string, string> = { ...fallback };
  const instance = templateRef.value;
  if (!instance) return data;

  try {
    const json = (instance.getJson() as unknown) ?? {};
    const panels = resolvePanels(json);
    for (const panel of panels) {
      const elements = (panel.printElements as unknown[]) ?? [];
      for (const el of elements) {
        const options = (el as { options?: Record<string, unknown> }).options;
        const field = options?.field;
        const testData = options?.testData;
        if (typeof field === 'string' && field && testData != null && testData !== '') {
          data[field] = String(testData);
        }
      }
    }
  } catch {
    /* 解析失败时退回 fallback（固定示例数据） */
  }
  return data;
}

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

function applyZoom(next: number) {
  next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(next.toFixed(1))));
  if (next === scale.value) return;

  // hiprint zoom 以纸张左上角为锚点缩放（scale<=1 origin "0 0"；scale>1 origin "-scale% -scale%"），
  // 缩放后纸张布局中心向右下偏移 (布局宽高 * 增量)/2；补偿 translate 使纸张中心保持画布中心（围绕纸张中心缩放）。
  const paper = document.querySelector<HTMLElement>('.hiprint-printPaper');
  const pw = paper?.offsetWidth ?? 0;
  const ph = paper?.offsetHeight ?? 0;
  const delta = next - scale.value;
  tx.value -= (pw * delta) / 2;
  ty.value -= (ph * delta) / 2;

  scale.value = next;
  templateRef.value?.zoom(next, true);
}

function handleZoom(delta: number) {
  applyZoom(scale.value + delta);
}

function handleWheel(e: WheelEvent) {
  applyZoom(scale.value + (e.deltaY < 0 ? SCALE_STEP : -SCALE_STEP));
}

/**
 * 捕获阶段拦截鼠标按下（禁用 hiprint 框选 + 平移工作区）：
 * - 纸张内的元素 → 放行，交给 hiprint 拖拽/选中/编辑；
 * - 其余区域（画布空白 + 纸张空白）→ stopPropagation 阻止事件到达 hiprint 的 mousedown 监听器。
 *   hiprint 在 `.hiprint-printPaper` 上冒泡监听 mousedown（无条件置 rectDraging=true，target 是纸张时创建 mouseRect 选框），
 *   在祖先的捕获阶段拦截即可让它收不到事件，从而禁用框选；该区域同时改为平移工作区。
 */
function handleCanvasMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement | null;
  if (target?.closest('.hiprint-printElement')) return;

  e.stopPropagation();

  panning.value = true;
  const startX = e.clientX;
  const startY = e.clientY;
  const baseTx = tx.value;
  const baseTy = ty.value;

  const onMove = (ev: MouseEvent) => {
    tx.value = baseTx + (ev.clientX - startX);
    ty.value = baseTy + (ev.clientY - startY);
  };
  const onUp = () => {
    panning.value = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
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
  const tpl = currentTemplate.value;
  if (!instance || !templateId || !tpl) return;

  saving.value = true;
  try {
    const paper = parseLabelSize(paperSize.value);
    const json = instance.getJson() as unknown;
    // hiprint getJson 可能是数组（printPanels）或对象，统一包成对象；顶层补 mm 宽高与后端 setGenerate 对齐
    const design: Record<string, unknown> = Array.isArray(json)
      ? { panels: json }
      : json && typeof json === 'object'
        ? (json as Record<string, unknown>)
        : {};
    design.width = paper.width;
    design.height = paper.height;
    currentJson.value = JSON.stringify(design);
    const { sizeType } = dimensionsToSizeType(paper.width, paper.height);
    const { error } = await fetchSavePrintTemplateDesign({
      _id: templateId,
      templateType: tpl.templateType,
      templateMode: tpl.templateMode,
      sizeType,
      width: paper.width,
      height: paper.height,
      design
    });
    if (!error) window.$message?.success($t('page.manage.printDesign.saveSuccess'));
  } finally {
    saving.value = false;
  }
}

async function handlePreview() {
  const instance = templateRef.value;
  if (!instance) return;

  // 强制提交属性面板中尚未保存的修改：让当前聚焦的输入框失焦，触发 hiprint 的 change 提交，
  // 否则在面板里改了内容直接点预览时，模型仍是旧值，预览不会更新
  (document.activeElement as HTMLElement | null)?.blur();

  // 等一拍，确保 hiprint 内部模型与画布 DOM 已同步到最新编辑结果
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 0));

  currentJson.value = JSON.stringify(instance.getJson());
  // 直接用设计器实例生成预览 HTML，避免 getJson() → 新模板 round-trip 导致元素位置/状态丢失
  // 设计态多余 UI（拖拽手柄、选中框、属性面板等）通过 CSS 在预览文档中隐藏
  // 预览填充数据取自设计器各字段元素「当前的测试数据」，而非固定的 buildSampleData，
  // 这样在右侧属性面板修改测试数据后，预览能立即反映最新编辑，而不被固定示例值覆盖
  const body = toHtmlString(instance.getHtml(extractPreviewData(buildSampleData())));
  // 隐藏设计态专属元素，只保留纯打印内容
  const hideDesignStyle = [
    '<style>',
    'html,body{scrollbar-width:none;margin:0;padding:0}',
    'html::-webkit-scrollbar,body::-webkit-scrollbar{width:0;height:0}',
    /* 隐藏拖拽手柄、resize 控件、选中边框等设计态 UI */
    '.hiprint-printElement-handle,.hiprint-printElement-move,.hiprint-template-printElement-div:hover::before,.hiprint-template-printElement-div:hover::after,.hiprint-printElement-table-select,.hiprint-printElement-table-selection-box{display:none!important}',
    /* 纸张容器去掉设计态样式 */
    '.hiprint-printPaper{border:none!important;box-shadow:none!important;outline:none!important}',
    '</style>'
  ].join('');
  previewHtml.value = `<!DOCTYPE html><html><head><meta charset="utf-8" /><link rel="stylesheet" href="${printLockCss}" />${hideDesignStyle}</head><body>${body}</body></html>`;
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
    const { data: detail, error } = await fetchGetPrintTemplateDetail(templateId);
    if (error || !detail) throw new Error('template not found');
    currentTemplate.value = detail;
    paperSize.value = paperOfSizeType(detail.sizeType, detail.width, detail.height);

    const api = await initHiprint();
    apiRef.value = api;

    // design 为对象（旧数据可能是 JSON 字符串），解析失败回退空模板
    let template: unknown = {};
    if (detail.design) {
      try {
        template = typeof detail.design === 'string' ? JSON.parse(detail.design) : detail.design;
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
      :show-ruler="showRuler"
      @toggle-ruler="showRuler = !showRuler"
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

      <div
        class="print-design-canvas min-w-0 flex-1 bg-#f5f5f5 dark:bg-#1f1f1f"
        :class="{ 'hide-ruler': !showRuler, panning }"
        @mousedown.capture="handleCanvasMouseDown"
        @wheel.prevent="handleWheel"
      >
        <div class="pd-stage" :style="{ transform: `translate(${tx}px, ${ty}px)` }">
          <div id="hiprint-printTemplate" :class="{ 'show-grid': showGrid }"></div>
        </div>
      </div>

      <div id="Setting" class="w-400px shrink-0 border-l border-#eee dark:border-#333 overflow-auto p-12px"></div>
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

/* 设计态标尺：hiprint 的 .hiprint_rul_wrapper / .h_img / .v_img 样式来自其全局 CSS，
   但本仓库只在预览 iframe 里引入 print-lock.css，设计画布拿不到这份样式，导致标尺不显示。
   这里显式补充（仅作用于设计容器，预览在独立 iframe 中不受影响）。
   另外给设计容器加 16px padding，让标尺通过负 margin 伸到纸张左上角外侧时，
   仍然落在 NScrollbar content 区域内，不会被滚动容器 overflow 裁剪掉。 */
.print-design-canvas {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.print-design-canvas.panning {
  cursor: grabbing;
}

.pd-stage {
  will-change: transform;
}

.print-design-canvas.hide-ruler .hiprint_rul_wrapper {
  display: none !important;
}

#hiprint-printTemplate {
  position: relative;
  padding: 16px;
}

#hiprint-printTemplate .hiprint_rul_wrapper {
  position: absolute;
  height: 100%;
  width: 100%;
  overflow: hidden;
  pointer-events: none;
  border: 0;
  border-top: 1px solid rgb(201, 190, 190);
  border-left: 1px solid rgb(201, 190, 190);
  padding-left: 15px;
  padding-top: 15px;
  margin: -16px;
  box-sizing: content-box !important;
}

#hiprint-printTemplate .hiprint_rul_wrapper .h_img {
  position: absolute;
  top: 0;
  left: 15px;
  width: 400mm;
  height: 15px;
  max-width: none;
}

#hiprint-printTemplate .hiprint_rul_wrapper .v_img {
  width: 400mm;
  max-width: none;
  transform: rotate(90deg);
  transform-origin: 0 100%;
  height: 15px;
  position: absolute;
  top: -2px;
  left: 0;
}
</style>
