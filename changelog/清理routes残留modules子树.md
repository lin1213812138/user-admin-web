# 清理 routes.ts 残留 modules 子树（修复 elegant-router 生成崩溃）

- 日期：2026-09-20
- 类型：缺陷修复（生成文件与扫描配置不一致）
- 状态：已实施（清理 + 静态不变量核验通过；dev 启动验证见「验证」）
- spec：`docs/superpowers/specs/2026-09-20-清理routes残留modules子树-design.md`

## 现象

`pnpm dev`（= `node scripts/update-env-ip.mjs && vite --mode test`）启动即崩，在 IP 更新之后：

```
TypeError: Cannot read properties of undefined (reading 'replace')
    at b (.../@elegant-router/vue/dist/shared/vue.adf39a67.mjs:245:1381)
    at ...:245:236 → Array.map → N (...:245:44) → ne → oe → pe.generate
```

## 流程（硬闸门）

G0 技能判定（`using-agent-skills`：`debugging-and-error-recovery` → `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation`）→ G1 spec 落 `docs/superpowers/specs/2026-09-20-清理routes残留modules子树-design.md`（状态「待确认（禁止实现）」）→ G2 用户「开始」（命中宽泛口令）→ G3 落章「已确认（用户确认：开始）」→ G5 实施 → G6 本记录。

## 根因（源码级）

1. 崩溃函数 `b(o)` 就是 `transform.ts` 里同一套解析器：`const [layout, view] = o.split('$')`，缺 `$` 时 `view` 为 `undefined` → `undefined.replace('view.','')`。
2. 合并器 `N(existedRoutes, newRoutes, config)`：
   ```js
   const f = !name.includes('_') && !children?.length;      // 「一级单级页面」
   if (n.component && i) if (f) { const {layoutName:R} = b(n.component); ... }
   ```
   `n` = **`routes.ts` 里已存在的节点**（合并基准 `{...n, path}`），此分支要求 component 形如 `layout.<x>$view.<name>`。
3. 工作区 `routes.ts` 把 `personal-center` 写成**多级容器**：`component: 'layout.base'`（无 `$`）+ `children: [personal-center_modules*]`；
   而当前配置（`build/plugins/router.ts` 的 `pageExcludePatterns: ['**/components/**','**/modules/**']`）下它是**一级单级页面**，三处证据一致：`elegant-router.d.ts` 的 `LastLevelRouteKey` 含 `personal-center` 且 `CenterLevelRouteKey` 为空；`imports.ts` 有 `personal-center`、无 modules 视图；i18n 无任何 `_modules_` 路由 key（26 页）。
4. ⇒ `f = true` 却拿到 `'layout.base'` ⇒ 崩。

残留来源（既有先例）：`changelog/收货渠道报价设置界面.md` 踩坑②已记录 —— 旧配置 watcher 在新配置生效前仍按「不排除 modules」生成，而 `N()` **不会删除旧文件里多出来的 children**，于是 `routes.ts` 累积 `*_modules*` 残留子树。本次是该残留 + `personal-center` 变单级页面的再次发作；上次以「手工清理残留子树」收尾，本次同样收尾并把不变量写进记录。

## 实施

只改 `src/router/elegant/routes.ts`，两件事（同文件多处编辑用整文件写入，避免本仓库已记录的「并行 diff 编辑互相覆盖」问题）：

1. 删除 9 组残留 `*_modules*` 子树（`children` 与其中所有节点）：
   `personal-center` / `channel-quote_receive` / `data-manage_basic` / `_bl` / `_business` / `_finance` / `_no-rule` / `_ship` / `system-manage_setting`；
2. `personal-center` 的 `component: 'layout.base'` → `'layout.base$view.personal-center'`（去掉 children 后成为单级页面）。

保留：文件头生成说明与 NOTE、尾部 `isNonMenuRoute` / `nonMenuRoutes` / `menuRoutes` 派生导出、全部 `meta`（icon/order/permission/hideInMenu/activeMenu/keepAlive 均由 `onRouteMetaGen` 提供，未受影响）。

结果：30 个节点 = 26 个扫描页面 + 4 个多级容器（`channel-quote` / `customer-manage` / `data-manage` / `system-manage`），`_modules_` 在文件中 0 命中。

## 验证

| 项                             | 结果                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 崩溃不变量（静态逐条核验）     | 现文件中「name 不含 `_` 且无 children」的节点只有 `403/404/500/home/iframe-page/login/personal-center`，component 全部含 `$`；含 `_` 的叶子 component 均为 `view.*` ⇒ `f` 分支不再可能收到无 `$` 的 component |
| 节点集合核对                   | 30 节点与 `elegant-router.d.ts` 的 26 个页面 key 一一对应（+ 运行时注入的 `channel-quote_receive_quote-setting`）                                                                                             |
| `read_lints`（routes.ts）      | 0 诊断                                                                                                                                                                                                        |
| `pnpm build:test`              | 已越过路由生成阶段（无 TypeError），最终在 `vite:prepare-out-dir` 被本机 WebStorm 安全删除 shim 拦下（`--file parameter is required`，历史 changelog 已记录的环境限制，与代码无关）                           |
| `pnpm typecheck`               | 20 处错误**全部**在 `src/components/common/handsontable/**`（`handsontable` 依赖未安装到 `node_modules`，与本次改动无关、未触碰）                                                                             |
| dev 启动（`vite --mode test`） | 待用户确认（需先彻底结束旧 dev server 进程，否则旧 watcher 可能再次写回残留）                                                                                                                                 |

## 后续须知（防止复发）

1. `N()` 的合并以旧文件为基准且**不删多余 children** ⇒ 只要扫描配置变过（例如排除 `modules`）而旧 watcher 还在跑，`routes.ts` 就会再次积累 `*_modules*` 残留；届时同一处会再崩。
2. 因此：改 `build/plugins/router.ts` 的扫描配置后**必须彻底重启 dev server**（先杀旧进程）；启动报 `reading 'replace'` 时，第一件事是检查 `routes.ts` 是否又长出 `_modules_` 子树。
3. 手工注册内嵌页仍走三件套（`customRoutes.map` + `routes/index.ts` 注入 + `embeddedViews`），不要把 `modules/**` 的页面塞进 `routes.ts`。
