declare module 'vue-plugin-hiprint' {
  /** 元素参数：field 绑定数据字段名，testData 为设计态示例值 */
  export interface PrintElementTypeOptions {
    field?: string;
    testData?: string;
    title?: string;
    [key: string]: unknown;
  }

  /** 元素类型配置（普通对象即可，无需构造器） */
  export interface PrintElementTypeConfig {
    tid: string;
    title?: string;
    type?: string;
    data?: string;
    field?: string;
    options?: PrintElementTypeOptions;
    [key: string]: unknown;
  }

  /**
   * 元素类型分组。注意：addPrintElementTypes 读取的是分组上的 printElementTypes，
   * 第二个参数直接传普通配置对象数组即可，扁平数组不会生效。
   */
  export interface PrintElementTypeGroup {
    readonly title: string;
  }

  export const PrintElementTypeGroup: {
    new (title: string, types: PrintElementTypeConfig[]): PrintElementTypeGroup;
  };

  export interface ElementTypeContext {
    removePrintElementTypes(key: string): void;
    addPrintElementTypes(key: string, groups: PrintElementTypeGroup[]): void;
  }

  export interface ElementTypeProvider {
    addElementTypes(context: ElementTypeContext): void;
  }

  export class defaultElementTypeProvider implements ElementTypeProvider {
    addElementTypes(context: ElementTypeContext): void;
  }

  /** getHtml 返回的分页结果对象，需再调用 html() 取字符串 */
  export interface HiprintHtmlResult {
    html(): string;
  }

  /** 元素属性面板单个字段定义（来自 getPrintElementOptionTabs） */
  export interface HiprintOptionField {
    /** 字段键，对应 element.options 上的属性名 */
    name: string;
    /** 控件类型：text | textarea | number | select | color | checkbox | image | table 等 */
    type: string;
    /** 中文标题（hiprint 自带），缺失时回退到 name */
    title?: string;
    /** select 类型的下拉选项，单项结构为 { title?, label?, value? } */
    options?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  }

  /** 一组属性字段（折叠面板的一个分组） */
  export interface HiprintOptionTab {
    name: string;
    list: HiprintOptionField[];
    [key: string]: unknown;
  }

  /** 设计器画布上的一个打印元素实例 */
  export interface HiprintPrintElement {
    /** 当前元素的可编辑属性集合 */
    options: Record<string, unknown>;
    /** 写回单个属性并重绘画布 */
    updateOption(key: string, value: unknown, silent?: boolean): void;
    /** 读取属性分组定义（基础/样式/数据等） */
    getPrintElementOptionTabs(): HiprintOptionTab[] | { tabs: HiprintOptionTab[] };
    /** 元素类型元信息 */
    printElementType?: { type?: string; title?: string };
  }

  /** hinnn 事件总线的最小接口（hiprint 挂在 window.hinnn） */
  export interface HinnnEvent {
    on(key: string, handler: (payload: unknown) => void): void;
    clear(key: string): void;
    trigger(key: string, payload?: unknown): void;
  }

  export interface PrintTemplateOptions {
    template?: unknown;
    /** 元素属性面板容器选择器 */
    settingContainer?: string;
    /** 多面板容器选择器 */
    paginationContainer?: string;
    /** 是否开启撤销重做 */
    history?: boolean;
    dataMode?: number;
    onDataChanged?: (type: string, json: unknown) => void;
    onUpdateError?: (error: unknown) => void;
  }

  export class PrintTemplate {
    constructor(options?: PrintTemplateOptions);
    /** 挂载设计器到指定容器 */
    design(selector: string): void;
    getJson(): unknown;
    /** 传数字走自定义尺寸（mm），传字符串走内置纸张类型 */
    setPaper(width: number | string, height?: number): void;
    /** 第二参数传 true 时把 scale 记到实例上 */
    zoom(scale: number, persist?: boolean): void;
    getHtml(data?: Record<string, unknown>): HiprintHtmlResult;
    /** 部分版本没有该方法，调用前需判空 */
    clear?(): void;
    print(data: Record<string, unknown>, options?: unknown, extra?: unknown): void;
    /** 返回属性面板选中事件名（含 templateId），用于监听元素选中 */
    getBuildCustomOptionSettingEventKey(): string;
  }

  /** 模块只导出 hiprint 与 defaultElementTypeProvider，其余 API 都挂在 hiprint 上 */
  export interface HiprintStatic {
    init(options?: { providers?: ElementTypeProvider[]; lang?: string; host?: string; token?: string }): void;
    setConfig(config?: Record<string, unknown>): void;
    PrintElementTypeManager: { buildByHtml(elements: unknown): void };
    PrintTemplate: typeof PrintTemplate;
    PrintElementTypeGroup: typeof PrintElementTypeGroup;
  }

  export const hiprint: HiprintStatic;
  export function disAutoConnect(): void;
  export function autoConnect(callback?: (status: boolean, msg: string) => void): void;
}

interface Window {
  hinnn?: {
    event: import('vue-plugin-hiprint').HinnnEvent;
  };
}
