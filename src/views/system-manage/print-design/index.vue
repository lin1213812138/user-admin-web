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
import { printFieldGroups } from './modules/print-fields';
import {
  buildDraggableItems,
  createDesignTemplate,
  initHiprint,
  resetPaperNumberPosition,
  type HiprintApi
} from './modules/use-hiprint';

const route = useRoute();
const { routerBack, routerPushByKey } = useRouterPush();

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
  routerBack();
  // 无历史记录时兜底回到系统设置页
  window.setTimeout(() => {
    if (window.location.pathname.includes('/system-manage/print-design')) {
      void routerPushByKey('system-manage_setting');
    }
  }, 0);
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
  const instance = templateRef.value;
  if (!instance) return;

  currentJson.value = JSON.stringify(instance.getJson());
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
      <div class="print-design-panel w-240px shrink-0 overflow-auto border-r border-#eee dark:border-#333">
        <FieldPanel :groups="printFieldGroups" :basic-elements="basicElements" @ready="handlePanelReady" />
      </div>

      <div class="min-w-0 flex-1 overflow-visible bg-#f5f5f5 p-16px dark:bg-#1f1f1f print-design-canvas">
        <div id="hiprint-printTemplate" :class="{ 'show-grid': showGrid }"></div>
      </div>

      <div class="w-300px shrink-0 overflow-x-hidden overflow-y-auto border-l border-#eee dark:border-#333">
        <div id="PrintElementOptionSetting"></div>
      </div>
    </div>

    <PreviewModal v-model:show="previewVisible" :design-json="currentJson" />
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

/* 布局主滚动容器（__SCROLL_EL_ID__）在设计页禁用滚动，避免拖到可视区外时撑出整页滚动条。
   只禁用该容器，不动 html/body，避免影响 hiprint 的坐标计算。 */
body.print-design-no-scroll #__SCROLL_EL_ID__ {
  overflow: hidden !important;
}
</style>
