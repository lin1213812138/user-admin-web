# 国家选择公共组件（useCountrySelect）设计文档

- 日期：2026-09-18
- 作者：CodeBuddy Agent
- 关联需求：封装国家选择的公共组件，下拉选项左对齐显示中文名、右对齐显示二字码（ISO alpha-2），并支持按名称/二字码模糊搜索。

## 背景

当前项目中有至少两处各自重复实现「调用 `/country/query` → 映射成 select 选项」的逻辑：

1. `src/views/data-manage/basic/modules/fba-warehouse/FbaWarehouseOperateDrawer.vue`
   - 维护本地 `countryOptions` / `countryNameMap` / `loadCountryOptions`，选项 `label` 仅用 `nameCn`，`value` 用 `_id`，并额外维护一份 `_id → nameCn` 映射用于提交时回填 `country` 字段。
2. `src/views/customer-manage/customer/modules/customer-detail/address-operate-drawer.vue`
   - 同样本地加载，`label` 取 `name || nameCn || nameEn || code || _id`，`value` 用 `_id`，通过 `watch(countryId)` 反查回填 `model.country`。

两处逻辑高度重复、取值口径不一致，且下拉只显示名称无法满足「同时展示二字码」的诉求（见产品截图标注）。

## 目标

- 收敛重复逻辑为一个公共 Hook，供 FormWrap 的 `select` 配置与裸 `NSelect` 直接使用。
- 下拉项：名称左对齐、二字码右对齐（精致观感）。
- 支持按中文名 / 二字码模糊搜索。
- 国家数据模块级单例缓存，整个会话只请求一次 `/country/query`。

## 交付物

新增一个文件：

`src/hooks/business/use-country-select.ts`

### 公开接口

```ts
export function useCountrySelect() {
  const options: Ref<SelectOption[]>; // 直接喂给 FormWrap select 配置 / 裸 NSelect
  const loading: Ref<boolean>; // 取数进行中状态
  async function load(): Promise<void>; // 首次触发取数，已缓存则直接复用
  function getName(id?: string): string; // 由 _id 反查中文名，用于提交时回填 country 字段
  return { options, loading, load, getName };
}
```

## 取数策略（模块级单例缓存）

模块作用域维护一个 `cachePromise`：

```ts
let cachePromise: Promise<Api.DataManage.BasicCountryRegion[]> | null = null;

function ensureCountries(): Promise<Api.DataManage.BasicCountryRegion[]> {
  if (!cachePromise) {
    cachePromise = fetchGetCountryList({ page: 1, size: 1000 }).then(({ data, error }) =>
      !error && data ? data.list : []
    );
  }
  return cachePromise;
}
```

- 接口统一使用 `data-manage-basic` 的 `fetchGetCountryList`（两大用法原本就是同源 `/country/query` 真实接口，无 DEV mock）。
- 任意页面 / 抽屉调用 `load()` 都复用同一份数据，避免重复请求。

## 选项结构（关键）

每个选项对象：

```ts
{
  label: `${nameCn} (${code2})`,   // 过滤与兜底文本：输入"阿联"或"ae"都能搜到
  value: item._id,
  name: nameCn,                    // 自定义字段，供 renderLabel / getName 使用
  code2: item.code2,               // 自定义字段
  renderLabel: COUNTRY_RENDER_LABEL // naive 原生支持的逐项自定义渲染
}
```

- `COUNTRY_RENDER_LABEL` 返回 `display:flex; justify-content:space-between; width:100%` 的节点：左侧 `name`，右侧 `code2`（灰色 `text-12px text-gray-400`）。
- naive 的 `NSelect` 会用 `renderLabel` 同时渲染下拉项与选中态显示，因此**无需改动 `FormWrap` 源码**。
- 名称取用优先级：`nameCn ?? name ?? nameEn ?? code ?? _id`（与 FBA 现状一致，统一口径）。
- naive 默认过滤为大小写不敏感地比较 `String(option.label)`，因此 `label` 中含 `(AE)` 即可支持输入 `ae` / `阿联` 搜索。

## 改造现有两处

### FbaWarehouseOperateDrawer.vue

- 删除本地 `countryOptions` / `countryNameMap` / `loadCountryOptions` 及 `onMounted(loadCountryOptions)`。
- 改为 `const { options, getName, load } = useCountrySelect();`，`onMounted(load)`。
- `countryId` 表单项 `options` 使用 `options.value`。
- 提交时 `country: getName(formModel.value.countryId ?? '')` 回填（替代原 `countryNameMap` 反查）。

### address-operate-drawer.vue

- 删除本地 `countryOptions` / `loadCountryOptions`，改用 `useCountrySelect` 的 `options` / `load`。注意该抽屉此前直接依赖 `ship-address` 的 `fetchGetCountryList`，统一改为 `data-manage-basic` 同源接口。
- `watch(countryId)` 回填 `model.country` 改为 `getName(id)`，避免存储到带 `(AE)` 的整串文本（原逻辑取 `option.label`）。

## 不在本次范围

- 不改动 `FormWrap` 源码（renderLabel 已满足需求，不引入 `filter-option` 透传）。
- 不新增独立 `<CountrySelect>` Vue 组件（按需求方选择，Hook 已覆盖 FormWrap 与裸 NSelect 两种用法）。
- 英文名称搜索（label 当前含中文名 + 二字码，已覆盖中文与二字码搜索；英文仅作兜底显示，不单独做英文过滤）。

## 验证

- `pnpm typecheck`（必跑）
- `pnpm lint`
- `pnpm build`
- `pnpm dev` 手动打开 FBA 仓库抽屉 / 客户地址抽屉，确认：
  1. 下拉项显示「中文名左对齐、二字码右对齐」；
  2. 输入中文名或二字码（含小写）均可搜索命中；
  3. 选中后选中态同样显示二字码；
  4. 提交后 `country` 字段回填正确的纯中文名（不含 `(AE)`）。
