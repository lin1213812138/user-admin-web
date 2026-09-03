# 系统设置：顶层 Tab 固定「系统设置」+ 页内 Tab 切子模块 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 点击「系统设置」后顶部全局 tab 稳定显示「系统设置」，页面内 `NTabs` 切换 7 个子模块，子模块内容为其原有业务页面。

**Architecture:** 父路由 `system-manage_setting` 停留不跳转；`setting/index.vue` 由「`router-view` 渲染子路由」改为「本地 `activeKey` + `import` 子组件 + `<component :is>` 渲染」，并用 `keep-alive` 保留子模块状态。子路由定义继续由 elegant-router 生成（目录保留）但不再被导航访问。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">`、Naive UI 2.44、vue-router 5、elegant-router（自动路由）、vue-i18n、pnpm。

## Global Constraints

- **禁止手改** `src/router/elegant/**`、`src/typings/elegant-router.d.ts`、`src/typings/components.d.ts`；路由 meta 只写在 `src/router/routes/index.ts` 的 `customRoutes`（本次不改动 meta）。
- 新增 i18n 文案必须 **zh-cn.ts / en-us.ts / `App.I18n.Schema` 三处同步**（本次不新增 i18n key）。
- 禁止 `any`；用 `unknown` + 类型收窄。
- 只能用 **pnpm**（禁用 npm / yarn）。
- 组件文件 kebab-case，组件名 PascalCase，组合式函数 `useXxx`。
- 验证手段：`pnpm typecheck` / `pnpm lint` / `pnpm build`（本项目**无测试框架，不写单测**）。
- 提交用 `pnpm commit`（交互式 Conventional Commits，走 `sa git-commit-verify`），不要直接 `git commit`。

---

## 文件结构（本次改动）

```
src/
├── views/system-manage/setting/
│   └── index.vue                       # 改造：本地 activeKey + import 子组件 + <component :is>，去掉 router-view
└── router/guard/route.ts              # 删除「进入系统设置重定向到子路由」逻辑 + 加子路由防御
```

7 个子组件（`input-format/`、`print-format/`、`export-format/`、`waybill-rule/`、`notification-config/`、`init-data/`、`station-scan/`）**原样复用，不改动**——已确认它们均为本地状态驱动，无 `useRoute/useRouter` 依赖。

---

## Task 1: 改造 `setting/index.vue`（父页页内 Tab）

**Files:**

- Modify: `src/views/system-manage/setting/index.vue`（整文件替换 `<script setup>` 与 `<template>`）

**Interfaces:** 产出可被直接渲染的 7 个子组件映射；`activeKey` 默认 `'input-format'`。后续 Tab 切换只改 `activeKey`，不再 `router.push`。

- [ ] **Step 1: 用以下内容整体替换 `setting/index.vue`**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Component } from 'vue';
import { $t } from '@/locales';
import InputFormat from './input-format/index.vue';
import PrintFormat from './print-format/index.vue';
import ExportFormat from './export-format/index.vue';
import WaybillRule from './waybill-rule/index.vue';
import NotificationConfig from './notification-config/index.vue';
import InitData from './init-data/index.vue';
import StationScan from './station-scan/index.vue';

const tabs = [
  { key: 'input-format', label: $t('page.manage.setting.inputFormat') },
  { key: 'print-format', label: $t('page.manage.setting.printFormat') },
  { key: 'export-format', label: $t('page.manage.setting.exportFormat') },
  { key: 'waybill-rule', label: $t('page.manage.setting.waybillRule') },
  { key: 'notification-config', label: $t('page.manage.setting.notificationConfig') },
  { key: 'init-data', label: $t('page.manage.setting.initData') },
  { key: 'station-scan', label: $t('page.manage.setting.stationScan') }
];

const activeKey = ref('input-format');

const componentMap: Record<string, Component> = {
  'input-format': InputFormat,
  'print-format': PrintFormat,
  'export-format': ExportFormat,
  'waybill-rule': WaybillRule,
  'notification-config': NotificationConfig,
  'init-data': InitData,
  'station-scan': StationScan
};

const activeComponent = computed<Component>(() => componentMap[activeKey.value] ?? InputFormat);

function handleTabChange(key: string) {
  activeKey.value = key;
}
</script>

<template>
  <div class="h-full w-full flex-col p-16px">
    <NTabs :value="activeKey" type="line" @update:value="handleTabChange">
      <NTabPane v-for="t in tabs" :key="t.key" :name="t.key" :tab="t.label" />
    </NTabs>
    <div class="min-h-0 flex-1">
      <keep-alive>
        <component :is="activeComponent" />
      </keep-alive>
    </div>
  </div>
</template>
```

> 说明：`keep-alive` 外层包裹 `<component :is>`，不显式加 `key`，确保各子组件按类型分别缓存、切回时保留状态（如表格筛选条件）。`activeComponent` 用 `?? InputFormat` 兜底，避免 `componentMap[key]` 为 `undefined` 时的渲染告警。

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck`
Expected: PASS（无 `I18nKey` / `Component` / 路由类型报错）。

- [ ] **Step 3: 提交**

```bash
git add src/views/system-manage/setting/index.vue
pnpm commit
```

> 交互式提交，选择 `fix:` 类型，摘要如「fix(setting): 系统设置改为页内 tab 切换，顶层 tab 固定显示系统设置」。

---

## Task 2: 修改路由守卫（去重定向 + 加防御）

**Files:**

- Modify: `src/router/guard/route.ts`

**Interfaces:** 移除「进入系统设置落到子路由」的逻辑，使 `system-manage_setting` 停留；新增防御：任何直接命中 `system-manage_setting_*` 子路由的访问都被拉回父路由。

- [ ] **Step 1: 删除 `createRouteGuard` 内的重定向块**

删除 `src/router/guard/route.ts` 第 21-25 行：

```ts
// 系统设置：进入第一个 tab（录单格式），而非默认的字母序子路由
if (to.name === 'system-manage_setting') {
  const settingFirstTab: RouteKey = 'system-manage_setting_input-format';
  return { name: settingFirstTab, replace: true };
}
```

- [ ] **Step 2: 在同一位置（紧接 `initRoute` 之后）加入子路由防御**

在 `const location = await initRoute(to);` 与 `if (location) { return location; }` 之后，原重定向块处，替换为：

```ts
// 系统设置子模块不再独立可访问，统一回到父路由由页内 tab 接管
if (to.name && to.name.toString().startsWith('system-manage_setting_')) {
  return { name: 'system-manage_setting', replace: true };
}
```

> 判断用 `startsWith('system-manage_setting_')`（带末尾下划线），父路由名 `system-manage_setting` 不含该后缀，不会被误匹配；重定向回父路由后仍正常走后续登录/权限检查。

- [ ] **Step 3: 类型检查与 Lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS（无类型 / lint 报错；`RouteKey` 类型在此文件中已 import，本改动不新增 import）。

- [ ] **Step 4: 提交**

```bash
git add src/router/guard/route.ts
pnpm commit
```

> 交互式提交，选择 `fix:` 类型，摘要如「fix(router): 系统设置不再重定向到子路由，顶层 tab 显示系统设置」。

---

## Task 3: 全量验证

**Files:** 无新增，仅全量校验。

- [ ] **Step 1: 类型检查**

Run: `pnpm typecheck`
Expected: PASS。

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: 无 error / warning。

- [ ] **Step 3: 格式化**

Run: `pnpm fmt`
Expected: 文件按 oxfmt 规则格式化，无未格式化改动残留。

- [ ] **Step 4: 构建验证**

Run: `pnpm build:test`
Expected: 构建成功（无路由 / 类型 / 打包错误）。

- [ ] **Step 5: 手动验证清单**

1. 点击左侧「系统设置」→ 顶部全局 tab 显示「系统设置」（非「录单格式」等子模块名）。
2. 页面内依次点击 7 个子模块 tab → 内容与各自业务页面一致，切换正常。
3. 在某子模块（如「运单号规则」）修改筛选 / 滚动位置后切到另一模块再切回 → 状态被 `keep-alive` 保留。
4. 刷新页面 → 停留在「系统设置」，默认显示「录单格式」。
5. 直接在地址栏访问子路由 URL（如 `/system-manage/setting/print-format`）→ 被重定向回「系统设置」。

---

## 自检

- **Spec 覆盖**：§详细改动-1（index.vue 改造）→ Task 1；§详细改动-2（删重定向）→ Task 2 Step 1；§详细改动-3（子路由防御）→ Task 2 Step 2；§保持不变 → Task 1/2 均不改子组件与路由表；§验证方法 → Task 3。
- **占位扫描**：无 TBD/TODO；所有 step 含实际代码或明确命令。
- **类型一致性**：`componentMap` 的 `Record<string, Component>` 与 `activeComponent: ComputedRef<Component>` 一致；子组件导入路径均在 `./<name>/index.vue`，与现有目录结构吻合。
- **约束符合**：未手改 `src/router/elegant/**`；未新增 i18n key；未使用 `any`；提交走 `pnpm commit`。
