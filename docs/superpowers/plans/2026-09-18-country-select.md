# 国家选择公共组件（useCountrySelect）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 封装一个 `useCountrySelect` 组合式函数，统一国家下拉的数据获取、选项渲染（名称左对齐 + 二字码右对齐）与缓存，并替换 FBA 仓库、客户地址两处重复的本地实现。

**Architecture:** 新增 `src/hooks/business/use-country-select.ts`，模块作用域维护单例 `cachePromise` 缓存 `/country/query` 结果；每个选项用 naive 的 `renderLabel` 实现左名称右二字码布局，下拉与选中态共用同一渲染，`FormWrap` 无需改动。两处抽屉改为消费该 Hook，并通过 `getName(id)` 回填国家名称。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">`、Naive UI 2.44 `NSelect`（`renderLabel`）、`@sa/axios`（`createFlatRequest`，真实请求解包 `{ data, error }`）、TypeScript 6 strict。

## Global Constraints

- Node.js >= 20.19.0，pnpm >= 10.5.0；monorepo 只能用 pnpm，**禁止 npm / yarn**。
- 本仓库**没有测试框架、没有 test 脚本**；验证手段严格为 `pnpm typecheck`(`vue-tsc --noEmit --skipLibCheck`) + `pnpm lint`(`oxlint --fix && eslint --fix .`) + `pnpm build`(`--mode prod`)。每次改完代码必跑 typecheck。
- 取数统一使用 `data-manage-basic` 的 `fetchGetCountryList({ page: 1, size: 1000 })`（真实接口 `/country/query`，**无 DEV mock**，返回 `{ data, error }` 解包结构）。
- 选项 `value` 统一为 `item._id`（与现有两处一致）；名称优先级 `nameCn ?? name ?? nameEn ?? code ?? _id`。
- `label` 设为 `` `${nameCn} (${code2})` ``（同时承担过滤文本与兜底展示，naive 默认过滤大小写不敏感比较 `option.label`，故输入 `ae` / `阿联` 均可命中）。
- 不改动 `FormWrap` 源码；不新增独立 `<CountrySelect>` Vue 组件；不做英文过滤。
- 不要删除/重构与本次无关的代码；改动遵循现有优雅路由约定（新增 `.ts` Hook 不会被 elegant-router 扫成路由，无需重新 gen-route）。

---

### Task 1: 新增 `useCountrySelect` Hook

**Files:**

- Create: `src/hooks/business/use-country-select.ts`

**Interfaces:**

- 新增导出 `useCountrySelect(): { options: Ref<SelectOption[]>, loading: Ref<boolean>, load: () => Promise<void>, getName: (id?: string) => string }`
- 模块内：`ensureCountries(): Promise<Api.DataManage.BasicCountryRegion[]>`（单例缓存）

- [ ] **Step 1: 创建 Hook 文件，写入模块级缓存与取数逻辑**

```ts
// src/hooks/business/use-country-select.ts
import { h, ref, type Ref } from 'vue';
import type { SelectOption } from 'naive-ui';
import { fetchGetCountryList } from '@/service/api/data-manage-basic';

type CountryItem = Api.DataManage.BasicCountryRegion;

let cachePromise: Promise<CountryItem[]> | null = null;

function ensureCountries(): Promise<CountryItem[]> {
  if (!cachePromise) {
    cachePromise = fetchGetCountryList({ page: 1, size: 1000 }).then(({ data, error }) =>
      !error && data ? data.list : []
    );
  }
  return cachePromise;
}

function buildName(item: CountryItem): string {
  return item.nameCn ?? item.name ?? item.nameEn ?? item.code ?? item._id ?? '';
}

function buildOptions(list: CountryItem[]): SelectOption[] {
  return list.map(item => {
    const name = buildName(item);
    const code2 = item.code2 ?? '';
    return {
      label: code2 ? `${name} (${code2})` : name,
      value: item._id as string,
      name,
      code2,
      renderLabel: () =>
        h('div', { class: 'flex items-center justify-between w-full' }, [
          h('span', { class: 'truncate' }, name),
          code2 ? h('span', { class: 'text-12px text-gray-400 pl-8px' }, code2) : null
        ])
    } as SelectOption;
  });
}

export function useCountrySelect() {
  const options: Ref<SelectOption[]> = ref([]);
  const loading: Ref<boolean> = ref(false);

  async function load(): Promise<void> {
    if (options.value.length) return;
    loading.value = true;
    try {
      const list = await ensureCountries();
      options.value = buildOptions(list);
    } finally {
      loading.value = false;
    }
  }

  function getName(id?: string): string {
    if (!id) return '';
    return options.value.find(opt => opt.value === id)?.name ?? '';
  }

  return { options, loading, load, getName };
}
```

- [ ] **Step 2: typecheck 校验**

Run: `cd d:/LINFLY/CWMS/user-admin-web && pnpm typecheck`
Expected: 0 error（`BasicCountryRegion` 已存在于 `typings/api/data-manage.d.ts`；`fetchGetCountryList` 已在 `service/api/data-manage-basic/index.ts` 导出）

- [ ] **Step 3: 暂存**

```bash
git add src/hooks/business/use-country-select.ts
```

---

### Task 2: 改造 FbaWarehouseOperateDrawer 使用 Hook

**Files:**

- Modify: `src/views/data-manage/basic/modules/fba-warehouse/FbaWarehouseOperateDrawer.vue:1-32`（删本地三件套）、`:43-75`（countryId 项用 `options.value`）、`:100-116`（提交回填 `country`）

**Interfaces:**

- Consumes: `useCountrySelect()` 的 `options` / `load` / `getName`（Task 1）
- Produces: 无（本页为叶子消费方）

- [ ] **Step 1: 替换 import 与删除本地国家逻辑**

删除原第 7 行中与 country 相关的本地状态/函数（保留 `fetchCreateFbaWarehouse` / `fetchUpdateFbaWarehouse`）：

```ts
import { fetchCreateFbaWarehouse, fetchUpdateFbaWarehouse } from '@/service/api/data-manage-basic';
import { useCountrySelect } from '@/hooks/business/use-country-select';
```

删除原第 21-31 行的 `countryOptions` / `countryNameMap` / `loadCountryOptions` / `onMounted(loadCountryOptions)`，改为：

```ts
const { options: countryOptions, load: loadCountryOptions, getName: getCountryName } = useCountrySelect();
onMounted(loadCountryOptions);
```

- [ ] **Step 2: countryId 表单项改用 Hook 的 options**

原 `formItems` 中 countryId 项的 `options: countryOptions.value` 保持不变（变量名沿用，仅来源变化）。无需改该行。

- [ ] **Step 3: 提交时回填 country 名称**

原 `handleDrawerSubmit` 中：

```ts
const payload = { ...formModel.value, country: countryNameMap.value[formModel.value.countryId ?? ''] ?? '' };
```

改为：

```ts
const payload = { ...formModel.value, country: getCountryName(formModel.value.countryId) };
```

- [ ] **Step 4: typecheck + lint**

Run: `cd d:/LINFLY/CWMS/user-admin-web && pnpm typecheck && pnpm lint`
Expected: 0 error

- [ ] **Step 5: 暂存**

```bash
git add src/views/data-manage/basic/modules/fba-warehouse/FbaWarehouseOperateDrawer.vue
```

---

### Task 3: 改造 address-operate-drawer 使用 Hook

**Files:**

- Modify: `src/views/customer-manage/customer/modules/customer-detail/address-operate-drawer.vue:7-10`（import）、`:55-68`（删本地 countryOptions/loadCountryOptions）、`:116-124`（countryId 项 options）、`:95-102`（watch 回填 model.country 改用 getName）

**Interfaces:**

- Consumes: `useCountrySelect()` 的 `options` / `load` / `getName`（Task 1）
- Produces: 无

> 注意：本抽屉此前从 `@/service/api/ship-address` 引入 `fetchGetCountryList`。改造后统一改由 `data-manage-basic` 的 `fetchGetCountryList` 经 Hook 取数，删除 `ship-address` 的 country 相关 import（若 `ship-address` 中 `fetchGetCountryList` 仅此一处使用，可顺带删除该函数；若有其它调用方则保留）。

- [ ] **Step 1: 调整 import，删除本地国家逻辑**

将第 7-10 行中 `fetchGetCountryList` 从 `ship-address` 移除（页面其它 import 保留），新增：

```ts
import { useCountrySelect } from '@/hooks/business/use-country-select';
```

删除原第 55-68 行的 `countryOptions` / `loadCountryOptions` 定义，改为：

```ts
const { options: countryOptions, load: loadCountryOptions, getName: getCountryName } = useCountrySelect();
```

并在抽屉 `onMounted` / `watch(show)` 的加载逻辑中加入 `loadCountryOptions()`（保持现有 `if (countryOptions.value.length) return;` 幂等语义由 Hook 内部 `options.value.length` 判断，外部重复调用安全）。

- [ ] **Step 2: countryId 表单项 options 来源切换**

原 `formItems` 中 countryId 项的 `options: countryOptions.value` 保持不变（变量名沿用）。

- [ ] **Step 3: watch 回填 country 改用 getName**

原 `watch(() => model.countryId, id => { ... model.country = option.label; })` 依赖 `countryOptions.value.find(...).label`（会带 `(AE)`）。改为：

```ts
watch(
  () => model.countryId,
  id => {
    if (!id) return;
    model.country = getCountryName(id);
  }
);
```

- [ ] **Step 4: typecheck + lint**

Run: `cd d:/LINFLY/CWMS/user-admin-web && pnpm typecheck && pnpm lint`
Expected: 0 error；确认 `ship-address/fetchGetCountryList` 若已无调用方可一并删除（先 `search_content` 确认无其它引用）。

- [ ] **Step 5: 暂存**

```bash
git add src/views/customer-manage/customer/modules/customer-detail/address-operate-drawer.vue
```

---

### Task 4: 全量构建验证 + changelog 收尾

**Files:**

- 无新文件；复核 `changelog/封装国家选择公共组件.md` 实施状态

**Interfaces:** 无

- [ ] **Step 1: 全量验证**

Run: `cd d:/LINFLY/CWMS/user-admin-web && pnpm typecheck && pnpm lint && pnpm build`
Expected: 三者均 0 error；`pnpm build` 成功产出 `dist/`。

- [ ] **Step 2: 手动冒烟（提示用户）**

提示用户在 `pnpm dev`（`--mode test`，端口 9527）下手动确认：

1. 通用资料 → FBA 仓库：新增/编辑抽屉「所属国家」下拉项显示「中文名左、二字码右」；输入 `ae` 或 `阿联` 均可搜到；选中态同样显示二字码；保存后 `country` 字段回填纯中文名（不含 `(AE)`）。
2. 客户详情 → 收件/发件地址抽屉：国家下拉同样显示二字码；选中后 `model.country` 回填纯中文名。

- [ ] **Step 3: 更新 changelog 实施态**

将 `changelog/封装国家选择公共组件.md` 的「实施」段落从「计划阶段，待 writing-plans」更新为已完成，并在 AGENTS_CHANGELOG.md 该条目补充「已交付」。

```bash
git add changelog/封装国家选择公共组件.md AGENTS_CHANGELOG.md
```

---

## Self-Review

1. **Spec 覆盖**：Hook 新增 ✅（Task 1）；FBA 改造 ✅（Task 2，覆盖删本地三件套、options 来源、提交 getName 回填）；地址抽屉改造 ✅（Task 3，覆盖删本地加载、统一到 data-manage-basic 同源、watch 改用 getName）；缓存/模块单例 ✅（Task 1 `cachePromise`）；renderLabel 左名称右二字码 ✅（Task 1）。
2. **Placeholder 扫描**：无 TBD/TODO；每步均给出具体代码或命令。
3. **类型一致性**：`useCountrySelect` 返回 `options/loading/load/getName` 在 Task 2/3 中解构名一致（`options: countryOptions, load: loadCountryOptions, getName: getCountryName`）；`value` 为 `string`（`_id` as string），`getName` 接收 `string | undefined` 返回 `string`，与 `formModel.countryId`（string）匹配。
4. **已知风险**：`ship-address/fetchGetCountryList` 删除需先确认无其它引用；`BasicCountryRegion` 字段含 `nameCn/name/nameEn/code/code2/_id`（见 `typings/api/data-manage.d.ts`），Hook 取值安全。
