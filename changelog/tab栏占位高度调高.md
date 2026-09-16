# tab 栏占位高度调高

## 背景

用户附截图（红框标出顶部页签栏：「客户管理」「系统设置」等 tab）："这个的占位高度太低了，能不能调高一点"。

## 定位

- 标签栏占位高度由主题配置 `src/theme/settings.ts` 的 `tab.height` 控制（默认模板值 `44`），经 `src/layouts/base-layout/index.vue` 的 `:tab-height="themeStore.tab.height"` 传入 `AdminLayout`（`@sa/materials`）。
- chrome 页签（`PageTab`）自身无固定像素高度，背景 SVG 为 `height: 100%`，自适应容器高度，因此**只需改 `tab.height` 一处**。
- dev 模式下 `initThemeSettings()` 直接返回 `themeSettings`（不走 localStorage 缓存），改完刷新即生效；prod 缓存合并用的 `overrideThemeSettings` 为空对象，不会被覆盖。

## 确认

用户在 44 / 48 / 50 / 52 / 56 候选中确认 **50px**（比原 44 高 6px）。

## 改动

- `src/theme/settings.ts`：`tab.height` 由 `44` → `50`，附中文注释说明。

## 验证

- `pnpm typecheck` 通过；视觉高度刷新页面复核。

## 更正（同日第二轮）

用户复核后澄清："不是让你调框选的绿色的高度，是里面红色的标签的高度" —— 绿框=整条占位栏（50px 保持不动），红框=chrome 页签本体。

### 补充定位

- 页签本体 = `packages/materials/src/libs/page-tab/chrome-tab.vue` 根 div，高度由内容行高 + `py-6px` 撑开，**约 36px**，不随占位栏变高 ⇒ 上一轮改 `tab.height` 对页签本体无效。
- 页签背景 `chrome-tab-bg.vue` 的 SVG 为 `h-full`（symbol viewBox 0 0 214 36 等比拉伸），任意高度不变形。
- `PageTab` 根节点 attrs fallthrough：外部 class 会合并到 ChromeTab 根元素 ⇒ 可在业务侧 `global-tab/index.vue` 直接透传高度 class，**不动 `packages/`**。

### 改动（用户确认页签 48px）

- `src/layouts/modules/global-tab/index.vue`：`<PageTab>` 透传 `class="h-48px"` + 中文注释；占位栏 `tab.height: 50` 维持上一轮结果。

### 验证

- read_lints 0 / `pnpm typecheck` 0；视觉待用户复核（页签 48px、占位栏 50px、上下各留 1px）。

## 第三轮：页签「飞上去了」+ 全局联动（最终方案）

用户追问"能不能变成跟标签栏高度一样可以全局配置"，随后截图："为什么飞上去了"。

### 根因（playwright 实测，非猜测）

- 打开 9111 dev（admin/admin@12345 登录），用 `data-tab-id` 定位（`.chrome-tab` 是 CSS module 带 hash 类名，直接查不到）逐层测量：
  - 页签 `h-48px` 生效（h=48），但整条链路（DarkModeContainer → bsWrapper → bsContent → tabRef）**全部 44px**；
  - 页签 `offsetTop: -4` —— 48px 页签在 44px 栏里 `items-end` 贴底后**顶部溢出 4px** 被窗口边缘裁切，即「飞上去」。
- 链路里 `settings.ts` 的 `height` **被改回了 44**（中文注释仍在、值与之矛盾，属误改回退）。
- 反证：在登录页注入同构 DOM（`.h-48px` 规则存在、三层容器）测得 tabTop=2 贴底正常 —— 纯 CSS 链路本身没问题，问题就是 44/48 失配。

### 最终方案：页签高度联动 tab.height（全局单配置）

- `global-tab/index.vue`：`class="h-48px"` → `:class="themeStore.tab.mode === 'chrome' ? 'h-full' : ''"` —— 页签撑满 `tab.height`，改一处两处同步变，永不溢出（slider 模式 CSS 本就 `height:100%`，button 模式不受影响）。
- `settings.ts`：`height` 恢复 50（用户第一轮确认值），注释同步为联动说明。

### 验证（实测）

- reload 后：tab 栏 50px、页签 50px、`offsetTop: 0`、无溢出、`h-full` 已应用；
- 截图复核：页签贴底与内容区衔接，Chrome 风格正常；
- `pnpm typecheck` 0。

### 教训

- 改布局前先确认「当前文件真实值」——中间被并行会话/用户改回的值是本次"飞上去"的直接原因；纯推理布局链不如浏览器实测一次。
