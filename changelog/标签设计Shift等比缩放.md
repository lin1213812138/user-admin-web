# 标签设计 Shift 等比缩放

## 需求

按住 Shift 拖拽手柄时元素等比例缩放（锁定宽高比）。

## 设计（brainstorming 确认）

- **Shift + 四角手柄（ne/nw/se/sw）**：等比缩放，比例锁定为拖拽开始时元素的 `width : height`，以宽度驱动高度（`height = width / ratio`）；北向手柄（n）按新高度同步上移锚点 y，钳制最小 2mm；
- **Shift + 边中点手柄（n/s/e/w）**：不生效（单维缩放与比例无关）；
- 拖拽过程中实时读取 `e.shiftKey`，中途按/松 Shift 立即切换等比/自由模式；
- 预览（rAF 直写 DOM）与落库（pointerup 写 store）走同一个 `resizeGeometry`，天然一致；撤销快照逻辑零改动。

## 实施

仅改 `use-canvas-interaction.ts`：

- `DragState` 增加 `shift: boolean`（`begin` 初始化为 `e.shiftKey`，`onPointerMove` 每帧刷新）；
- `resizeGeometry(o, handle, dxMm, dyMm, keepRatio = false)` 增加等比分支：`keepRatio && handle.length === 2`（角手柄双字母判定）时 `height = max(2, width / ratio)`，n 向重算 y；
- `applyFrame` 与 `onPointerUp` 两处调用透传 `d.shift`。

pnpm typecheck + oxlint 全过。

## 手测清单

- 拖四角手柄 + Shift：宽高按原始比例联动，松开 Shift 立即恢复自由缩放；
- 拖边中点手柄 + Shift：行为与不按一致（单维缩放）；
- Shift 拖角到很小尺寸：高度触底 2mm 不产生负值/NaN；
- 松开后属性面板宽高与画布一致，Ctrl+Z 可完整撤销。
