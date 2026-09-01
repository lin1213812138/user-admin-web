# 资料管理子档案拆分为独立页面/路由 Implementation Plan

> ⚠️ **已作废**：用户最终决定子档案**不作为路由/菜单**，改为模块页内左侧子导航切换。实际实现见 `changelog/资料管理子档案左侧子导航.md`；子档案组件位于 `src/components/MasterData/archives/`，而非独立路由。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把资料管理三个模块页里的 12 个子档案拆成独立文件夹+独立页面+独立路由（三级嵌套），模块页改为重定向落地页，新增/编辑界面复用 MasterDataArchive 抽屉原样保留。

**Architecture:** 每个子档案是一个 `index.vue`，仅持有自己的 `ArchiveConfig<T>` 并渲染通用组件 `<MasterDataArchive :config="config" />`；模块页 `onMounted` 重定向到该模块第一个子档案。跨档案共用的 `statusOptions`/`baseSearch` 抽到 `src/views/data-manage/shared.ts` 的 `useArchiveBase()`。路由由 elegant-router 按目录自动生成，i18n 路由键在 zh-cn/en-us 补字符串（RouteKey 派生，app.d.ts 不手改）。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Naive UI、vxe-table（经 `useVxeTable`）、elegant-router（目录自动生成路由）、vue-i18n、pnpm。

## Global Constraints

- **禁止手改** `src/router/elegant/**`、`src/typings/elegant-router.d.ts`、`src/typings/components.d.ts`；路由类型一律由 `pnpm gen-route`（或 `pnpm dev`/`pnpm build` 触发的 Vite 插件）生成。
- i18n 文案 **zh-cn / en-us 必须同步**；`route.*` 键只需在两份语言包补字符串值（`I18nRouteKey` 由 `RouteKey` 自动派生，`src/typings/app.d.ts` 不手改）。
- 业务代码禁止 `any`；优先用 `@/*` 别名导入；`Api.DataManage.*` 为全局命名空间，勿 import。
- 包管理只用 **pnpm**（禁止 npm/yarn）。
- 本项目**无测试框架**；每个任务完成后的验证手段为 `pnpm typecheck` + `pnpm lint` + `pnpm build`（提交前还需 `pnpm fmt`）。
- 注释用英文 JSDoc；禁止硬编码中文/英文文案（一律走 i18n）。

---

### Task 1: 共享逻辑 `shared.ts`

**Files:**

- Create: `src/views/data-manage/shared.ts`

**Interfaces:**

- Produces: `useArchiveBase(): { statusOptions: ComputedRef<CommonType.Option<Api.Common.EnableStatus>[]>, baseSearch: () => FormItemConfig[] }`，供后续 12 个子档案页面消费。

- [ ] **Step 1: 创建 `shared.ts`**

```ts
import { computed } from 'vue';
import { $t } from '@/locales';
import type { FormItemConfig } from '@/components/Form/index.vue';

/** Shared bits for all master-data archive pages: status options + base search bar */
export function useArchiveBase() {
  const statusOptions = computed<CommonType.Option<Api.Common.EnableStatus>[]>(() => [
    { label: $t('common.enable'), value: '1' },
    { label: $t('common.disable'), value: '2' }
  ]);

  /** Keyword + status + action-slot search bar, shared by every archive */
  function baseSearch(): FormItemConfig[] {
    return [
      {
        key: 'keyword',
        label: $t('common.keyword'),
        type: 'input',
        span: 8,
        placeholder: $t('page.dataManage.common.keywordPlaceholder')
      },
      { key: 'status', label: $t('common.status'), type: 'select', span: 8, options: statusOptions.value },
      { key: 'actions', label: ' ', slot: 'actions', span: 8 }
    ];
  }

  return { statusOptions, baseSearch };
}
```

- [ ] **Step 2: 类型检查本文件**

Run: `pnpm typecheck`
Expected: 无 `shared.ts` 相关报错（`CommonType`/`Api.Common.EnableStatus`/`FormItemConfig` 均为既有全局类型）。

---

### Task 2: 基础资料模块（basic）—— 4 个子档案页 + 落地页

**Files:**

- Create: `src/views/data-manage/basic/customer/index.vue`
- Create: `src/views/data-manage/basic/supplier/index.vue`
- Create: `src/views/data-manage/basic/goods/index.vue`
- Create: `src/views/data-manage/basic/category/index.vue`
- Modify: `src/views/data-manage/basic/index.vue`（改为重定向落地页）

**Interfaces:**

- Consumes: `useArchiveBase()` from `@/views/data-manage/shared`；`MasterDataArchive` from `@/components/MasterData/master-data-archive.vue`；类型 `ArchiveConfig` / `MasterDataRow` / `VxeColumnConfig`；`Api.DataManage.BasicCustomer|BasicSupplier|BasicGoods|BasicCategory`（全局命名空间）。
- Produces: 4 个可独立路由的档案页；`basic/index.vue` 重定向到 `data-manage_basic_customer`。

- [ ] **Step 1: 写 `basic/customer/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.BasicCustomer> = {
  archive: 'customer',
  cacheKey: 'data-manage-basic-customer',
  titleI18nKey: 'page.dataManage.basic.customer.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      { key: 'code', title: $t('page.dataManage.basic.customer.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.dataManage.basic.customer.name'), visible: true, sortable: false },
      { key: 'contact', title: $t('page.dataManage.basic.customer.contact'), visible: true, sortable: false },
      { key: 'phone', title: $t('page.dataManage.basic.customer.phone'), visible: true, sortable: false },
      {
        key: 'address',
        title: $t('page.dataManage.basic.customer.address'),
        visible: true,
        minWidth: 200,
        sortable: false
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.basic.customer.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.customer.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.basic.customer.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.customer.form.namePlaceholder')
    },
    { key: 'contact', label: $t('page.dataManage.basic.customer.contact'), type: 'input', span: 12 },
    { key: 'phone', label: $t('page.dataManage.basic.customer.phone'), type: 'input', span: 12 },
    { key: 'address', label: $t('page.dataManage.basic.customer.address'), type: 'input', span: 24 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', contact: '', phone: '', address: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 2: 写 `basic/supplier/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.BasicSupplier> = {
  archive: 'supplier',
  cacheKey: 'data-manage-basic-supplier',
  titleI18nKey: 'page.dataManage.basic.supplier.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      { key: 'code', title: $t('page.dataManage.basic.supplier.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.dataManage.basic.supplier.name'), visible: true, sortable: false },
      { key: 'contact', title: $t('page.dataManage.basic.supplier.contact'), visible: true, sortable: false },
      { key: 'phone', title: $t('page.dataManage.basic.supplier.phone'), visible: true, sortable: false },
      {
        key: 'level',
        title: $t('page.dataManage.basic.supplier.level'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.basic.supplier.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.supplier.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.basic.supplier.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.supplier.form.namePlaceholder')
    },
    { key: 'contact', label: $t('page.dataManage.basic.supplier.contact'), type: 'input', span: 12 },
    { key: 'phone', label: $t('page.dataManage.basic.supplier.phone'), type: 'input', span: 12 },
    { key: 'level', label: $t('page.dataManage.basic.supplier.level'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', contact: '', phone: '', level: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 3: 写 `basic/goods/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.BasicGoods> = {
  archive: 'goods',
  cacheKey: 'data-manage-basic-goods',
  titleI18nKey: 'page.dataManage.basic.goods.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      { key: 'code', title: $t('page.dataManage.basic.goods.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.dataManage.basic.goods.name'), visible: true, sortable: false },
      { key: 'spec', title: $t('page.dataManage.basic.goods.spec'), visible: true, sortable: false },
      {
        key: 'unit',
        title: $t('page.dataManage.basic.goods.unit'),
        visible: true,
        width: 80,
        align: 'center',
        sortable: false
      },
      { key: 'categoryName', title: $t('page.dataManage.basic.goods.categoryName'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.basic.goods.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.goods.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.basic.goods.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.goods.form.namePlaceholder')
    },
    { key: 'spec', label: $t('page.dataManage.basic.goods.spec'), type: 'input', span: 12 },
    { key: 'unit', label: $t('page.dataManage.basic.goods.unit'), type: 'input', span: 12 },
    { key: 'categoryName', label: $t('page.dataManage.basic.goods.categoryName'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', spec: '', unit: '', categoryName: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 4: 写 `basic/category/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.BasicCategory> = {
  archive: 'category',
  cacheKey: 'data-manage-basic-category',
  titleI18nKey: 'page.dataManage.basic.category.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      { key: 'code', title: $t('page.dataManage.basic.category.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.dataManage.basic.category.name'), visible: true, sortable: false },
      {
        key: 'sort',
        title: $t('page.dataManage.basic.category.sort'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: true
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.basic.category.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.category.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.basic.category.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.basic.category.form.namePlaceholder')
    },
    { key: 'sort', label: $t('page.dataManage.basic.category.sort'), type: 'number', required: true, span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', sort: 0, status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 5: 改写 `basic/index.vue` 为重定向落地页**

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  router.replace({ name: 'data-manage_basic_customer' });
});
</script>

<template>
  <div class="h-full w-full" />
</template>
```

- [ ] **Step 6: 类型检查**

Run: `pnpm typecheck`
Expected: 无 basic 模块相关报错（`Api.DataManage.Basic*` 类型已存在；`data-manage_basic_customer` 路由名此时尚未生成，仅为 `router.replace` 的 `name` 字符串，不影响 typecheck——若 TS 报未知路由名，待 Task 7 gen-route 后消除）。

---

### Task 3: 财务资料模块（finance）—— 4 个子档案页 + 落地页

**Files:**

- Create: `src/views/data-manage/finance/account/index.vue`
- Create: `src/views/data-manage/finance/currency/index.vue`
- Create: `src/views/data-manage/finance/tax/index.vue`
- Create: `src/views/data-manage/finance/settlement/index.vue`
- Modify: `src/views/data-manage/finance/index.vue`（重定向落地页，跳 `data-manage_finance_account`）

**Interfaces:**

- Consumes: 同 Task 2（`useArchiveBase`、`MasterDataArchive`、类型）；`Api.DataManage.FinanceAccount|FinanceCurrency|FinanceTax|FinanceSettlement`。
- Produces: 4 个财务档案独立页；`finance/index.vue` 重定向到 `data-manage_finance_account`。

- [ ] **Step 1: 写 `finance/account/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.FinanceAccount> = {
  archive: 'account',
  cacheKey: 'data-manage-finance-account',
  titleI18nKey: 'page.dataManage.finance.account.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.finance.account.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.finance.account.name'), visible: true, sortable: false },
      { key: 'accountType', title: $t('page.dataManage.finance.account.accountType'), visible: true, sortable: false },
      { key: 'bank', title: $t('page.dataManage.finance.account.bank'), visible: true, sortable: false },
      {
        key: 'balance',
        title: $t('page.dataManage.finance.account.balance'),
        visible: true,
        width: 120,
        align: 'right',
        sortable: true
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.finance.account.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.account.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.finance.account.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.account.form.namePlaceholder')
    },
    { key: 'accountType', label: $t('page.dataManage.finance.account.accountType'), type: 'input', span: 12 },
    { key: 'bank', label: $t('page.dataManage.finance.account.bank'), type: 'input', span: 12 },
    { key: 'balance', label: $t('page.dataManage.finance.account.balance'), type: 'number', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', accountType: '', bank: '', balance: 0, status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 2: 写 `finance/currency/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.FinanceCurrency> = {
  archive: 'currency',
  cacheKey: 'data-manage-finance-currency',
  titleI18nKey: 'page.dataManage.finance.currency.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.finance.currency.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.finance.currency.name'), visible: true, sortable: false },
      {
        key: 'rate',
        title: $t('page.dataManage.finance.currency.rate'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: true
      },
      {
        key: 'symbol',
        title: $t('page.dataManage.finance.currency.symbol'),
        visible: true,
        width: 80,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.finance.currency.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.currency.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.finance.currency.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.currency.form.namePlaceholder')
    },
    { key: 'rate', label: $t('page.dataManage.finance.currency.rate'), type: 'number', span: 12 },
    { key: 'symbol', label: $t('page.dataManage.finance.currency.symbol'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', rate: 1, symbol: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 3: 写 `finance/tax/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.FinanceTax> = {
  archive: 'tax',
  cacheKey: 'data-manage-finance-tax',
  titleI18nKey: 'page.dataManage.finance.tax.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      { key: 'name', title: $t('page.dataManage.finance.tax.name'), type: 'detail', visible: true, sortable: false },
      {
        key: 'rate',
        title: $t('page.dataManage.finance.tax.rate'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: true
      },
      { key: 'taxType', title: $t('page.dataManage.finance.tax.taxType'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'name',
      label: $t('page.dataManage.finance.tax.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.tax.form.namePlaceholder')
    },
    { key: 'rate', label: $t('page.dataManage.finance.tax.rate'), type: 'number', required: true, span: 12 },
    { key: 'taxType', label: $t('page.dataManage.finance.tax.taxType'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ name: '', rate: 0.13, taxType: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 4: 写 `finance/settlement/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.FinanceSettlement> = {
  archive: 'settlement',
  cacheKey: 'data-manage-finance-settlement',
  titleI18nKey: 'page.dataManage.finance.settlement.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.dataManage.finance.settlement.name'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'period', title: $t('page.dataManage.finance.settlement.period'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'name',
      label: $t('page.dataManage.finance.settlement.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.finance.settlement.form.namePlaceholder')
    },
    { key: 'period', label: $t('page.dataManage.finance.settlement.period'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ name: '', period: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 5: 改写 `finance/index.vue` 为重定向落地页**

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  router.replace({ name: 'data-manage_finance_account' });
});
</script>

<template>
  <div class="h-full w-full" />
</template>
```

- [ ] **Step 6: 类型检查**

Run: `pnpm typecheck`
Expected: 无 finance 模块相关报错。

---

### Task 4: 业务资料模块（business）—— 4 个子档案页 + 落地页

**Files:**

- Create: `src/views/data-manage/business/warehouse/index.vue`
- Create: `src/views/data-manage/business/location/index.vue`
- Create: `src/views/data-manage/business/carrier/index.vue`
- Create: `src/views/data-manage/business/store/index.vue`
- Modify: `src/views/data-manage/business/index.vue`（重定向落地页，跳 `data-manage_business_warehouse`）

**Interfaces:**

- Consumes: 同 Task 2/3；`Api.DataManage.BusinessWarehouse|BusinessLocation|BusinessCarrier|BusinessStore`。
- Produces: 4 个业务档案独立页；`business/index.vue` 重定向到 `data-manage_business_warehouse`。

- [ ] **Step 1: 写 `business/warehouse/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.BusinessWarehouse> = {
  archive: 'warehouse',
  cacheKey: 'data-manage-business-warehouse',
  titleI18nKey: 'page.dataManage.business.warehouse.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.business.warehouse.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.business.warehouse.name'), visible: true, sortable: false },
      { key: 'address', title: $t('page.dataManage.business.warehouse.address'), visible: true, sortable: false },
      { key: 'manager', title: $t('page.dataManage.business.warehouse.manager'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.business.warehouse.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.warehouse.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.business.warehouse.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.warehouse.form.namePlaceholder')
    },
    { key: 'address', label: $t('page.dataManage.business.warehouse.address'), type: 'input', span: 24 },
    { key: 'manager', label: $t('page.dataManage.business.warehouse.manager'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', address: '', manager: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 2: 写 `business/location/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.BusinessLocation> = {
  archive: 'location',
  cacheKey: 'data-manage-business-location',
  titleI18nKey: 'page.dataManage.business.location.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.business.location.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.business.location.name'), visible: true, sortable: false },
      {
        key: 'warehouseName',
        title: $t('page.dataManage.business.location.warehouseName'),
        visible: true,
        sortable: false
      },
      {
        key: 'capacity',
        title: $t('page.dataManage.business.location.capacity'),
        visible: true,
        width: 120,
        align: 'right',
        sortable: true
      }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.business.location.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.location.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.business.location.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.location.form.namePlaceholder')
    },
    { key: 'warehouseName', label: $t('page.dataManage.business.location.warehouseName'), type: 'input', span: 12 },
    { key: 'capacity', label: $t('page.dataManage.business.location.capacity'), type: 'number', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', warehouseName: '', capacity: 0, status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 3: 写 `business/carrier/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.BusinessCarrier> = {
  archive: 'carrier',
  cacheKey: 'data-manage-business-carrier',
  titleI18nKey: 'page.dataManage.business.carrier.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.business.carrier.code'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.business.carrier.name'), visible: true, sortable: false },
      { key: 'contact', title: $t('page.dataManage.business.carrier.contact'), visible: true, sortable: false },
      { key: 'phone', title: $t('page.dataManage.business.carrier.phone'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.business.carrier.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.carrier.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.business.carrier.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.carrier.form.namePlaceholder')
    },
    { key: 'contact', label: $t('page.dataManage.business.carrier.contact'), type: 'input', span: 12 },
    { key: 'phone', label: $t('page.dataManage.business.carrier.phone'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', contact: '', phone: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 4: 写 `business/store/index.vue`**

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { baseSearch } = useArchiveBase();

const config: ArchiveConfig<Api.DataManage.BusinessStore> = {
  archive: 'store',
  cacheKey: 'data-manage-business-store',
  titleI18nKey: 'page.dataManage.business.store.title',
  searchItems: baseSearch(),
  columns: () =>
    [
      { key: 'code', title: $t('page.dataManage.business.store.code'), type: 'detail', visible: true, sortable: false },
      { key: 'name', title: $t('page.dataManage.business.store.name'), visible: true, sortable: false },
      { key: 'address', title: $t('page.dataManage.business.store.address'), visible: true, sortable: false },
      { key: 'owner', title: $t('page.dataManage.business.store.owner'), visible: true, sortable: false }
    ] as VxeColumnConfig[],
  formItems: [
    {
      key: 'code',
      label: $t('page.dataManage.business.store.code'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.store.form.codePlaceholder')
    },
    {
      key: 'name',
      label: $t('page.dataManage.business.store.name'),
      type: 'input',
      required: true,
      span: 12,
      placeholder: $t('page.dataManage.business.store.form.namePlaceholder')
    },
    { key: 'address', label: $t('page.dataManage.business.store.address'), type: 'input', span: 24 },
    { key: 'owner', label: $t('page.dataManage.business.store.owner'), type: 'input', span: 12 },
    { key: 'remark', label: $t('common.remark'), type: 'textarea', span: 24 }
  ],
  createDefault: () => ({ code: '', name: '', address: '', owner: '', status: '1', remark: '' })
};
</script>

<template>
  <MasterDataArchive :config="config" />
</template>
```

- [ ] **Step 5: 改写 `business/index.vue` 为重定向落地页**

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  router.replace({ name: 'data-manage_business_warehouse' });
});
</script>

<template>
  <div class="h-full w-full" />
</template>
```

- [ ] **Step 6: 类型检查**

Run: `pnpm typecheck`
Expected: 无 business 模块相关报错。

---

### Task 5: i18n 路由键（zh-cn / en-us）

**Files:**

- Modify: `src/locales/langs/zh-cn.ts`（在 `route:` 对象内，紧邻 `'data-manage_business': '业务资料'` 之后追加）
- Modify: `src/locales/langs/en-us.ts`（同样位置追加英文）

**Interfaces:**

- Produces: 12 个 `route.data-manage_{basic,finance,business}_{archive}` 字符串键，供 `customRoutes` 的 `i18nKey` 与菜单渲染使用。

- [ ] **Step 1: 在 `zh-cn.ts` 的 `route` 对象追加 12 个键**

```ts
    'data-manage_basic_customer': '客户',
    'data-manage_basic_supplier': '供应商',
    'data-manage_basic_goods': '商品',
    'data-manage_basic_category': '商品分类',
    'data-manage_finance_account': '结算账户',
    'data-manage_finance_currency': '币种',
    'data-manage_finance_tax': '税率',
    'data-manage_finance_settlement': '结算方式',
    'data-manage_business_warehouse': '仓库',
    'data-manage_business_location': '库位',
    'data-manage_business_carrier': '承运商',
    'data-manage_business_store': '门店'
```

- [ ] **Step 2: 在 `en-us.ts` 的 `route` 对象追加对应英文键**

```ts
    'data-manage_basic_customer': 'Customer',
    'data-manage_basic_supplier': 'Supplier',
    'data-manage_basic_goods': 'Goods',
    'data-manage_basic_category': 'Goods Category',
    'data-manage_finance_account': 'Settlement Account',
    'data-manage_finance_currency': 'Currency',
    'data-manage_finance_tax': 'Tax Rate',
    'data-manage_finance_settlement': 'Settlement Method',
    'data-manage_business_warehouse': 'Warehouse',
    'data-manage_business_location': 'Location',
    'data-manage_business_carrier': 'Carrier',
    'data-manage_business_store': 'Store'
```

- [ ] **Step 3: 类型检查**

Run: `pnpm typecheck`
Expected: `I18nKey` 相关的 `route.data-manage_*_*` 键不再报错（键已落在 `Record<I18nRouteKey, string>` 要求的字符串集合内）。

---

### Task 6: customRoutes 补 12 个叶子路由 meta

**Files:**

- Modify: `src/router/routes/index.ts`（`customRoutes` 数组，在 `data-manage_business` 条目之后追加 12 条）

**Interfaces:**

- Consumes: 12 个 `route.data-manage_*` 键（Task 5 已定义）；路由名须与 elegant-router 生成的 `data-manage_{basic,finance,business}_{archive}` 完全一致。
- Produces: 菜单渲染所需 icon / order / i18nKey（title 留空，由 i18nKey 驱动）。

- [ ] **Step 1: 在 `customRoutes` 追加 12 个叶子路由**

```ts
  { name: 'data-manage_basic_customer', meta: { title: '', i18nKey: 'route.data-manage_basic_customer', icon: 'ic:baseline-person' } },
  { name: 'data-manage_basic_supplier', meta: { title: '', i18nKey: 'route.data-manage_basic_supplier', icon: 'ic:baseline-store' } },
  { name: 'data-manage_basic_goods', meta: { title: '', i18nKey: 'route.data-manage_basic_goods', icon: 'ic:baseline-inventory-2' } },
  { name: 'data-manage_basic_category', meta: { title: '', i18nKey: 'route.data-manage_basic_category', icon: 'ic:baseline-category' } },
  { name: 'data-manage_finance_account', meta: { title: '', i18nKey: 'route.data-manage_finance_account', icon: 'ic:baseline-account-balance' } },
  { name: 'data-manage_finance_currency', meta: { title: '', i18nKey: 'route.data-manage_finance_currency', icon: 'ic:baseline-paid' } },
  { name: 'data-manage_finance_tax', meta: { title: '', i18nKey: 'route.data-manage_finance_tax', icon: 'ic:baseline-receipt-long' } },
  { name: 'data-manage_finance_settlement', meta: { title: '', i18nKey: 'route.data-manage_finance_settlement', icon: 'ic:baseline-swap-horiz' } },
  { name: 'data-manage_business_warehouse', meta: { title: '', i18nKey: 'route.data-manage_business_warehouse', icon: 'ic:baseline-warehouse' } },
  { name: 'data-manage_business_location', meta: { title: '', i18nKey: 'route.data-manage_business_location', icon: 'ic:baseline-place' } },
  { name: 'data-manage_business_carrier', meta: { title: '', i18nKey: 'route.data-manage_business_carrier', icon: 'ic:baseline-local-shipping' } },
  { name: 'data-manage_business_store', meta: { title: '', i18nKey: 'route.data-manage_business_store', icon: 'ic:baseline-storefront' } }
```

（模块路由 `data-manage` / `data-manage_basic` / `data-manage_finance` / `data-manage_business` 的 meta 已存在，保留不动。）

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck`
Expected: `customRoutes` 的 `name` 字段若报"不是 RouteKey"——属预期，待 Task 7 gen-route 生成新路由名后消除；其余无报错。

---

### Task 7: 生成路由 + 全量验证

**Files:**

- 生成（勿手改）：`src/router/elegant/routes.ts`、`src/router/elegant/imports.ts`、`src/typings/elegant-router.d.ts`、`src/typings/components.d.ts`

**Interfaces:**

- Consumes: Task 1–6 的全部产物（12 页面 + 3 落地页 + shared.ts + i18n + customRoutes）。
- Produces: 重新生成的路由类型，使 `RouteKey` 包含 12 个新路由名，`customRoutes` 与 `router.replace({ name })` 的 TS 报错消除。

- [ ] **Step 1: 重新生成路由类型**

Run: `pnpm gen-route`
Expected: 命令成功，`src/router/elegant/routes.ts` 内出现 `data-manage_basic_customer` 等 12 个 children；`src/typings/elegant-router.d.ts` 的 `RouteKey` 联合类型包含这些名字。

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck`
Expected: 0 error（含 `customRoutes` 的 `name` 与页面 `router.replace` 的路由名均已解析）。

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: 0 error（oxlint + eslint `--fix` 自动修复格式）。

- [ ] **Step 4: 格式化**

Run: `pnpm fmt`
Expected: 文件格式化完成（pre-commit 的 `git diff --exit-code` 依赖它）。

- [ ] **Step 5: 生产构建验证**

Run: `pnpm build`
Expected: 构建成功，产物包含 12 个新路由页面。

---

## Self-Review Notes

- **Spec coverage:** §2 目录结构 → Task 2/3/4 创建 12 页 + 3 落地页；§3 落地页重定向 → 各模块 `index.vue` Step 5；§4 子档案页模板 → 各页 Step 1–4；§5 共享逻辑 → Task 1；§6 新增/编辑 → 复用 `MasterDataArchive`（不新建任务，天然保留）；§7 i18n → Task 5；§8 customRoutes → Task 6；§9 实施步骤 → Task 1–7 顺序一致。
- **Placeholder scan:** 所有代码块均为完整实现，无 TBD/TODO/"similar to Task N"。
- **Type consistency:** `useArchiveBase()` 返回 `{ statusOptions, baseSearch }`，各页仅用 `baseSearch()`（status 列由 `MasterDataArchive` 自动追加，页面无需 `statusOptions`）；路由名 `data-manage_{basic,finance,business}_{archive}` 在 Task 2/3/4（redirect）、Task 5（i18n）、Task 6（customRoutes）、Task 7（生成）四处完全一致。
- **风险:** `router.replace({ name })` 与 `customRoutes.name` 在 gen-route 前会报 TS 未知路由名，属预期；Task 7 执行后即消除。
