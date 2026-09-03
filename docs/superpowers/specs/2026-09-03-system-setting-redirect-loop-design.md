# 系统设置点开卡死 —— 路由重定向死循环修复设计

## 问题现象

点击左侧菜单「系统设置」后页面卡死（白屏 / 无法响应），浏览器控制台报 vue-router 重定向循环。

## 根因

`src/router/elegant/transform.ts` 在路由转换时，会给**任何拥有 children 的路由**自动追加 `redirect` 指向第一个子路由（见第 139-143 行）：

```ts
if (children?.length && !vueRoute.redirect) {
  vueRoute.redirect = { name: children[0].name };
}
```

`system-manage_setting` 因 `views/system-manage/setting/<子页>/index.vue` 的存在，被 elegant-router 自动生成为包含 7 个子路由的父路由，于是被加上 `redirect: { name: 'system-manage_setting_export-format' }`。

而 `src/router/guard/route.ts` 第 21-24 行规定：所有 `system-manage_setting_*` 子路由一律 `replace` 回父路由 `system-manage_setting`（设计意图是「子页不独立可访问，由页内 tab 接管」）。

两者叠加形成死循环：

```
点系统设置 → /setting 自动重定向到 export-format 子路由
→ 守卫拦截重定向回 /setting
→ /setting 又自动重定向到子路由 → ……无限循环
```

## 修复方案：重构目录

将 7 个 tab 子页从「自动路由目录」移出，使其成为纯组件（不再生成子路由），让 `system-manage_setting` 退化为叶子路由（无 children → 无自动 redirect），从而彻底消除循环。

### 具体改动

1. **移动 7 个子页**（保留 git 历史，用 `git mv`）：
   - `setting/input-format/index.vue` → `setting/modules/InputFormat.vue`
   - `setting/print-format/index.vue` → `setting/modules/PrintFormat.vue`
   - `setting/export-format/index.vue` → `setting/modules/ExportFormat.vue`
   - `setting/waybill-rule/index.vue` → `setting/modules/WaybillRule.vue`
   - `setting/notification-config/index.vue` → `setting/modules/NotificationConfig.vue`
   - `setting/init-data/index.vue` → `setting/modules/InitData.vue`
   - `setting/station-scan/index.vue` → `setting/modules/StationScan.vue`

   子页内部仅引用 `../components/MasterDetail.vue` 与 `../components/FieldMapping.vue`，移动到 `setting/modules/` 后 `../components/` 仍指向 `setting/components/`，**无需改动子页内部 import**。

2. **更新 `setting/index.vue` 的 import 路径**（7 处）：`'./input-format/index.vue'` → `'./modules/InputFormat.vue'` 等（componentMap 的 key 保持不变）。

3. **移除守卫里已失效的重定向规则**（`src/router/guard/route.ts` 第 21-24 行）：移动后不再存在 `system-manage_setting_*` 子路由，该规则成为死代码。

4. **重新生成路由**：`pnpm gen-route`，使 `routes.ts` / `imports.ts` / `transform.ts` / `elegant-router.d.ts` / `components.d.ts` 不再包含 7 个子路由。

5. **验证**：`pnpm typecheck` 通过；手动 `pnpm dev` 点击「系统设置」应正常进入 tab 页，7 个子模块可切换。

## 设计意图对齐

- 「系统设置」为单一菜单项，内部用 `NTabs` 本地 `activeKey` 切换 7 个子模块，**无独立子路由 URL**（与既有设计一致）。
- 子页作为 `modules/` 下的纯组件被 `index.vue` 直接 `import`，符合 AGENTS.md「页面私有子组件放同级 modules/」的约定。
- `system-manage_setting` 成为叶子路由后，vue-router 不再自动重定向，页内 tab 容器正常渲染。

## 影响范围

- 仅涉及 `system-manage/setting` 模块，不影响其它路由与页面。
- 刷新后默认停留在 `input-format`（页内 tab 默认值），与之前一致。
- 外部直接访问 `/system-manage/setting/xxx` 的 URL 将因路由不存在而落到 404（符合「子页不独立可访问」的设计）。
