# 页签关闭图标 hover 无反馈

> 2026-09-17

## 现象

页签栏（slider 模式）关闭图标（×）在鼠标 hover 时没有任何视觉反馈（没有圆形高亮底、也没有边框），用户无法判断当前是否悬停在可关闭区域，截图里「系统设置」的红色 × 只是继承了整个页签 hover 时的主题色文字，并非关闭图标自身的 hover 态。

## 定位（纯定位即结论）

- 当前页签模式为 `slider`：`src/theme/settings.ts` 的 `tab.mode === 'slider'`。
- 关闭图标由 `packages/materials/src/libs/page-tab/index.vue` 渲染为 `SvgClose`，自身是 16×16、`rd-50%` 的圆形容器（`packages/materials/src/libs/page-tab/svg-close.vue`）。
- `packages/materials/src/libs/page-tab/index.module.css` 只定义了两种模式下关闭图标的 hover 反馈：
  - `.button-tab .svg-close:hover` → 主题色圆形底 + 白色图标
  - `.chrome-tab .svg-close:hover` → 灰色圆形底
  - **缺 `.slider-tab .svg-close:hover` 这条规则**，slider 模式下 hover 完全无反馈。

## 方案（用户确认 A）

在 `packages/materials/src/libs/page-tab/index.module.css` 末尾补两条规则，与 button 模式对齐：

```css
.slider-tab .svg-close:hover {
  font-size: 12px;
  color: #ffffff;
  background-color: var(--soy-primary-color);
}

.slider-tab_dark .svg-close:hover {
  color: #000000;
}
```

hover 时关闭图标出现主题色圆形底 + 白色 ×（深色模式自动适配），一眼可辨；改动仅 2 条 CSS 规则，三种页签模式行为统一。

## 验证

- CSS 仅新增两条规则，不影响既有 `button` / `chrome` 模式。
- 建议 `pnpm dev` 后 hover 页签关闭图标，确认出现主题色圆形高亮；切换深色模式确认对比正常。
