# 页签关闭图标 hover 效果消失排查

> 2026-09-18（当日二次排查后确认真正根因）

## 现象

用户贴截图（客户列表页，红框圈住「客户列表」页签的关闭 ×）："这个 hover 效果又没了，今天不是加了吗？" 强刷/重启 dev server 后仍然没有。

## 排查过程

1. **第一轮（结论错误）**：源码 `packages/materials/src/libs/page-tab/index.module.css` 三条 slider hover 规则在位且已提交；渲染链路匹配；截图端口 9527 无服务监听 ⇒ 误判为"浏览器陈旧页面"。用户强刷后依旧无效，证伪。
2. **第二轮（playwright 实测定位）**：登录后 eval 检查 DOM——页签类名 hash 是 `_slider-tab_gmu1w_197`，而直接抓 `/tms/packages/materials/...` 编译产物是 `_wmyri_`，**两份不同的编译产物**；遍历 `document.styleSheets` 发现页面里只有 button/chrome 模式的 `svg-close:hover` 规则，**没有 slider 的**（旧版 CSS 的特征）。
3. **根因确认**：资源加载 URL 是 `node_modules/@sa/materials/src/libs/page-tab/...`。检查发现 `node_modules/@sa/materials` **不是指向 `packages/materials` 的 Junction 软链，而是一份 9/13 的真实旧目录（v0.0.4）**，而 packages 里是 v0.0.9。即依赖声明 `workspace:*` 但软链丢失，pnpm 把它当普通包装了旧内容。**这几天对 `packages/materials` 的所有修改（含 hover 修复）应用从未加载过**。此前直接抓 `/tms/packages/...` 路径验证是"抓对了文件、抓错了对象"，dev server 下发验证必须用应用实际解析的 `node_modules` 路径。

## 修复

1. 杀掉 9111/9112 两个 dev server，`pnpm i` 重装依赖（52s）——`node_modules/@sa/*` 全部恢复为 Junction 软链，指向 `packages/*` 当前源码。
2. 重启 dev server，playwright 端到端复验：页签与关闭图标 hash 一致（`_wmyri_`），hover 关闭 × 计算样式 `backgroundColor: transparent → rgb(59,130,246)`、图标变白，截图确认蓝色圆底高亮出现。

## 教训（重要）

- **"改了没生效"必须验证应用实际解析的模块路径**，不能只看源码或按源码路径抓编译产物。pnpm workspace 项目的软链（Junction）可能悄悄丢失（`node_modules` 被局部覆盖/旧安装残留），表现为"源码在改、应用在跑旧拷贝"。
- 快速判别法：`Get-Item node_modules/@sa/xxx | Select LinkType`（应为 Junction）+ 比对 `node_modules/@sa/xxx/package.json` 与 `packages/xxx/package.json` 的 version 是否一致。
- 修复手段：杀 dev server → `pnpm i` → 重启。
- DOM 类名 hash 对不上（`gmu1w` vs `wmyri`）是发现双份编译产物的关键线索：**同名 CSS module 出现两个 hash = 同一文件被编译了两份，必有路径分叉**。
