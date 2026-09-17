<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { $t } from '@/locales';
import { useLabelDesignStore } from '@/store/modules/label-design';
import { dimensionsToSizeType } from '@/service/api/print-format/size-map';
import { mmToPt, paperOfSizeType, parsePaper } from './modules/core/constant';
import {
  fetchGetPrintTemplateDetail,
  fetchGetPrintTemplateList,
  fetchSavePrintTemplateDesign
} from '@/service/api/print-format';
import ToolBar from './modules/panels/tool-bar.vue';
import FieldPanel from './modules/panels/field-panel.vue';
import DesignCanvas from './modules/canvas/design-canvas.vue';
import PropertyPanel from './modules/panels/property-panel.vue';
import PreviewModal from './modules/panels/preview-modal.vue';

const store = useLabelDesignStore();
const route = useRoute();
const previewVisible = ref(false);

/** 打印格式列表「设计」带 query.id 进来时直接打开该模板；无 id（手输地址/调试）回退到首个模板 */
const queryId = String(route.query.id ?? '');
const currentName = ref(String(route.query.name ?? ''));
const templates = ref<{ label: string; value: string }[]>([]);
const currentId = ref<string | null>(queryId || null);
/** 当前模板（保存设计时需回带 templateType/templateMode，后端 update 必填） */
const currentTemplate = ref<Api.PrintFormat.Template | null>(null);
const loading = ref(false);

async function loadTemplates() {
  const { data: res } = await fetchGetPrintTemplateList({ page: 1, size: 100 });
  templates.value = (res?.list ?? []).map(r => ({ label: r.name, value: r._id }));
  if (templates.value.length > 0 && currentId.value === null) {
    currentId.value = templates.value[0].value;
    await loadTemplate(currentId.value);
  }
}

async function loadTemplate(id: string) {
  loading.value = true;
  try {
    const { data: detail, error } = await fetchGetPrintTemplateDetail(id);
    if (error || !detail) throw new Error('template not found');
    currentTemplate.value = detail;
    // 标题以详情为准回填，详情缺名称时保留 query 带入的名字
    currentName.value = detail.name || currentName.value;
    // design 为对象（旧数据可能是 JSON 字符串），统一转为设计器可解析的 JSON 字符串
    const { design } = detail;
    store.loadFromJson(typeof design === 'string' ? design : design ? JSON.stringify(design) : '');
    store.setPaper(paperOfSizeType(detail.sizeType, detail.width, detail.height));
  } catch {
    window.$message?.error($t('page.manage.labelDesign.loadFailed'));
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  const tpl = currentTemplate.value;
  if (!currentId.value || !tpl) return;
  loading.value = true;
  try {
    const design = JSON.parse(store.toJson()) as Record<string, unknown>;
    const { w, h } = parsePaper(store.template.paperSize);
    // design 顶层补 mm 宽高：后端 setGenerate 会用 design.width/height 覆盖模板宽高，保持一致
    design.width = w;
    design.height = h;
    const { sizeType } = dimensionsToSizeType(w, h);
    const { error } = await fetchSavePrintTemplateDesign({
      _id: currentId.value,
      templateType: tpl.templateType,
      templateMode: tpl.templateMode,
      sizeType,
      width: w,
      height: h,
      design
    });
    if (!error) {
      window.$message?.success($t('page.manage.labelDesign.saveSuccess'));
    } else {
      window.$message?.error($t('page.manage.labelDesign.saveFailed'));
    }
  } catch {
    window.$message?.error($t('page.manage.labelDesign.saveFailed'));
  } finally {
    loading.value = false;
  }
}

function toggleBodyScroll(disable: boolean) {
  document.body.classList.toggle('label-designer-no-scroll', disable);
}

// ---------- 快捷键（步长与旧 mm 版物理手感一致，换算为 pt） ----------
const ARROW_STEP_NORMAL = mmToPt(1);
const ARROW_STEP_FAST = mmToPt(10);
const ARROW_STEP_NUDGE = mmToPt(0.1);

/** 焦点在输入类元素内时不拦截键盘（打字场景） */
function isTypingTarget(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable;
}

/** 按步长平移选中元素并钳制在纸张边界内（元素坐标单位 pt，纸张尺寸单位 mm） */
function moveSelected(dx: number, dy: number) {
  const el = store.selected;
  if (!el) return;
  const paper = parsePaper(store.template.paperSize);
  // 纸张 mm → pt 后再与元素几何（pt）比较
  const x = Math.min(Math.max(el.x + dx, 0), Math.max(0, mmToPt(paper.w) - el.width));
  const y = Math.min(Math.max(el.y + dy, 0), Math.max(0, mmToPt(paper.h) - el.height));
  store.updateElement(el.id, { x, y });
}

/** 方向键长按会话：首个 keydown 入一次撤销栈，keyup 结束，避免连发产生碎撤销点 */
let arrowSession = false;

function onKeydown(e: KeyboardEvent) {
  if (isTypingTarget(e)) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod) {
    const key = e.key.toLowerCase();
    switch (key) {
      case 's':
        e.preventDefault();
        handleSave();
        return;
      case 'z':
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
        return;
      case 'y':
        e.preventDefault();
        store.redo();
        return;
      case 'x':
        e.preventDefault();
        if (store.selectedId) store.cutElement(store.selectedId);
        return;
      case 'c':
        e.preventDefault();
        if (store.selectedId) store.copyElement(store.selectedId);
        return;
      case 'v':
        e.preventDefault();
        store.pasteElement();
        return;
      default:
        return;
    }
  }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (!store.selectedId) return;
    e.preventDefault();
    store.removeElement(store.selectedId);
    return;
  }

  const arrows: Record<string, [number, number]> = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
  };
  const dir = arrows[e.key];
  if (!dir) return;
  if (!store.selected) return;
  e.preventDefault();
  if (!arrowSession) {
    store.snapshot();
    arrowSession = true;
  }
  const step = e.altKey ? ARROW_STEP_NUDGE : e.shiftKey ? ARROW_STEP_FAST : ARROW_STEP_NORMAL;
  moveSelected(dir[0] * step, dir[1] * step);
}

function onKeyup(e: KeyboardEvent) {
  if (e.key.startsWith('Arrow')) arrowSession = false;
}

onMounted(() => {
  toggleBodyScroll(true);
  if (currentId.value === null) {
    loadTemplates();
  } else {
    loadTemplate(currentId.value);
  }
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('keyup', onKeyup);
});
onBeforeUnmount(() => {
  toggleBodyScroll(false);
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('keyup', onKeyup);
});
</script>

<template>
  <div class="flex h-full w-full flex-col" style="padding: 0">
    <ToolBar
      class="shrink-0"
      :template-name="currentName"
      :loading="loading"
      @save="handleSave"
      @preview="previewVisible = true"
    />

    <div class="flex flex-1 overflow-hidden">
      <div class="w-260px shrink-0 overflow-hidden border-r border-#e5e7eb dark:border-#2a2a2a">
        <FieldPanel />
      </div>
      <DesignCanvas class="flex-1" />
      <div class="w-300px shrink-0 overflow-hidden border-l border-#e5e7eb bg-container dark:border-#2a2a2a">
        <PropertyPanel />
      </div>
    </div>

    <PreviewModal v-model:show="previewVisible" />
  </div>
</template>

<style>
.label-designer-no-scroll {
  overflow: hidden;
}
</style>
