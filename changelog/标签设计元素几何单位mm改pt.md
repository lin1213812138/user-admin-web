# 标签设计元素几何单位 mm 改 pt

## 背景

用户要求把标签设计器的位置 x/y、宽高 width/height 单位从 mm 改成 pt（属性面板数值、存储、打印导出全链路）。经确认两项决策：

1. **纸张保留 mm**：`paperSize` 存储、`PAPER_SIZES` 预设、`parsePaper` 不变（标签纸规格行业惯例用 mm），只有元素几何改 pt。
2. **旧数据自动迁移**：designJson 加 `unit` 字段，缺省视为 `mm`，加载时几何 ×2.8346 换算为 pt，旧模板视觉大小不变。

## 实现

**换算基础**（`modules/constant.ts`）

- 新增 `PX_PER_PT = 96/72`（1pt ≈ 1.3333px）、`PT_PER_MM = 72/25.4`、纯函数 `mmToPt()`；`PX_PER_MM` 保留给纸张。

**数据模型**（`modules/types.ts` + `store/modules/label-design/index.ts`）

- `LabelTemplate` 增 `unit?: 'mm' | 'pt'`。
- `loadFromJson`：`unit !== 'pt'` 时走 `migrateGeometryToPt()`（元素 x/y/width/height 全部乘 `PT_PER_MM`），无 unit 字段的旧 JSON 自动迁移。
- `toJson`：输出写 `unit: 'pt'`。
- `defaultSize()`：新元素默认宽高改为 `mmToPt(原mm值)`（如 text 40×8mm → 113.39×22.68pt），物理尺寸不变。

**渲染两端**

- `design-canvas.vue`：元素样式换算 `* PX_PER_PT`，纸张仍 `* PX_PER_MM`，网格仍 1mm 间距。
- `render-element-html.ts`：元素 `left/top/width/height` 输出 `${x}pt`，纸张容器仍 `${w}mm`（CSS 绝对单位混排合法）。
- `preview-modal.vue`：纸张容器 px 换算不变，元素走打印 HTML 自带 pt。

**交互**（`use-canvas-interaction.ts`）

- `mmPerPx` → `ptPerPx`（`mmToPt(w)/rect.width`），`dxMm/dyMm` → `dxPt/dyPt`，DOM 直写换算全改 `PX_PER_PT`。
- 最小边长 `MIN_SIDE = mmToPt(2)`（≈5.67pt，保持 2mm 手感）；点击判定阈值 `mmToPt(0.2)`。

**快捷键**（`index.vue`）

- 方向键步长 `ARROW_STEP_NORMAL/FAST/NUDGE` 改 `mmToPt(1/10/0.1)`，移动手感与旧版一致。

**属性面板 i18n**

- `propX/propY/propW/propH` 加单位后缀：`X (pt)` / `Y (pt)` / `宽 (pt)` / `高 (pt)`，zh-cn 与 en-us 同步。

## 验证

`pnpm typecheck` 通过；全局搜索确认元素几何相关 mm/mmPerPx 无残留，`PX_PER_MM` 仅剩纸张侧预期使用。
