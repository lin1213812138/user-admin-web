import type {
  defaultElementTypeProvider,
  ElementTypeProvider,
  hiprint,
  PrintElementTypeGroup,
  PrintTemplate
} from 'vue-plugin-hiprint';
import { printFieldGroups } from './print-fields';

export interface HiprintApi {
  hiprint: typeof hiprint;
  PrintTemplate: typeof PrintTemplate;
  PrintElementTypeGroup: typeof PrintElementTypeGroup;
  defaultElementTypeProvider: typeof defaultElementTypeProvider;
}

/** 只用到 jQuery 的「包装 DOM 元素」能力，取最小接口避免引入全局类型 */
interface JQueryLike {
  (elements: ArrayLike<Element>): unknown;
}

let cached: Promise<HiprintApi> | null = null;
let jqueryFn: JQueryLike | null = null;

/**
 * 加载 hiprint。
 *
 * vue-plugin-hiprint 模块顶层只导出 `hiprint` 与 `defaultElementTypeProvider`，
 * PrintTemplate / PrintElementTypeGroup / PrintElementTypeManager / disAutoConnect / init 等都在 `hiprint` 对象上。
 * hiprint 内部依赖全局 $，必须先注入 jQuery 再加载插件；静态 import 会被提升导致执行顺序颠倒，
 * 因此这里全部用动态 import 保证顺序。
 */
export function loadHiprint(): Promise<HiprintApi> {
  if (!cached) {
    cached = (async () => {
      const { default: jquery } = await import('jquery');

      jqueryFn = jquery as unknown as JQueryLike;
      Object.assign(window, { $: jquery, jQuery: jquery });

      const mod = await import('vue-plugin-hiprint');
      const hiprintObj = mod.hiprint;
      // 不使用直接打印客户端，关闭自动 socket 连接（disAutoConnect 是模块顶层导出，不在 hiprint 对象上）
      mod.disAutoConnect?.();

      return {
        hiprint: hiprintObj,
        PrintTemplate: hiprintObj.PrintTemplate,
        PrintElementTypeGroup: hiprintObj.PrintElementTypeGroup,
        defaultElementTypeProvider: mod.defaultElementTypeProvider
      };
    })();
  }

  return cached!;
}

/**
 * 业务字段 provider：每个字段注册成一个可拖拽元素类型，拖入画布即带 field 绑定。
 *
 * 注意 addPrintElementTypes 只认分组对象（内部读分组的 printElementTypes），第二个参数直接传
 * 普通配置对象数组即可（无需且不存在 PrintElementType 构造器），扁平数组不会生效。
 */
export function createFieldProvider(api: HiprintApi): ElementTypeProvider {
  return {
    addElementTypes(context) {
      printFieldGroups.forEach(group => {
        const types = group.fields.map(field => ({
          tid: `${group.key}.${field.key}`,
          title: field.label,
          type: field.type,
          options: { field: field.key, testData: field.sample, title: field.label }
        }));

        context.addPrintElementTypes(group.key, [new api.PrintElementTypeGroup(group.label, types)]);
      });
    }
  };
}

/**
 * hiprint 自带的长文本等元素默认尺寸过大（长文本默认 width:550pt），在小标签纸上会远超纸张、
 * 溢出画布甚至盖住左右面板，拖动时还会被误判成「位置乱跳」。这里在 init 之后统一把基础元素的
 * 默认尺寸收敛到合理范围。hiprint 顶层导出 `updateElementType(tid, updater)`，内部走单例
 * PrintElementTypeManager 的实例方法，按 tid 原地替换元素类型即可生效。
 */
export function applyDefaultElementSizes(api: HiprintApi): void {
  const updateElementType = (
    api.hiprint as unknown as {
      updateElementType: (tid: string, updater: (t: Record<string, any>) => Record<string, any>) => void;
    }
  ).updateElementType;

  const override = (tid: string, options: Record<string, number>) => {
    updateElementType(tid, type => {
      type.options = { ...type.options, ...options };
      return type;
    });
  };

  override('defaultModule.longText', { width: 160, height: 42 });
  override('defaultModule.text', { width: 80, height: 20 });
  override('defaultModule.image', { width: 60, height: 60 });
  override('defaultModule.barcode', { width: 100, height: 30 });
  override('defaultModule.qrcode', { width: 60, height: 60 });
  override('defaultModule.rect', { width: 80, height: 60 });
  override('defaultModule.hline', { width: 80, height: 10 });
  override('defaultModule.vline', { width: 10, height: 80 });
}

/** 初始化 hiprint：默认元素 provider + 业务字段 provider */
export async function initHiprint(): Promise<HiprintApi> {
  const api = await loadHiprint();

  api.hiprint.init({ providers: [new api.defaultElementTypeProvider(), createFieldProvider(api)] });
  applyDefaultElementSizes(api);

  return api;
}

/** 让面板里所有 .ep-draggable-item 可拖拽；会在面板 DOM 变化时自动补注册（解决 NCollapse 默认折叠导致元素未渲染的问题） */
export function buildDraggableItems(api: HiprintApi, root: HTMLElement | null): (() => void) | undefined {
  if (!root || !jqueryFn) return undefined;

  const panelRoot = root;
  const $ = jqueryFn;
  const boundAttr = 'data-hiprint-bound';

  function register() {
    // 只注册尚未绑定拖拽的元素，避免重复绑定
    const items = panelRoot.querySelectorAll(`.ep-draggable-item:not([${boundAttr}])`);

    if (items.length) {
      api.hiprint.PrintElementTypeManager.buildByHtml($(items));
      items.forEach(item => item.setAttribute(boundAttr, 'true'));
    }
  }

  register();

  const observer = new MutationObserver(register);

  observer.observe(panelRoot, { childList: true, subtree: true });

  return () => observer.disconnect();
}

/** 创建设计器实例（属性面板容器 #PrintElementOptionSetting 由页面提供） */
export function createDesignTemplate(api: HiprintApi, template: unknown): PrintTemplate {
  return new api.PrintTemplate({
    template,
    settingContainer: '#PrintElementOptionSetting',
    history: true,
    dataMode: 1
  });
}

/** hiprint 内部面板对象的最小接口，用于切换纸张后重置页码位置 */
interface EditingPanelLike {
  paperNumberLeft: number;
  paperNumberTop: number;
  designPaper: {
    paperNumberLeft: number;
    paperNumberTop: number;
  };
}

/**
 * 把页码位置设成极大值，让下一次 `setPaper/resize` 时被 hiprint 自动钳制回右下角默认值。
 *
 * hiprint 的 `designPaper.resize` 内部逻辑是：
 *   paperNumberLeft = paperNumberLeft > width  ? width - 30 : paperNumberLeft
 *   paperNumberTop  = paperNumberTop  > height ? height - 22 : paperNumberTop
 * 因此只要设置一个比新纸张还大的值，就能自动得到正确的默认右下角位置。
 * 必须在 `setPaper` 之前调用，否则 resize 会先用旧值定位，导致视觉上没变化。
 */
export function resetPaperNumberPosition(template: PrintTemplate): void {
  const panel = (template as unknown as { editingPanel?: EditingPanelLike }).editingPanel;
  if (!panel?.designPaper) return;

  const huge = Number.MAX_SAFE_INTEGER;
  panel.designPaper.paperNumberLeft = huge;
  panel.designPaper.paperNumberTop = huge;
  // 同步改 panel 上的值，避免 designPaper 触发回调时把旧值写回
  panel.paperNumberLeft = huge;
  panel.paperNumberTop = huge;
}
