# 资料管理子档案拆分为独立页面/路由 — 设计文档

> ⚠️ **已作废**：用户最终决定子档案**不作为路由/菜单**，改为模块页内左侧子导航切换。实际实现见 `changelog/资料管理子档案左侧子导航.md`。

日期：2026-09-01

## 1. 背景与目标

当前「资料管理」三个模块页（`basic` / `finance` / `business`）各自是一个页面，内部用 `NTabs` 切换 4 个子档案（共 12 个：客户/供应商/商品/商品分类、结算账户/币种/税率/结算方式、仓库/库位/承运商/门店）。每个子档案是一份 `ArchiveConfig`，由通用组件 `MasterDataArchive` 渲染。

用户要求：

1. 把每个子档案拆成**独立文件夹 + 独立页面 + 独立路由**，不再用 Tab 切换。
2. 三个模块页本身改为**落地/重定向页**（进入即跳到该模块第一个子档案）。
3. **新增/编辑/详情/删除界面必须保留**。

## 2. 目标目录结构与路由

elegant-router 按 `views/` 目录自动生成路由（层级用 `_` 分隔），新增 12 个路由：

```
src/views/data-manage/
├── basic/
│   ├── index.vue           → data-manage_basic            (落地页：重定向到 customer)
│   ├── customer/index.vue   → data-manage_basic_customer
│   ├── supplier/index.vue   → data-manage_basic_supplier
│   ├── goods/index.vue      → data-manage_basic_goods
│   └── category/index.vue   → data-manage_basic_category
├── finance/
│   ├── index.vue           → data-manage_finance          (重定向到 account)
│   ├── account/index.vue    → data-manage_finance_account
│   ├── currency/index.vue   → data-manage_finance_currency
│   ├── tax/index.vue        → data-manage_finance_tax
│   └── settlement/index.vue → data-manage_finance_settlement
└── business/
    ├── index.vue           → data-manage_business         (重定向到 warehouse)
    ├── warehouse/index.vue  → data-manage_business_warehouse
    ├── location/index.vue   → data-manage_business_location
    ├── carrier/index.vue    → data-manage_business_carrier
    └── store/index.vue      → data-manage_business_store
```

菜单层级变为三级：`资料管理 → 模块 → 子档案`。

## 3. 模块落地页（选项 2）

`basic/index.vue` / `finance/index.vue` / `business/index.vue` 去掉 `NTabs`，改为：

- `onMounted` 时 `router.replace({ name: '<module>_<firstArchive>' })`，例如 `data-manage_basic_customer`。
- 模板仅保留一个根容器（或直接 `<div class="h-full w-full" />`），无业务内容。
- 菜单点「基础资料」会直接进客户页。

## 4. 子档案页面模板

每个子档案 `index.vue` 仅持有该档案自己的 `ArchiveConfig` 并渲染 `MasterDataArchive`：

```vue
<script setup lang="ts">
import { $t } from '@/locales';
import MasterDataArchive from '@/components/MasterData/master-data-archive.vue';
import type { ArchiveConfig } from '@/components/MasterData/types';
import type { VxeColumnConfig } from '@/components/Table';
import { useArchiveBase } from '@/views/data-manage/shared';

const { statusOptions, baseSearch } = useArchiveBase();

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

`ArchiveConfig` 的三个泛型档案类型来自 `Api.DataManage`（已存在）：
`BasicCustomer` / `BasicSupplier` / `BasicGoods` / `BasicCategory` /
`FinanceAccount` / `FinanceCurrency` / `FinanceTax` / `FinanceSettlement` /
`BusinessWarehouse` / `BusinessLocation` / `BusinessCarrier` / `BusinessStore`。

## 5. 共享逻辑（消除重复）

新建 `src/views/data-manage/shared.ts`，导出 `useArchiveBase()`：

- `statusOptions`：启用/禁用 `CommonType.Option<Api.Common.EnableStatus>[]`（与现有三页完全一致）。
- `baseSearch()`：返回 `[keyword 输入框, status 下拉, actions 按钮槽]` 的 `FormItemConfig[]`。

12 个页面只写各自独有的 `columns` / `formItems` / `createDefault`，不重复这两段。共享 util 位于 `data-manage` 特性目录内，不破坏"各子档案独立文件夹/路由"的隔离目标。

## 6. 新增/编辑界面

`MasterDataArchive` 已内置完整抽屉：新增按钮（组件内 `openDrawer('create')`）、行内编辑/详情/删除、抽屉表单走 `NFormWrap`，提交调 `fetchCreateDataManage` / `fetchUpdateDataManage`（按 `config.archive` 区分实体，互不干扰）。**拆分后每个独立页面复用同一组件，新增/编辑/详情/删除界面原样保留，无需重写。**

## 7. i18n

- 路由键：`I18nRouteKey = Exclude<RouteKey, 'root' | 'not-found'>`，`RouteKey` 由 elegant-router 在生成路由时自动包含新键，**`app.d.ts` 无需手改**。
- 需在 `src/locales/langs/zh-cn.ts` 与 `en-us.ts` 的 `route` 对象各补 12 个字符串值：
  `route.data-manage_basic_customer` … `route.data-manage_business_store`（中文名沿用现有模块文案风格，例如「客户」「供应商」「商品」「商品分类」「结算账户」「币种」「税率」「结算方式」「仓库」「库位」「承运商」「门店」）。
- 页面文案键 `page.dataManage.*` 已存在，直接复用，不改。

## 8. customRoutes

`src/router/routes/index.ts` 的 `customRoutes` 为 12 个叶子路由补 `meta`（`icon` / `order` / `i18nKey`）。建议图标：

| 路由                           | icon                        | order |
| ------------------------------ | --------------------------- | ----- |
| data-manage_basic_customer     | ic:baseline-person          | 1     |
| data-manage_basic_supplier     | ic:baseline-store           | 2     |
| data-manage_basic_goods        | ic:baseline-inventory-2     | 3     |
| data-manage_basic_category     | ic:baseline-category        | 4     |
| data-manage_finance_account    | ic:baseline-account-balance | 1     |
| data-manage_finance_currency   | ic:baseline-paid            | 2     |
| data-manage_finance_tax        | ic:baseline-receipt-long    | 3     |
| data-manage_finance_settlement | ic:baseline-swap-horiz      | 4     |
| data-manage_business_warehouse | ic:baseline-warehouse       | 1     |
| data-manage_business_location  | ic:baseline-place           | 2     |
| data-manage_business_carrier   | ic:baseline-local-shipping  | 3     |
| data-manage_business_store     | ic:baseline-storefront      | 4     |

模块自身路由 meta（已有）保留。

## 9. 实施步骤

1. 新建 `src/views/data-manage/shared.ts`（`useArchiveBase`）。
2. 从现有三个模块页把 12 份 `ArchiveConfig` 各自迁移到对应子档案 `index.vue`；模块页改为重定向落地页。
3. `zh-cn.ts` / `en-us.ts` 的 `route` 对象补 12 个键。
4. `customRoutes` 补 12 个叶子路由 meta。
5. `pnpm gen-route`（或 `pnpm dev`）重新生成 `routes.ts` / `imports.ts` / `elegant-router.d.ts` / `components.d.ts`。
6. `pnpm typecheck && pnpm lint && pnpm build` 验证。

## 10. 风险与注意

- 列配置缓存：原来 `cacheKey: 'data-manage-basic-customer'` 等已按档案维度命名，拆分后各自独立，无冲突；原模块页合并态缓存自然失效，无影响。
- 重定向落地页：模块页无业务内容，菜单点击即跳转，符合选项 2。
- 禁止手改 `src/router/elegant/**` 与 `src/typings/elegant-router.d.ts` / `components.d.ts`，一律由 `gen-route` 生成。
