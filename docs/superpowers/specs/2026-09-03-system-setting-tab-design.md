# 系统设置：顶层 Tab 固定「系统设置」+ 页内 Tab 切子模块

## 背景与问题

`系统设置` 是左侧菜单中的一个菜单项，期望点击后：

- 顶部全局 tab（多标签栏）显示「系统设置」；
- 页面内用 tab 切换 7 个子模块（录单格式、打印格式、导出格式、运单规则、通知配置、初始化数据、站点扫描）。

当前实际行为：点击「系统设置」会被路由守卫自动重定向到第一个子路由 `system-manage_setting_input-format`，导致**顶部全局 tab 显示的是子模块名（如「录单格式」）**，与期望不符。

根因位于 `src/router/guard/route.ts:21-25`：进入 `system-manage_setting` 时被强制跳转到 `system-manage_setting_input-format` 子路由，当前激活路由变为子路由，故 tab 标题取子路由名。

## 目标

1. 点击「系统设置」→ 路由停在父路由 `system-manage_setting` → 顶部全局 tab 显示「系统设置」。
2. 页面内 `NTabs` 切换 7 个子模块，子模块内容为各自已有的业务页面。
3. 子模块**不保留独立 URL / 不可直达 / 刷新回到默认第一个 tab**（已与用户确认，实现最干净，最贴合目标体验）。
4. 各子模块状态（如表格筛选条件）在切换时通过 `keep-alive` 保留。

## 方案概述

父路由 `system-manage_setting` 停留不跳转；`setting/index.vue` 由「`router-view` 渲染子路由」改为「本地状态 `activeKey` 驱动 `<component :is>` 渲染被 import 的子组件」。子路由定义继续由 elegant-router 生成（目录保留），但不再被导航访问。

## 详细改动

### 1. `src/views/system-manage/setting/index.vue`（核心改造）

- 删除 `<router-view v-slot="{ Component }"><keep-alive><component :is="Component" /></keep-alive></router-view>`。
- 删除基于 `route.name` 的 `activeTab` 计算属性。
- 新增本地状态：`const activeKey = ref('input-format')`。
- `import` 7 个子组件：
  - `import InputFormat from './input-format/index.vue'`
  - `import PrintFormat from './print-format/index.vue'`
  - `import ExportFormat from './export-format/index.vue'`
  - `import WaybillRule from './waybill-rule/index.vue'`
  - `import NotificationConfig from './notification-config/index.vue'`
  - `import InitData from './init-data/index.vue'`
  - `import StationScan from './station-scan/index.vue'`
- 建立映射：`const componentMap: Record<string, Component> = { 'input-format': InputFormat, ... }`。
- `NTabs` 改为 `:value="activeKey"`，`@update:value="key => (activeKey = key)"`（**不再调用 `router.push`**）。
- 内容区改为：
  ```vue
  <div class="min-h-0 flex-1">
    <keep-alive>
      <component :is="componentMap[activeKey]" />
    </keep-alive>
  </div>
  ```
- `tabs` 数组（label 文案）保持不变，仍用 `page.manage.setting.*` 的 i18n key。
- 默认激活项：`activeKey` 初值 `'input-format'`（录单格式）。

### 2. `src/router/guard/route.ts`（删除重定向）

删除第 21-25 行：

```ts
// 系统设置：进入第一个 tab（录单格式），而非默认的字母序子路由
if (to.name === 'system-manage_setting') {
  const settingFirstTab: RouteKey = 'system-manage_setting_input-format';
  return { name: settingFirstTab, replace: true };
}
```

使点击「系统设置」停在父路由 `system-manage_setting`，顶部 tab 即显示「系统设置」。

### 3. 防御性保护（推荐）

在 `createRouteGuard` 的 `beforeEach` 中，若 `to.name` 命中 `system-manage_setting_*` 任一子路由，重定向回 `system-manage_setting`：

```ts
// 系统设置子模块不再独立可访问，统一回到父路由由页内 tab 接管
if (to.name && to.name.toString().startsWith('system-manage_setting_')) {
  return { name: 'system-manage_setting', replace: true };
}
```

避免外部链接 / 手滑直接命中子路由 URL 时顶部 tab 显示子模块名。

## 保持不变

- 7 个子组件目录（`input-format/`、`print-format/`、`export-format/`、`waybill-rule/`、`notification-config/`、`init-data/`、`station-scan/`）及其业务逻辑原样复用，作为普通组件被 import 渲染。
- 路由表结构：`system-manage_setting` 及其 7 个子路由仍由 elegant-router 自动生成；子路由均 `hideInMenu: true`，不影响左侧菜单。
- 所有 i18n 文案（`route.system-manage_setting`、`page.manage.setting.*`）保持不变。
- 菜单项 `system-manage_setting` 的 `order` 与 `icon` 保持不变。

## 风险与缓解

- **子组件对子路由的依赖**：各子组件原本是独立路由页面，作为普通组件被 import 渲染时，需确认其不依赖当前子路由的 `useRoute()/useRouter()`（例如读取 `route.params`、基于 `route.name` 判断等）。若发现依赖，需改为 props 或 Pinia state。实现阶段会逐个子组件检查 `useRoute`/`useRouter` 用法。
- **死路由冗余**：子路由定义保留但不再被访问，属无害冗余；因菜单 `hideInMenu` 且无任何链接指向，不会出现「可直达」情况（加第 3 点防御后更稳妥）。
- **keep-alive 缓存**：`<component :is>` 外层包 `<keep-alive>` 以保留子模块状态；若某子组件不适合被缓存（如含一次性初始化副作用），实现时评估是否排除。

## 验证方法

- `pnpm typecheck` 通过（重点确认 `componentMap` 类型、`ref` 类型）。
- `pnpm lint` 通过。
- `pnpm build` 通过。
- 手动验证：
  1. 点击左侧「系统设置」→ 顶部 tab 显示「系统设置」（非「录单格式」等子模块名）。
  2. 页面内依次点击 7 个子模块 tab → 内容与各自业务页面一致，切换正常。
  3. 在某子模块修改筛选条件后切到另一模块再切回 → 条件被 `keep-alive` 保留。
  4. 刷新页面 → 停留在「系统设置」，默认显示「录单格式」。
  5. 直接访问子路由 URL（如 `/system-manage/setting/print-format`）→ 被重定向回「系统设置」。
