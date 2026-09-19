import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SetupStoreId } from '@/enum';
import { mmToPt } from '@/views/system-manage/label-designer/modules/core/constant';
import type {
  ElementDescriptor,
  ElementType,
  LabelElement,
  LabelTemplate
} from '@/views/system-manage/label-designer/modules/core/types';
import { parseTemplateJson, toExportTemplate } from '@/views/system-manage/label-designer/modules/core/export-format';

function uid(): string {
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 构建默认 options（导出供拖拽预览复用：预览内容必须与拖入创建的元素同源） */
export function defaultOptionsFor(desc: Pick<ElementDescriptor, 'type' | 'defaultOptions'>): LabelElement['options'] {
  const seed = desc.defaultOptions ?? {};
  switch (desc.type) {
    case 'text':
    case 'longText':
      return {
        fontSize: 8,
        color: '#000000',
        fontWeight: 'normal',
        align: 'left',
        verticalAlign: 'top',
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

/** 元素默认尺寸（导出供拖拽预览复用，保证预览与落纸后的元素尺寸一致） */
export function defaultSize(type: ElementDescriptor['type']): { width: number; height: number } {
  // 默认宽高保持旧 mm 版物理尺寸不变，仅换算为 pt 存储（1mm ≈ 2.8346pt）
  switch (type) {
    case 'text':
      // 宽度固定 50mm；高度为兜底值，拖入落纸时会被「预览实测的内容高度」覆盖（见 addElement 的 size 参数）
      return { width: mmToPt(50), height: mmToPt(8) };
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

/** 类型切换时内容键互迁表：文本类 text ↔ 编码类 value（图片 src 是资源地址，不参与互迁） */
const SWITCH_CONTENT_KEY: Partial<Record<ElementType, string>> = {
  text: 'text',
  longText: 'text',
  barcode: 'value',
  qrcode: 'value'
};

/** 各数据类支持、但 defaultOptionsFor 未显式写出的可选键（类型切换保留时兜底），如占位文本 placeholder */
const EXTRA_OPTION_KEYS: Partial<Record<ElementType, string[]>> = {
  text: ['placeholder'],
  longText: ['placeholder'],
  barcode: ['placeholder'],
  qrcode: ['placeholder']
};

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
  /** 相对上次加载/保存是否存在未保存修改（视图状态如缩放/网格不计入） */
  const dirty = ref(false);
  /** 上次加载/保存时的序列化快照，「放弃修改」时用它还原 */
  const savedJson = ref('');

  const elements = computed(() => template.value.elements);
  const selected = computed(() => elements.value.find(e => e.id === selectedId.value) ?? null);
  const canUndo = computed(() => past.value.length > 0);
  const canRedo = computed(() => future.value.length > 0);

  function clone(list: LabelElement[]): LabelElement[] {
    return JSON.parse(JSON.stringify(list)) as LabelElement[];
  }

  /** 标记「相对上次加载/保存已有修改」（view 状态变更不计入） */
  function markDirty() {
    dirty.value = true;
  }

  function commit() {
    past.value.push(clone(elements.value));
    if (past.value.length > 50) past.value.shift();
    future.value = [];
    markDirty();
  }

  function addElement(desc: ElementDescriptor, at: { x: number; y: number }, size?: { width: number; height: number }) {
    commit();
    // size 供「高度按内容自适应」等场景覆盖类型默认尺寸；缺省用 defaultSize
    const finalSize = size ?? defaultSize(desc.type);
    const el: LabelElement = {
      id: uid(),
      type: desc.type,
      x: at.x,
      y: at.y,
      width: finalSize.width,
      height: finalSize.height,
      options: defaultOptionsFor(desc)
    };
    elements.value.push(el);
    selectedId.value = el.id;
  }

  function updateElement(id: string, patch: Partial<Pick<LabelElement, 'x' | 'y' | 'width' | 'height'>>) {
    const el = elements.value.find(e => e.id === id);
    if (!el) return;
    Object.assign(el, patch);
    markDirty();
  }

  function updateElementOptions(id: string, patch: Record<string, unknown>) {
    const el = elements.value.find(e => e.id === id);
    if (!el) return;
    el.options = { ...el.options, ...patch } as LabelElement['options'];
    markDirty();
  }

  /**
   * 切换元素类型：保留两类型共有的配置、内容互迁（文本 text ↔ 编码 value）、新类型独有键补默认，
   * 尺寸重置为新类型默认（位置不变）；入撤销栈。
   */
  function updateElementType(id: string, type: ElementType) {
    const el = elements.value.find(e => e.id === id);
    if (!el || el.type === type) return;
    commit();
    const prev = el.options as unknown as Record<string, unknown>;
    const defaults = defaultOptionsFor({ type, defaultOptions: {} }) as unknown as Record<string, unknown>;

    // 内容互迁：仅新旧内容键不同且旧值非空时迁移，避免用 undefined / 空串覆盖新类型默认值
    const prevContentKey = SWITCH_CONTENT_KEY[el.type];
    const nextContentKey = SWITCH_CONTENT_KEY[type];
    const migrated: Record<string, unknown> = {};
    if (prevContentKey && nextContentKey && prevContentKey !== nextContentKey && prev[prevContentKey] != null) {
      migrated[nextContentKey] = prev[prevContentKey];
    }

    // 保留共有键：新类型默认 options 里存在的键（同名字义兼容，如 fontSize），或该类型支持但默认未写出的可选键；
    // 已迁移的内容键不重复保留（默认值展开可能覆盖迁移值）
    const extras = EXTRA_OPTION_KEYS[type] ?? [];
    const kept = Object.fromEntries(
      Object.entries(prev).filter(([k]) => (k in defaults || extras.includes(k)) && !(k in migrated))
    );

    el.options = { ...defaults, ...kept, ...migrated } as unknown as LabelElement['options'];
    el.type = type;
    const size = defaultSize(type);
    el.width = size.width;
    el.height = size.height;
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
    markDirty();
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
    markDirty();
  }

  function redo() {
    if (!future.value.length) return;
    past.value.push(clone(elements.value));
    template.value.elements = future.value.pop()!;
    markDirty();
  }

  /** designJson 解析（目标格式 / 旧原生格式 / 非法输入统一兜底，mm 旧数据自动迁移 pt，见 export-format.ts） */
  function loadFromJson(json: string) {
    template.value = parseTemplateJson(json);
    selectedId.value = null;
    past.value = [];
    future.value = [];
    savedJson.value = toJson();
    dirty.value = false;
  }

  /** 序列化为目标存储格式（几何 pt 直传 + options 兼容层，见 export-format.ts） */
  function toJson(): string {
    return JSON.stringify(toExportTemplate(template.value));
  }

  /** 保存成功后调用：刷新已保存快照并清除修改标记（详情加载完成后也用它确立基线） */
  function markSaved() {
    savedJson.value = toJson();
    dirty.value = false;
  }

  /** 放弃未保存的修改：还原到上次加载/保存时的快照（无快照时不动作） */
  function revert() {
    if (!savedJson.value) return;
    loadFromJson(savedJson.value);
  }

  function reset() {
    template.value = { paperSize: '100×150mm', elements: [] };
    selectedId.value = null;
    past.value = [];
    future.value = [];
    savedJson.value = '';
    dirty.value = false;
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
    updateElementType,
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
    dirty,
    markSaved,
    revert,
    snapshot: commit
  };
});
