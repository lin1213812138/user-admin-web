import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SetupStoreId } from '@/enum';
import type {
  ElementDescriptor,
  LabelElement,
  LabelTemplate
} from '@/views/system-manage/label-designer/modules/types';

function uid(): string {
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultOptionsFor(desc: ElementDescriptor): LabelElement['options'] {
  const seed = desc.defaultOptions ?? {};
  switch (desc.type) {
    case 'text':
    case 'longText':
      return {
        fontSize: 12,
        color: '#000000',
        fontWeight: 'normal',
        align: 'left',
        lineHeight: 1.2,
        field: seed.field,
        testData: seed.testData,
        text: seed.sample ?? ''
      };
    case 'image':
      return { field: seed.field, testData: seed.testData, src: seed.sample ?? '' };
    case 'barcode':
      return {
        symbology: 'code128',
        displayValue: true,
        fontSize: 10,
        value: seed.sample,
        field: seed.field,
        testData: seed.testData
      };
    case 'qrcode':
      return { ecc: 'M', value: seed.sample, field: seed.field, testData: seed.testData };
    case 'rect':
      return { borderWidth: 1, borderColor: '#000000', bgColor: 'transparent', radius: 0 };
    case 'hline':
    case 'vline':
      return { borderWidth: 1, borderColor: '#000000' };
  }
}

function defaultSize(type: ElementDescriptor['type']): { width: number; height: number } {
  switch (type) {
    case 'text':
      return { width: 40, height: 8 };
    case 'longText':
      return { width: 50, height: 16 };
    case 'image':
      return { width: 20, height: 20 };
    case 'barcode':
      return { width: 50, height: 15 };
    case 'qrcode':
      return { width: 20, height: 20 };
    case 'rect':
      return { width: 30, height: 20 };
    case 'hline':
      return { width: 40, height: 2 };
    case 'vline':
      return { width: 2, height: 40 };
  }
}

export const useLabelDesignStore = defineStore(SetupStoreId.LabelDesign, () => {
  const template = ref<LabelTemplate>({ paperSize: '100×150mm', elements: [] });
  const selectedId = ref<string | null>(null);
  const zoom = ref(1);
  const showGrid = ref(true);
  const showRuler = ref(true);
  const past = ref<LabelElement[][]>([]);
  const future = ref<LabelElement[][]>([]);
  const clipboard = ref<LabelElement | null>(null);

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
    copy.x += 4;
    copy.y += 4;
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

  function pasteElement() {
    if (!clipboard.value) return;
    commit();
    const copy = JSON.parse(JSON.stringify(clipboard.value)) as LabelElement;
    copy.id = uid();
    copy.x += 4;
    copy.y += 4;
    elements.value.push(copy);
    selectedId.value = copy.id;
  }

  function setPaper(size: string) {
    template.value.paperSize = size;
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

  function loadFromJson(json: string) {
    if (!json) {
      template.value = { paperSize: '100×150mm', elements: [] };
      return;
    }
    try {
      const parsed = JSON.parse(json) as LabelTemplate;
      template.value = parsed && Array.isArray(parsed.elements) ? parsed : { paperSize: '100×150mm', elements: [] };
    } catch {
      template.value = { paperSize: '100×150mm', elements: [] };
    }
    selectedId.value = null;
    past.value = [];
    future.value = [];
  }

  function toJson(): string {
    return JSON.stringify(template.value);
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
    showRuler,
    past,
    future,
    clipboard,
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
    pasteElement,
    setPaper,
    setZoom,
    undo,
    redo,
    loadFromJson,
    toJson,
    reset,
    snapshot: commit
  };
});
