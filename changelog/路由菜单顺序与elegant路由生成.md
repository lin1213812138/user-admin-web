# 侧边栏菜单顺序 vs elegant-router 自动重排路由文件

> 2026-09-03 讨论记录

## 背景

- 用户多次反馈：`pnpm dev` 启动后 `src/router/elegant/routes.ts` 里的**路由块顺序**被"打乱/格式化"，即使加了 `meta.order` 也一样。
- 诉求：启动时允许生成器补充 `order` meta，但**不允许改动用户排好的路由块顺序**。

## 根因（已读插件源码确认）

- `build/plugins/router.ts` 中 `ElegantVueRouter`（@elegant-router/vue 0.3.8）在每次 dev/build 启动都会**全量重写** `routes.ts / imports.ts / transform.ts`。
- 插件选项类型（`vue.9d9f94c9.d.ts` 的 `ElegantVueRouterOption`）**没有"保留旧文件块顺序"的开关**。
- 合并逻辑（`dist/shared/vue.adf39a67.mjs` 的 `N`/`F`）：
  - 输出按**本次扫描结果**（生成器自己的顺序，实际按路由名字典序逐层排列）`map` 重组，不保留旧文件块顺序 → 手工重排必然被还原。
  - meta 合并 `F` 的语义是 **已有 key 不覆盖、只补缺失 key** → 手填进文件里的 `order` 会留存，但也意味着：**改 routeOrders 的新数字不会覆盖文件里已存在的 order 键**。

## 结论与既定方案

1. **显示顺序只由 `meta.order` 决定**（`sortRoutesByOrder` 升序，缺省 0，同值按数组原序稳定排序），与 routes.ts 里块的物理排列无关。
2. 固化配置（`build/plugins/router.ts` → `routeOrders`）：
   - `home: 0`、`data-manage: 1`、`system-manage: 2`（子级 `system-manage_role: 1`、`system-manage_user: 2` 保持）→ 侧边栏稳定为 首页 → 资料管理 → 系统管理。
3. **禁止手改 / 手排 `src/router/elegant/**`\*\*；把生成器产出的规范版本提交一次后，后续 dev 启动幂等写入，不再产生无谓 diff。
4. 以后改菜单顺序：只改 `routeOrders` 数字；若该路由的 `order` 已存在于生成的 routes.ts，需先删掉文件里那一行旧键再重启 dev，新值才能印上。

## 结论

在 elegant-router 机制下，"启动补 order 且保留手工块顺序"不可兼得；但块顺序对菜单显示无影响，用户要的顺序由 meta.order 完全接管，稳定且不受重排影响。
