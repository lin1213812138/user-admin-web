import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SetupStoreId } from '@/enum';
import { mmToPt } from '@/views/system-manage/label-designer/modules/constant';
import type {
  ElementDescriptor,
  LabelElement,
  LabelTemplate
} from '@/views/system-manage/label-designer/modules/types';
import { parseTemplateJson, toExportTemplate } from '@/views/system-manage/label-designer/modules/export-format';

function uid(): string {
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultOptionsFor(desc: ElementDescriptor): LabelElement['options'] {
  const seed = desc.defaultOptions ?? {};
  switch (desc.type) {
    case 'text':
    case 'longText':
      return {
        fontSize: 8,
        color: '#000000',
        fontWeight: 'normal',
        align: 'left',
        lineHeight: 1.2,
        field: seed.field,
        testData: seed.testData,
        text: seed.sample ?? '',
        // 拖入业务字段时预填标题名称；关联标题由 seed.showTitle && title 共同决定（缺省不显示）
        title: seed.title,
        showTitle: Boolean(seed.showTitle && seed.title),
        titleFontSize: 8,
        titleColor: '#000000',
        titleFontWeight: 'normal',
        showBorder: false,
        borderWidth: 1,
        borderColor: '#000000'
      };
    case 'image':
      return { field: seed.field, testData: seed.testData, src: seed.sample ?? '' };
    case 'barcode':
      return {
        symbology: 'code128',
        displayValue: true,
        fontSize: 8,
        textGap: 2,
        value: seed.sample,
        field: seed.field,
        testData: seed.testData,
        title: seed.title,
        showTitle: Boolean(seed.showTitle && seed.title),
        titleFontSize: 8,
        titleColor: '#000000',
        titleFontWeight: 'normal',
        showBorder: false,
        borderWidth: 1,
        borderColor: '#000000'
      };
    case 'qrcode':
      return {
        ecc: 'M',
        value: seed.sample,
        field: seed.field,
        testData: seed.testData,
        title: seed.title,
        showTitle: Boolean(seed.showTitle && seed.title),
        titleFontSize: 8,
        titleColor: '#000000',
        titleFontWeight: 'normal',
        showBorder: false,
        borderWidth: 1,
        borderColor: '#000000'
      };
    case 'rect':
      return { borderWidth: 1, borderColor: '#000000', bgColor: 'transparent', radius: 0 };
    case 'hline':
    case 'vline':
      return { borderWidth: 1, borderColor: '#000000' };
  }
}

function defaultSize(type: ElementDescriptor['type']): { width: number; height: number } {
  // 默认宽高保持旧 mm 版物理尺寸不变，仅换算为 pt 存储（1mm ≈ 2.8346pt）
  switch (type) {
    case 'text':
      return { width: mmToPt(40), height: mmToPt(8) };
    case 'longText':
      return { width: mmToPt(50), height: mmToPt(16) };
    case 'image':
      return { width: mmToPt(20), height: mmToPt(20) };
    case 'barcode':
      return { width: mmToPt(50), height: mmToPt(15) };
    case 'qrcode':
      return { width: mmToPt(20), height: mmToPt(20) };
    case 'rect':
      return { width: mmToPt(30), height: mmToPt(20) };
    case 'hline':
      return { width: mmToPt(40), height: mmToPt(2) };
    case 'vline':
      return { width: mmToPt(2), height: mmToPt(40) };
  }
}

export const useLabelDesignStore = defineStore(SetupStoreId.LabelDesign, () => {
  const template = ref<LabelTemplate>({ paperSize: '100×150mm', elements: [] });
  const selectedId = ref<string | null>(null);
  const zoom = ref(1);
  const showGrid = ref(false);
  const past = ref<LabelElement[][]>([]);
  const future = ref<LabelElement[][]>([]);
  const clipboard = ref<LabelElement | null>(null);
  /** 拖动/缩放中的几何预览：仅驱动属性面板实时显示，不进 elements/撤销/序列化 */
  const dragPreview = ref<{ x: number; y: number; width: number; height: number } | null>(null);

  const elements = computed(() => template.value.elements);
  const selected = computed(() => elements.value.find(e => e.id === selectedId.value) ?? null);
  const canUndo = computed(() => past.value.length > 0);
  const canRedo = computed(() => future.value.length > 0);

  function clone(list: LabelElement[]): LabelElement[] {
    return JSON.parse(JSON.stringify(list)) as LabelElement[];
  }

  function commit() {
    past.value.push(clone(elements.value));
    if (past.value.length > 50) past.value.shift();
    future.value = [];
  }

  function addElement(desc: ElementDescriptor, at: { x: number; y: number }) {
    commit();
    const size = defaultSize(desc.type);
    const el: LabelElement = {
      id: uid(),
      type: desc.type,
      x: at.x,
      y: at.y,
      width: size.width,
      height: size.height,
      options: defaultOptionsFor(desc)
    };
    elements.value.push(el);
    selectedId.value = el.id;
  }

  function updateElement(id: string, patch: Partial<Pick<LabelElement, 'x' | 'y' | 'width' | 'height'>>) {
    const el = elements.value.find(e => e.id === id);
    if (!el) return;
    Object.assign(el, patch);
  }

  function updateElementOptions(id: string, patch: Record<string, unknown>) {
    const el = elements.value.find(e => e.id === id);
    if (!el) return;
    el.options = { ...el.options, ...patch } as LabelElement['options'];
  }

  function removeElement(id: string) {
    commit();
    template.value.elements = elements.value.filter(e => e.id !== id);
    if (selectedId.value === id) selectedId.value = null;
  }

  function selectElement(id: string | null) {
    selectedId.value = id;
  }

  function duplicateElement(id: string) {
    const el = elements.value.find(e => e.id === id);
    if (!el) return;
    commit();
    const copy = JSON.parse(JSON.stringify(el)) as LabelElement;
    copy.id = uid();
    copy.x += mmToPt(4);
    copy.y += mmToPt(4);
    const idx = elements.value.findIndex(e => e.id === id);
    elements.value.splice(idx + 1, 0, copy);
    selectedId.value = copy.id;
  }

  function bringToFront(id: string) {
    const el = elements.value.find(e => e.id === id);
    if (!el) return;
    commit();
    template.value.elements = template.value.elements.filter(e => e.id !== id);
    template.value.elements.push(el);
  }

  function sendToBack(id: string) {
    const el = elements.value.find(e => e.id === id);
    if (!el) return;
    commit();
    template.value.elements = template.value.elements.filter(e => e.id !== id);
    template.value.elements.unshift(el);
  }

  function moveLayer(id: string, dir: 1 | -1) {
    const idx = elements.value.findIndex(e => e.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= elements.value.length) return;
    commit();
    const arr = elements.value as LabelElement[];
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
  }

  function copyElement(id: string) {
    const el = elements.value.find(e => e.id === id);
    if (el) clipboard.value = JSON.parse(JSON.stringify(el)) as LabelElement;
  }

  /** 剪切：复制到剪贴板并删除原元素（删除入撤销栈，可 undo） */
  function cutElement(id: string) {
    copyElement(id);
    removeElement(id);
  }

  function pasteElement() {
    if (!clipboard.value) return;
    commit();
    const copy = JSON.parse(JSON.stringify(clipboard.value)) as LabelElement;
    copy.id = uid();
    copy.x += mmToPt(4);
    copy.y += mmToPt(4);
    elements.value.push(copy);
    selectedId.value = copy.id;
  }

  function setPaper(size: string) {
    template.value.paperSize = size;
  }

  /** 一键清空画布全部元素（入撤销栈，可 undo 恢复） */
  function clearAll() {
    if (!elements.value.length) return;
    commit();
    template.value.elements = [];
    selectedId.value = null;
  }

  function setZoom(next: number) {
    zoom.value = Math.min(4, Math.max(0.2, Number(next.toFixed(2))));
  }

  function undo() {
    if (!past.value.length) return;
    future.value.push(clone(elements.value));
    template.value.elements = past.value.pop()!;
  }

  function redo() {
    if (!future.value.length) return;
    past.value.push(clone(elements.value));
    template.value.elements = future.value.pop()!;
  }

  /** designJson 解析（目标格式 / 旧原生格式 / 非法输入统一兜底，mm 旧数据自动迁移 pt，见 export-format.ts） */
  function loadFromJson(json: string) {
    template.value = parseTemplateJson(json);
    selectedId.value = null;
    past.value = [];
    future.value = [];
  }

  /** 序列化为目标存储格式（几何 pt 直传 + options 兼容层，见 export-format.ts） */
  function toJson(): string {
    return JSON.stringify(toExportTemplate(template.value));
  }

  function reset() {
    template.value = { paperSize: '100×150mm', elements: [] };
    selectedId.value = null;
    past.value = [];
    future.value = [];
  }

  return {
    template,
    selectedId,
    zoom,
    showGrid,
    past,
    future,
    clipboard,
    dragPreview,
    elements,
    selected,
    canUndo,
    canRedo,
    addElement,
    updateElement,
    updateElementOptions,
    removeElement,
    selectElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    moveLayer,
    copyElement,
    cutElement,
    pasteElement,
    setPaper,
    setZoom,
    clearAll,
    undo,
    redo,
    loadFromJson,
    toJson,
    reset,
    snapshot: commit
  };
});
