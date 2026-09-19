# 标签设计器（label-designer）

TMS 管理端「标签设计」页面（路由 `/system-manage/label-designer`，菜单：系统管理 → 标签设计）。
自研的拖拽式标签模板设计器，设计结果序列化为 `designJson` 存后端，供预览/打印端按同一份数据还原。

> 同仓库另有早期基于 hiprint 的 `print-design/`（设计标签）页面，两者相互独立，不要混淆。

## 一、页面怎么用

| 区域     | 操作                                                                                         |
| -------- | -------------------------------------------------------------------------------------------- |
| 左侧面板 | 「业务字段」「基础元素」两组，按住条目拖到纸张内即创建元素；拖出纸张外不创建（播放回位动画） |
| 画布     | 单击选中、拖动移动、8 向手柄缩放（按住 Shift 等比）；空白处拖动平移画布；滚轮缩放            |
| 右侧面板 | 数据预览（标题 / 字段类型 / 关联标题 / 占位文本）、位置与尺寸（pt）、样式、删除按钮          |
| 工具栏   | 模板名（纯文本）、撤销 / 重做、纸张尺寸、显示网格、缩放（`-` / 100% / `+`）、预览、保存      |
| 快捷键   | 工具栏「快捷键」按钮可查看帮助；输入框聚焦时全部不拦截                                       |

> 有未保存修改时，点「返回」或从打印格式列表点开另一条模板的「设计」都会先弹确认；确认后当前修改被丢弃（返回场景会把设计器还原为已保存版本，再进来看到的仍是保存前的内容）。

快捷键速查：`Ctrl+S` 保存、`Ctrl+Z` 撤销、`Ctrl+Y` / `Ctrl+Shift+Z` 重做、`Ctrl+X/C/V` 剪切/复制/粘贴、`Delete` 删除、`方向键` 平移（`Shift` 步长 ×10、`Alt` 步长 ×0.1）。

保存成功后：`designJson` 会在**新标签页**以 JSON 原文打开（用于核对存储格式），同时写库。

## 二、目录结构

```
label-designer/
├── index.vue          页面入口：模板加载/保存、全局快捷键、三栏编排
└── modules/
    ├── core/          定义与序列化（无 UI、无副作用）
    │   ├── types.ts           全部 TS 类型（LabelElement / ElementOptions / LabelTemplate / FieldDef…）
    │   ├── constant.ts        纸张尺寸、单位换算（mm/pt/px）、BUSINESS_FIELDS 业务字段清单、拖拽回位曲线常量
    │   ├── basic-elements.ts  基础元素清单（文本、条码、矩形、线条…）
    │   └── export-format.ts   designJson 序列化 / 反序列化（toExportTemplate / parseTemplateJson）
    ├── render/        渲染引擎（画布与打印共用，纯函数）
    │   ├── barcode.ts             条形码 / 二维码 → dataURL（bwip-js）
    │   ├── render-utils.ts        resolveDisplayText：显示文本回退链（示例内容 → placeholder → {{field}}）
    │   └── render-element-html.ts 打印文档静态 HTML（预览弹窗 iframe 用）
    ├── canvas/        画布
    │   ├── design-canvas.vue          画布容器（纸张、网格、拖放落点判定、平移/缩放）
    │   ├── element-renderer.vue       画布内单个元素渲染
    │   ├── use-canvas-interaction.ts  选中 / 拖动 / 缩放的 pointer 交互
    │   ├── drag-ghost.ts              拖拽会话：按下即预览、顶掉原生影子、跟手与未落纸回位
    │   └── drag-preview.vue           拖拽预览浮层（复用画布渲染器，1:1 真实效果）
    └── panels/        面板 UI
        ├── tool-bar.vue       工具栏（单行）
        ├── field-panel.vue    左：业务字段 + 基础元素
        ├── property-panel.vue 右：属性编辑（FormWrap，size=small）
        ├── preview-modal.vue  预览弹窗
        └── shortcut-help.vue  快捷键帮助弹窗
```

依赖方向：`panels / canvas → render / core`，`render → core`，`core` 不依赖其它组；`index.vue` 只做编排，不写业务细节。

## 三、关键约定（改代码前必读）

1. **单位四类并存**：纸张 `mm`、元素几何 `pt`、字号 `pt`、边框/行距 `px`。换算常量统一在 `core/constant.ts`（`PX_PER_PT` / `PT_PER_MM` / `mmToPt` / `parsePaper`），不要在业务里手写魔法数。
2. **渲染两端必须同步**：修改元素外观/结构时，`canvas/element-renderer.vue`（画布）与 `render/render-element-html.ts`（打印）要同时改，否则预览与画布不一致。
3. **旧数据兼容**：`loadFromJson` 不补默认字段，新增 options 字段必须在渲染层做兜底（`!== false`、`|| 默认值`、`?? 默认值`），旧模板才不会渲染异常。
4. **拖动实现特殊性**：拖动为高频帧直写 DOM、松手才写 store；`pointerup` 必须按 store 权威值回写 `left/top/width/height`（且放在 `updateElement` 之后），否则会出现元素飞回左上角 / 视觉抖动。
5. **序列化边界唯一**：designJson 的格式转换只发生在 `core/export-format.ts`，store 只调用不实现。

## 四、扩展指南

| 要做什么           | 改哪里                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------- |
| 新增业务字段       | `core/constant.ts` 的 `BUSINESS_FIELDS`（`elementType` 决定拖入后生成的元素类型）             |
| 新增基础元素       | `core/basic-elements.ts`                                                                      |
| 新增元素属性       | `core/types.ts` 的 options 类型 + `panels/property-panel.vue` 的 formItems + 两端渲染兜底     |
| 调整序列化格式     | 只改 `core/export-format.ts`                                                                  |
| 调整快捷键         | 全局键在 `index.vue`，局部提示在 `panels/shortcut-help.vue`                                   |
| 调整画布交互       | `canvas/use-canvas-interaction.ts`（拖动/缩放）、`canvas/design-canvas.vue`（平移/落点/滚轮） |
| 新增模板元数据字段 | 后端接口 `service/api/print-format.ts` + `index.vue`                                          |

## 五、后续可维护性说明

- **路由安全**：elegant-router 只把 `**/index.vue`、`**/[param].vue` 当页面，本目录 `modules/` 下新增任意层级 `.vue` **不会**生成路由，可放心按职责继续拆分目录。
- **本目录只有 `index.vue` 的路径/命名是与路由绑定的**，`modules/` 内文件可自由重组（2026-09-14 已按 core/render/canvas/panels 整理一次，见 `changelog/标签设计器目录整理.md`）。
- **常规验证**：`pnpm typecheck`；启动 `pnpm dev` 会自动重新生成 `src/router/elegant/**` 与 typings（本目录改动不应引起任何自动生成文件 diff）。
- **已知环境坑**：`pnpm gen-route` 依赖的 `sa` 命令在当前机器上可能因 `node_modules/.bin/sa.cmd` 指向已删除的 `bin.ts` 而报 `ERR_MODULE_NOT_FOUND`；路由重新生成用 `pnpm dev` 触发即可（同一条链路），无需修复该 shim。
- 涉及单位迁移、designJson 格式、拖拽回位动画等历史决策细节，见 `changelog/` 下的「标签设计…」系列文档。

## 六、相关文档

- [标签设计器自研方案](../../../../changelog/标签设计器自研方案.md)
- [标签设计器目录整理](../../../../changelog/标签设计器目录整理.md)
- [标签设计单位规范](../../../../changelog/标签设计单位规范.md)
- [标签设计保存导出JSON](../../../../changelog/标签设计保存导出JSON.md)
