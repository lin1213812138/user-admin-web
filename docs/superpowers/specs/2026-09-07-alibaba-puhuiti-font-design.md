# 阿里巴巴普惠体字体接入设计（2026-09-07）

## 1. 背景与目标

- 项目要求全站使用**阿里巴巴普惠体**（免费商用）。
- 直接挂全字库（9~16MB）会导致系统加载很慢，因此已通过「自动提取项目文字 + 真子集化」生成 116KB 的 woff2 子集。
- 本设计解决**接入**问题：让全站（含 Naive UI 组件与 vxe-table 表格）文字使用普惠体，且不影响加载速度。

### 已有产物（前置工作已完成）

| 产物                                           | 说明                                                                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/assets/fonts/AlibabaPuHuiTi-subset.woff2` | 字体子集，119,372 字节（116.6KB），family `Alibaba PuHuiTi` / Regular / 917 glyphs                                     |
| `src/assets/fonts/zh-web-charset.txt`          | 整站静态字符集（765 唯一汉字 + ASCII + 中文标点 = 875 字符），子集生成依据                                             |
| `scripts/font/extract-i18n-charset.mjs`        | 字符提取脚本（扫 views/components/layouts/locales-langs/constants/typings/router/store，跳过 src/service 的 DEV mock） |
| `src/assets/fonts/source/Alibaba-PuHuiTi.otf`  | 源字体 6.53MB（来自兄弟项目 user-web），仅用于重建子集                                                                 |

## 2. 现状调研结论（决定设计成败的关键事实）

1. **全站字体来源唯一**：`src/styles/css/reset.css` 的 `html { font-family: ui-sans-serif, system-ui, ... }`。
   样式链路：`main.ts → plugins/assets.ts → uno.css + styles/css/global.css → reset.css`。
2. **Naive UI 不继承全局字体**：`src/App.vue` 的 `NConfigProvider` 绑定 `:theme-overrides="themeStore.naiveTheme"`，由 `src/store/modules/theme/shared.ts` 的 `getNaiveTheme()` 构造 `common`（当前仅颜色与 `borderRadius`）。Naive 使用自带默认字体栈，不覆盖则所有 NButton / NInput / NSelect / 弹窗文字不会变普惠体。
3. **vxe-table 不继承全局字体**：vxe 在 `:root` 定义 `--vxe-ui-font-family: -apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC,Microsoft YaHei,...`。不覆盖该变量，所有表格（系统主界面）文字不会变普惠体。
4. 项目中**没有**其它 `fontFamily` 定义（UnoCSS `themeVars`、`theme/settings.ts`、Naive `themeOverrides` 均未设置字体）。

> 结论：仅改 `reset.css` 不够，必须同时覆盖 Naive 与 vxe 两处字体栈，否则出现"菜单变了、表格和按钮没变"的割裂状态。

## 3. 方案选型

| 方案          | 做法                                                                                                                              | 结论                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **A（采用）** | 新增 `font.css`（`@font-face` + `font-display: swap`）+ 改 `reset.css` 的 html 字体栈 + 覆盖 vxe 变量 + Naive `common.fontFamily` | 纯 CSS + 一处主题配置，零运行时开销；字体走 Vite 打包带 hash、跟随 `VITE_BASE_URL` |
| B             | 字体放 `public/`，绝对路径引用                                                                                                    | 不参与 hash/长缓存，子目录部署需手动处理 base，放弃                                |
| C             | JS 动态 `document.fonts.load` 后切换 class                                                                                        | 复杂度高，116KB 字体无必要，放弃                                                   |

## 4. 详细设计

### 4.1 新增 `src/styles/css/font.css`

```css
@font-face {
  font-family: 'Alibaba PuHuiTi';
  src: url('../../assets/fonts/AlibabaPuHuiTi-subset.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  --app-font-family: 'Alibaba PuHuiTi', ui-sans-serif, system-ui, -apple-system, 'Microsoft YaHei', sans-serif;
}

/* 覆盖 vxe-table 自带的字体栈；html:root 提升特异性，确保晚于 vxe 样式也能生效 */
html:root {
  --vxe-ui-font-family: var(--app-font-family);
}
```

- `font-display: swap`：字体未就绪先用系统字体渲染，绝不阻塞首屏、不白屏。
- 只提供 woff2（现代浏览器，不兼容 IE，本项目无此需求）。
- 相对路径 `../../assets/...` 由 Vite 处理为带 hash 的产物并跟随 `base`。

### 4.2 修改 `src/styles/css/global.css`

在文件顶部（`reset.css` 之前，满足 `@import` 必须前置的规范）加入：

```css
@import './font.css';
@import './reset.css';
@import './nprogress.css';
@import './transition.css';
```

### 4.3 修改 `src/styles/css/reset.css`

`html` 的 `font-family` 改为引用变量（原系统字体链已并入 `--app-font-family`）：

```css
html {
  font-family: var(--app-font-family);
}
```

### 4.4 修改 `src/store/modules/theme/shared.ts`

在 `getNaiveTheme()` 的 `common` 中增加字体（`GlobalThemeOverrides`）：

```ts
/** 与 CSS 变量 --app-font-family 保持一致，修改字体时需同步两处 */
const APP_FONT_FAMILY = "'Alibaba PuHuiTi', ui-sans-serif, system-ui, -apple-system, 'Microsoft YaHei', sans-serif";

const theme: GlobalThemeOverrides = {
  common: {
    ...getNaiveThemeColors(colors, settings.recommendColor),
    borderRadius: `${settings.themeRadius}px`,
    fontFamily: APP_FONT_FAMILY
  },
  LoadingBar: {
    // ... 其余既有配置保持原样，不改动
  }
};
```

> 说明：Naive 的 `fontFamily` 走 cssinjs 注入，此处写完整字符串而非 `var()`，避免拼接风险；代价是字体名需在 CSS 变量与此处同步维护。

## 5. 决策与默认值（用户确认方案 A 后按推荐值执行，review 时可调整）

1. **作用域**：全站启用。缺字自动 fallback 到系统字体（微软雅黑/苹方），不做"仅界面壳层"的区分。
2. **naive-ui 内置 zhCN 文案**（分页"共 N 条"、日期面板等，字体文本在 `node_modules`）：**本次不补**（YAGNI）。若验证时发现明显缺字，再把这些字加入字符表并重新生成子集。
3. **源字体入库**：`src/assets/fonts/source/`（6.53MB）**不入库**，在 `.gitignore` 中排除；仓库只保留 116KB 子集与重建命令。
4. **依赖清理**：移除未使用的 `cn-font-split`（其 `subsets` 是分包范围而非真子集，未采用）。
   命令（本机需先清空注入变量）：`$env:NODE_OPTIONS=""; pnpm remove cn-font-split`

## 6. 维护流程（新增文案后）

一条命令即可（自动重新提取字符表并重建子集）：`pnpm font:build`。

也可分两步：`pnpm font:charset` 只重新提取字符表，`pnpm font:build` 提取 + 生成。

实现：`package.json` 新增 `font:charset` / `font:build` 两个脚本，分别调用
`scripts/font/extract-i18n-charset.mjs` 与 `scripts/font/build-subset.mjs`（后者自动探测 `python`/`python3` 调用 fontTools）。

**注意：改文案不会自动更新字体**，需手动执行；未更新时新增的字回退系统字体（不报错）。

## 7. 验证计划

| 项         | 方法                                     | 期望                                                                            |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| 资源加载   | `pnpm dev` → DevTools Network 过滤 woff2 | 单个请求约 116KB、200、`font-display: swap` 生效                                |
| vxe 表格   | 任意列表页（如用户管理）                 | 表头与单元格文字为普惠体（**验证 `--vxe-ui-font-family` 是否被 vxe 样式覆盖**） |
| Naive 组件 | 弹窗 / 下拉 / NButton                    | 文字为普惠体                                                                    |
| 菜单与页面 | 侧边菜单、按钮、标题                     | 文字为普惠体                                                                    |
| 首屏       | 刷新观察                                 | 无长时间空白（swap 先用系统字体）                                               |
| 静态检查   | `pnpm typecheck`、`pnpm lint`            | 无新增错误                                                                      |

失败兜底：若 vxe 变量未生效，将 `html:root` 进一步提升为 `html:root:root` 或在变量值后追加 `!important`；若 Naive 未生效，检查 `NConfigProvider` 的 `theme-overrides` 是否传递到 `common.fontFamily`。

## 8. 风险与不做的事

**风险**

- 缺字回退：后端动态业务值（客户名、地址、单据号）不在字符表，缺字时回退系统字体，属预期行为。
- 字体名同步：CSS 变量与 TS 常量两处需一致（已在代码注释标明）。
- 仅 Regular 字重：界面中 `font-weight: 500/600` 会由浏览器合成加粗，观感略有差异（可接受，后续需要再加 Bold 子集）。

**不做（YAGNI）**

- 不做多字重子集、不叠加 3500 常用字、不做服务端动态子集
- 不加 `<link rel="preload">`（116KB 无必要）
- 不动 `packages/`、不改构建配置、不引入新依赖
- 不做按钮/组件级字体切换开关

## 9. 影响文件清单

| 文件                                | 动作                                    |
| ----------------------------------- | --------------------------------------- |
| `src/styles/css/font.css`           | 新增                                    |
| `src/styles/css/global.css`         | 修改（加 `@import`）                    |
| `src/styles/css/reset.css`          | 修改（html font-family 用变量）         |
| `src/store/modules/theme/shared.ts` | 修改（common 加 fontFamily）            |
| `.gitignore`                        | 修改（排除 `src/assets/fonts/source/`） |
| `package.json`                      | 修改（移除 `cn-font-split`）            |
