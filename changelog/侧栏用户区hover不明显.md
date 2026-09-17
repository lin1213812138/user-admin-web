# 侧栏用户区 hover 不明显

## 问题现象

浅色主题 + 深色侧栏（`sider.inverted`）下，侧栏底部用户区（头像 + 用户名）鼠标 hover 时几乎无任何视觉反馈：行内左右空白无反应，按钮区域也没有可见的背景变化（用户截图红框标出底部用户区整块）。

## 根因

三层叠加：

1. **热区只在按钮本身**：底部是「全宽行 + 居中 `NButton quaternary`」结构（`global-sider/index.vue` → `UserAvatar` → `ButtonIcon`），hover 热区仅图标 + 文字那一小块，行内左右空白不属于按钮。
2. **hover 背景在深色底上不可见**：`ButtonIcon` 是 `NButton quaternary`，naive 按**浅色主题**计算其 hover 背景（`node_modules/naive-ui/es/button/src/styles/index.cssr.mjs` L93 `background-color: var(--n-color-hover)`，浅色主题下为极淡深灰），叠在深蓝侧栏 `rgb(0,20,40)` 上肉眼不可辨。
3. **文字 hover 变色被压死**：`global-sider/index.vue` 此前为修主题适配加的 `.sider-footer--inverted :deep(.n-button) { color: rgba(255,255,255,0.82) !important }` 是裸 `color` + `!important`，会压过 naive `:hover` 规则里的 `color: var(--n-text-color-hover)`，连文字变色反馈也没有。

## 决策（两轮澄清，用户确认）

- 热区形态：**保持按钮热区**（不做整行热区；「整行热区」「整行热区 + 圆角卡片」两案未采纳）。
- hover 配色：**白色 16% 背景 + 文字转纯白**（「白色 12% 仅背景」「主色蓝半透明」两案未采纳）。

## 修复

只改 `src/layouts/modules/global-sider/index.vue` 的 `<style scoped>`：删除裸 `color` 覆盖，改为覆盖 naive 按钮三态 CSS 变量。NButton 的变量由 naive 以**内联 style** 设置在按钮元素上，外部样式表覆盖必须 `!important`：

```css
.sider-footer--inverted {
  color: rgba(255, 255, 255, 0.82);
}

/* 深色侧栏下用户区按钮：覆盖 naive 三态变量，hover/pressed 明显可见 */
.sider-footer--inverted :deep(.n-button) {
  --n-color-hover: rgba(255, 255, 255, 0.16) !important;
  --n-color-pressed: rgba(255, 255, 255, 0.24) !important;
  --n-text-color: rgba(255, 255, 255, 0.82) !important;
  --n-text-color-hover: #fff !important;
  --n-text-color-pressed: #fff !important;
}
```

效果：

- 常态：与改前一致（82% 白文字/图标，无背景）。
- hover：背景 16% 白 + 文字/图标转纯白，深蓝底上清晰可见。
- 按下：24% 白，反馈更深一层。
- 图标为 `currentColor`（iconify `Icon` 默认继承 / 本地 sprite `fill="currentColor"`），随文字色同步变化。

## 影响范围与边界

- 仅作用于**深色侧栏**（浅色主题 + `sider.inverted=true`）下底部用户区按钮，不影响其它任何 quaternary 按钮；侧栏折叠/展开均生效。
- 热区范围、按钮尺寸、布局结构均未改动。
- dark 主题下侧栏非 inverted（走 naive 深色默认 hover，略淡但可见），本次未做；如后续需要加强可补对应场景规则。

## 验证

- `pnpm typecheck` 0 error。
- `oxlint` / `eslint` 单文件 0 error。
- playwright 实测 dev 9111（真实登录后量测按钮 computed style）：常态 `background-color: rgba(0,0,0,0)` / `color: rgba(255,255,255,0.82)` → `mousemove` 到按钮中心后 `background-color: rgba(255,255,255,0.16)` / `color: rgb(255,255,255)`（`matches(':hover')=true`）→ 移出后恢复常态；console 0 error。
