# 录单格式列表 hover 样式修正

## 问题现象

系统设置 - 录单格式页左侧 `MasterDetail` 列表：鼠标 hover 到非选中项时，背景色与选中态几乎一样（都是蓝色系），导致用户无法区分「当前 hover」和「当前选中」两种状态，视觉上容易混淆。

截图中红框行（hover/选中态）与上一行均呈蓝色背景 + 白色文字，看起来状态重复。

## 根因

`MasterDetail.vue` 的样式把 hover 背景设为主色 hover 变量：

```css
.menu-item:hover {
  background-color: var(--menu-primary-hover);
}
.menu-item--active {
  color: #fff;
  background-color: var(--menu-primary);
}
```

`themeVars.primaryColorHover` 与 `themeVars.primaryColor` 在默认主题下非常接近，且 hover 时未覆盖文字颜色，导致 hover 态和 active 态难以区分。

## 修复

把 hover 背景改为 Naive UI 通用悬浮底色 `themeVars.hoverColor`（浅色中性灰），而选中态保持主色背景 + 白色文字：

```html
:style="{ '--menu-primary': themeVars.primaryColor, '--menu-hover-bg': themeVars.hoverColor }"
```

```css
.menu-item:hover {
  background-color: var(--menu-hover-bg);
}
.menu-item--active {
  color: #fff;
  background-color: var(--menu-primary);
}
.menu-item--active:hover {
  background-color: var(--menu-primary);
}
```

效果：

- 非选中项 hover：浅灰背景、深色文字，与选中态明显不同。
- 选中项 hover：仍保持主色背景 + 白字（避免选中态被 hover 覆盖而闪烁）。
- `themeVars.hoverColor` 会随亮/暗主题自动切换。

## 影响范围

`MasterDetail.vue` 被 6 个设置 tab 复用（录单/打印/导出/通知/初始化/站点扫描），它们的左侧列表 hover 样式会同步修正。

## 验证

- `pnpm typecheck` 0 error。
- `pnpm fmt` 已格式化。
