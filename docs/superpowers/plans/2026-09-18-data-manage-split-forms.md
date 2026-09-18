# 资料管理各模块「列表与表单」拆文件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将资料管理下 16 个自包含 tab 页的新增/编辑表单拆成独立 `<Tab>Form.vue`，列表页只保留列表与删除，消除「列表 + 表单写在同一文件」的形态（对齐 2026-09-10 确立原则）。

**Architecture:** 每个 tab 目录保持 flat 双文件（`<Tab>.vue` 列表 + `<Tab>Form.vue` 表单）；表单组件内部自带 `<Drawer>` 外壳，通过 `v-model:show` / `:mode` / `:row` 与列表通信，提交成功 `emit('submitted')` 触发列表刷新；表单依赖的下拉在 `onMounted` 自取。business/finance 走公共 `MasterDataArchive`，不动。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">` + TypeScript strict + Naive UI + 内部组件 `Table`/`useVxeTable`/`Drawer`/`FormWrap` + `service/api/data-manage-*`（flat request）。

## Global Constraints

- 表单文件命名 `<Tab>Form.vue`，**禁止 `index.vue`**（elegant-router 扫描 `src/views` 下 `**/index.vue` 与 `**/[*].vue` 会生成路由；`<Tab>Form.vue` 不匹配，安全）。
- 不新增路由/菜单/权限标识；不改 `build/plugins/router.ts`；不触发路由重生成。
- 类型复用 `typings/api/data-manage-{basic,ship,bl,no-rule}.d.ts` 与 `data-manage/components/types.ts`，**不为每个表单硬造 `.model.ts`**（仅当表单确属私有类型才就地定义，YAGNI）。
- 表单字段文案复用现有 i18n key，不新增 key；中文注释、库 API 与变量名英文。
- 本仓库**无测试框架**，验证手段为 `pnpm typecheck` + `pnpm lint` + `pnpm fmt` + 最终 `pnpm build`（每批绿灯后再下一批）。
- 提交用 `pnpm commit`（conventional commits，触发 `sa git-commit-verify` 钩子），**不要裸 `git commit`**。

---

## File Structure

**Create（16 个表单文件）：**

| 分组         | 新建 `<Tab>Form.vue`                                                                                                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| basic（2）   | `basic/modules/country-region/CountryRegionForm.vue`、`basic/modules/fba-warehouse/FbaWarehouseForm.vue`                                                                                                                                       |
| no-rule（4） | `no-rule/modules/no-rule/NoRuleForm.vue`、`no-rule/modules/no-pool/NoPoolForm.vue`、`no-rule/modules/long-no-rule/LongNoRuleForm.vue`、`no-rule/modules/item-no-rule/ItemNoRuleForm.vue`                                                       |
| ship（4）    | `ship/modules/provider/ProviderForm.vue`、`ship/modules/channel-group/ChannelGroupForm.vue`、`ship/modules/weight-rule/WeightRuleForm.vue`、`ship/modules/carrier/CarrierForm.vue`                                                             |
| bl（6）      | `bl/modules/bl-route/BlRouteForm.vue`、`bl/modules/bl-port/BlPortForm.vue`、`bl/modules/bl-trip/BlTripForm.vue`、`bl/modules/bl-address/BlAddressForm.vue`、`bl/modules/bl-unit/BlUnitForm.vue`、`bl/modules/track-config/TrackConfigForm.vue` |

**Modify（16 个列表文件）：** 上表对应目录下的 `<Tab>.vue`，删除内联抽屉/表单逻辑，改为挂载 `<XxxForm>`。

**不改动：** `business/**`（8 个 tab）、`finance/**`（4 个 tab）、公共 `MasterDataArchive.vue`、`build/plugins/router.ts`、任何接口/typings/i18n。

---

## Task 0: 通用改造模式（所有后续 Task 复用）

本任务确立两个可复用的代码骨架。后续每个 Task 只需套用骨架，并写入该文件特有的 `formItems` / 下拉 / 字段映射。

### 0.1 列表页 `<Tab>.vue` 改造后形态（保留 + 新增）

保留：搜索栏（如有）、`<Table>`、`useVxeTable` 解构（`data/loading/columnConfigs/columns/pagination/getData/persistColumns/resetColumns`）、`handleSearch/handleReset/handlePageChange`、单行删除 `confirmDelete`、批量删除 `confirmBatchDelete`。

删除：`drawerVisible/drawerMode/submitting/formModel/formRef`、`emptyForm()`、`formItems` computed、`openCreate/openEdit`、`handleDrawerSubmit`、`<Drawer>` 与 `<NFormWrap>` 模板块。

新增状态与挂载：

```ts
const formShow = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRow = ref<Api.DataManage.Xxx>();
function openCreate() {
  formMode.value = 'create';
  formRow.value = undefined;
  formShow.value = true;
}
function openEdit(row: Api.DataManage.Xxx) {
  formMode.value = 'edit';
  formRow.value = row;
  formShow.value = true;
}
```

模板（替换原 `<Drawer>...</Drawer>` 块）：

```vue
<XxxForm v-model:show="formShow" :mode="formMode" :row="formRow" @submitted="getData" />
```

「新增」按钮 `@click="openCreate"`；「编辑」按钮 `@click="openEdit(row)"`。

### 0.2 表单文件 `<Tab>Form.vue` 标准骨架

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateX, fetchUpdateX, type XQueryResult } from '@/service/api/data-manage-*';

type Row = Api.DataManage.Xxx;

const props = defineProps<{
  show: boolean;
  mode: 'create' | 'edit';
  row?: Row;
}>();
const emit = defineEmits<{
  'update:show': [boolean];
  submitted: [];
}>();

const submitting = ref(false);
const formModel = ref<Partial<Row>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<Row> {
  return { /* 该文件字段，见原 <Tab>.vue 的 emptyForm() */ };
}

const drawerTitle = computed(() =>
  props.mode === 'create'
    ? `${$t('common.add')}${...title}`
    : `${$t('common.edit')}${...title}`
);

const formItems = computed<FormItemConfig[]>(() => [
  /* 该文件字段配置，见原 <Tab>.vue 的 formItems computed，原样迁入 */
]);

// 下拉自取（仅该文件需要的，见各 Task 特有差异；无则省略）
// onMounted(async () => { const { data, error } = await fetchXxxOptions(...); ... });

watch(
  () => props.show,
  val => {
    if (!val) return;
    if (props.mode === 'edit' && props.row) {
      formModel.value = { ...props.row }; // 按字段映射回填（见各 Task）
    } else {
      formModel.value = emptyForm();
    }
    formRef.value?.restoreValidation();
  },
  { immediate: true }
);

async function handleSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;
  submitting.value = true;
  try {
    const { error } =
      props.mode === 'create'
        ? await fetchCreateX(formModel.value)
        : await fetchUpdateX(formModel.value);
    if (error) return;
    emit('update:show', false);
    emit('submitted');
    window.$message?.success($t(props.mode === 'create' ? 'common.createSuccess' : 'common.saveSuccess'));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer
    :show="show"
    :title="drawerTitle"
    :loading="submitting"
    :confirm-text="$t('common.save')"
    @update:show="v => emit('update:show', v)"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
  </Drawer>
</template>
```

**接口契约（全局一致）：** `XxxForm` Props `{ show, mode, row? }`、Emits `{ update:show, submitted }`；列表通过 `v-model:show` + `:mode` + `:row` + `@submitted="getData"` 接入。

---

## Task 1: country-region 拆表单

**Files:**

- Create: `src/views/data-manage/basic/modules/country-region/CountryRegionForm.vue`
- Modify: `src/views/data-manage/basic/modules/country-region/CountryRegion.vue`

**特有差异：** 无下拉（字段全为 input）；`formItems` 见原 `CountryRegion.vue` 第 148-169 行（code/nameCn/nameEn/name/code2/code3，code+nameCn required、span 12）；`emptyForm` 见第 138-140 行；提交 `fetchCreateCountry`/`fetchUpdateCountry`。

- [ ] **Step 1:** 创建 `CountryRegionForm.vue`，套用 Task 0.2 骨架：`formItems`/`emptyForm` 从原文件迁入；`watch(show)` 回填（`props.mode==='edit'` 时 `formModel = { _id, code, nameCn, nameEn, name, code2, code3 }`）；`handleSubmit` 调 `fetchCreateCountry`/`fetchUpdateCountry`。
- [ ] **Step 2:** 改造 `CountryRegion.vue` 套用 Task 0.1：删抽屉/表单逻辑，新增 `formShow/formMode/formRow` + `openCreate/openEdit`，模板挂 `<CountryRegionForm v-model:show="formShow" :mode="formMode" :row="formRow" @submitted="getData" />`。
- [ ] **Step 3:** 验证 `pnpm typecheck` / `pnpm lint` / `pnpm fmt`（仅本文件改动）。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分通用资料-国家地区表单）。

## Task 2: fba-warehouse 拆表单（含国家下拉父→子迁移）

**Files:**

- Create: `src/views/data-manage/basic/modules/fba-warehouse/FbaWarehouseForm.vue`
- Modify: `src/views/data-manage/basic/modules/fba-warehouse/FbaWarehouse.vue`

**特有差异：** 表单需自取「所属国家」下拉；原父页 `loadCountryOptions`/`countryOptions`/`countryNameMap`/`onMounted` 整体迁到 `FbaWarehouseForm`。提交时 `country` 名称由选中 `countryId` 反查（原 `handleDrawerSubmit` 第 245 行逻辑搬入 Form）。

- [ ] **Step 1:** 创建 `FbaWarehouseForm.vue`：套 Task 0.2；`onMounted` 调 `fetchGetCountryList({page:1,size:1000})` 填充 `countryOptions`（label=nameCn, value=\_id）与 `countryNameMap`；`formItems` 见原文件第 182-214 行（countryId 为 select + options:countryOptions）；`watch(show)` 回填带 `countryId`；`handleSubmit` 提交 `payload = { ...formModel, country: countryNameMap[formModel.countryId??''] ?? '' }` 调 `fetchCreateFbaWarehouse`/`fetchUpdateFbaWarehouse`。
- [ ] **Step 2:** 改造 `FbaWarehouse.vue` 套 Task 0.1：**删除** `loadCountryOptions`/`countryOptions`/`countryNameMap`/`onMounted(loadCountryOptions)` 及 `formItems`/`emptyForm`/`open*`/`handleDrawerSubmit`；挂 `<FbaWarehouseForm v-model:show :mode :row @submitted="getData" />`，保留搜索/Table/删除。
- [ ] **Step 3:** 验证 `pnpm typecheck` / `pnpm lint` / `pnpm fmt`（重点核对 `country` 反查与回填）。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分通用资料-FBA仓库表单并迁移国家下拉）。

## Task 3: no-rule 拆表单

**Files:**

- Create: `src/views/data-manage/no-rule/modules/no-rule/NoRuleForm.vue`
- Modify: `src/views/data-manage/no-rule/modules/no-rule/NoRule.vue`

**特有差异：** 无下拉（字段见原 `NoRule.vue` formItems）；提交 `fetchCreateNoRule`/`fetchUpdateNoRule`（以实际 service 命名为准）。

- [ ] **Step 1:** 创建 `NoRuleForm.vue`，套 Task 0.2，迁入 `formItems`/`emptyForm`/回填/`handleSubmit`。
- [ ] **Step 2:** 改造 `NoRule.vue` 套 Task 0.1，挂 `<NoRuleForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分单号资料-单号规则表单）。

## Task 4: no-pool 拆表单

**Files:**

- Create: `src/views/data-manage/no-rule/modules/no-pool/NoPoolForm.vue`
- Modify: `src/views/data-manage/no-rule/modules/no-pool/NoPool.vue`

- [ ] **Step 1:** 创建 `NoPoolForm.vue`，套 Task 0.2，迁入 `formItems`/回填/提交（`fetchCreateNoPool`/`fetchUpdateNoPool`）。
- [ ] **Step 2:** 改造 `NoPool.vue` 套 Task 0.1，挂 `<NoPoolForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分单号资料-运单号码池表单）。

## Task 5: long-no-rule 拆表单

**Files:**

- Create: `src/views/data-manage/no-rule/modules/long-no-rule/LongNoRuleForm.vue`
- Modify: `src/views/data-manage/no-rule/modules/long-no-rule/LongNoRule.vue`

- [ ] **Step 1:** 创建 `LongNoRuleForm.vue`，套 Task 0.2，迁入 `formItems`/回填/提交（`fetchCreateLongNoRule`/`fetchUpdateLongNoRule`）。
- [ ] **Step 2:** 改造 `LongNoRule.vue` 套 Task 0.1，挂 `<LongNoRuleForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分单号资料-长单号截短表单）。

## Task 6: item-no-rule 拆表单

**Files:**

- Create: `src/views/data-manage/no-rule/modules/item-no-rule/ItemNoRuleForm.vue`
- Modify: `src/views/data-manage/no-rule/modules/item-no-rule/ItemNoRule.vue`

- [ ] **Step 1:** 创建 `ItemNoRuleForm.vue`，套 Task 0.2，迁入 `formItems`/回填/提交（`fetchCreateItemNoRule`/`fetchUpdateItemNoRule`）。
- [ ] **Step 2:** 改造 `ItemNoRule.vue` 套 Task 0.1，挂 `<ItemNoRuleForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分单号资料-子单号规则表单）。

> no-rule 批次（Task 3-6）完成后，运行一次 `pnpm typecheck && pnpm lint && pnpm fmt` 全量绿灯。

## Task 7: provider 拆表单

**Files:**

- Create: `src/views/data-manage/ship/modules/provider/ProviderForm.vue`
- Modify: `src/views/data-manage/ship/modules/provider/Provider.vue`

**特有差异：** `providerType` 选项为静态（0-发货/1-派送/2-提单/3-杂支）；原文件顶部 `NRadioGroup` 切类型筛选属列表逻辑，**保留在列表页**，不搬入 Form；Form 仅承载单条记录的 `providerType` 下拉。提交 `fetchCreateProvider`/`fetchUpdateProvider`。

- [ ] **Step 1:** 创建 `ProviderForm.vue`，套 Task 0.2，迁入 `formItems`（providerType 用静态 options）/回填/提交。
- [ ] **Step 2:** 改造 `Provider.vue` 套 Task 0.1，保留顶部 `NRadioGroup` 类型筛选与 `useVxeTable` 的 where 过滤，挂 `<ProviderForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分发货资料-服务商表单）。

## Task 8: channel-group 拆表单

**Files:**

- Create: `src/views/data-manage/ship/modules/channel-group/ChannelGroupForm.vue`
- Modify: `src/views/data-manage/ship/modules/channel-group/ChannelGroup.vue`

- [ ] **Step 1:** 创建 `ChannelGroupForm.vue`，套 Task 0.2，迁入 `formItems`/回填/提交（`fetchCreateChannelGroup`/`fetchUpdateChannelGroup`）。
- [ ] **Step 2:** 改造 `ChannelGroup.vue` 套 Task 0.1，挂 `<ChannelGroupForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分发货资料-渠道类别表单）。

## Task 9: weight-rule 拆表单（含 carryList 动态编辑区）

**Files:**

- Create: `src/views/data-manage/ship/modules/weight-rule/WeightRuleForm.vue`
- Modify: `src/views/data-manage/ship/modules/weight-rule/WeightRule.vue`

**特有差异：** 原 `WeightRule.vue` 的 `calcMode`（0-按公斤/1-按方）下拉 + `carryList` 动态编辑区（`FormWrap` 内自绘的表格/增删行）属表单内部复杂区块，**整体搬入 `WeightRuleForm`**；`carryList` 的增删/校验逻辑一并迁移。提交 `fetchCreateWeightRule`/`fetchUpdateWeightRule`。

- [ ] **Step 1:** 创建 `WeightRuleForm.vue`，套 Task 0.2：`formItems` 含 `calcMode`；额外保留 `carryList` 动态编辑区（`ref` + 增删行方法 + 模板表格），随 `watch(show)` 在 edit 模式下回填 `carryList`；`handleSubmit` 提交含 `calcMode`+`carryList`。
- [ ] **Step 2:** 改造 `WeightRule.vue` 套 Task 0.1，删除 `calcMode`/`carryList`/动态区逻辑，挂 `<WeightRuleForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt（重点 `carryList` 回填与提交）。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分发货资料-计泡规则表单）。

## Task 10: carrier 拆表单（含计泡/追踪网络下拉父→子迁移）

**Files:**

- Create: `src/views/data-manage/ship/modules/carrier/CarrierForm.vue`
- Modify: `src/views/data-manage/ship/modules/carrier/Carrier.vue`

**特有差异：** 原父页「挂载拉计泡规则全量 + 追踪网络全量做名称映射」逻辑整体迁到 `CarrierForm` 的 `onMounted`（填充 `weightRuleOptions`/`trackConfigOptions` 供 select 用）。

- [ ] **Step 1:** 创建 `CarrierForm.vue`，套 Task 0.2：`onMounted` 并行拉 `fetchGetWeightRuleList` + `fetchGetTrackConfigList` 全量填充下拉；`formItems` 含 weightRuleId/trackConfigId 两个 select（options 来自上述）；迁入回填/提交（`fetchCreateCarrier`/`fetchUpdateCarrier`）。
- [ ] **Step 2:** 改造 `Carrier.vue` 套 Task 0.1，**删除**挂载下拉逻辑与 `formItems`/`emptyForm`/`open*`/`handleDrawerSubmit`，挂 `<CarrierForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分发货资料-承运网络表单并迁移下拉）。

> ship 批次（Task 7-10）完成后，运行一次 `pnpm typecheck && pnpm lint && pnpm fmt` 全量绿灯。

## Task 11: bl-route 拆表单

**Files:**

- Create: `src/views/data-manage/bl/modules/bl-route/BlRouteForm.vue`
- Modify: `src/views/data-manage/bl/modules/bl-route/BlRoute.vue`

- [ ] **Step 1:** 创建 `BlRouteForm.vue`，套 Task 0.2，迁入 `formItems`/回填/提交（`fetchCreateBlRoute`/`fetchUpdateBlRoute`）。
- [ ] **Step 2:** 改造 `BlRoute.vue` 套 Task 0.1，挂 `<BlRouteForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分提单资料-航线表单）。

## Task 12: bl-port 拆表单

**Files:**

- Create: `src/views/data-manage/bl/modules/bl-port/BlPortForm.vue`
- Modify: `src/views/data-manage/bl/modules/bl-port/BlPort.vue`

- [ ] **Step 1:** 创建 `BlPortForm.vue`，套 Task 0.2，迁入 `formItems`/回填/提交（`fetchCreateBlPort`/`fetchUpdateBlPort`）。
- [ ] **Step 2:** 改造 `BlPort.vue` 套 Task 0.1，挂 `<BlPortForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分提单资料-港口表单）。

## Task 13: bl-trip 拆表单

**Files:**

- Create: `src/views/data-manage/bl/modules/bl-trip/BlTripForm.vue`
- Modify: `src/views/data-manage/bl/modules/bl-trip/BlTrip.vue`

- [ ] **Step 1:** 创建 `BlTripForm.vue`，套 Task 0.2，迁入 `formItems`/回填/提交（`fetchCreateBlTrip`/`fetchUpdateBlTrip`）。
- [ ] **Step 2:** 改造 `BlTrip.vue` 套 Task 0.1，挂 `<BlTripForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分提单资料-航名航次表单）。

## Task 14: bl-address 拆表单（含 9 类 addressType 静态映射）

**Files:**

- Create: `src/views/data-manage/bl/modules/bl-address/BlAddressForm.vue`
- Modify: `src/views/data-manage/bl/modules/bl-address/BlAddress.vue`

**特有差异：** 原 `BlAddress.vue` 顶部 9 类 `addressType`（BY/ST/CN/SE/MF/IM/BKP/CS/LG）横向切换属**列表筛选**（保留在列表页）；单条表单的 `addressType` 字段用静态 options。若原表单内部有按 `addressType` 动态显隐的字段，随 Form 搬入。提交 `fetchCreateBlAddress`/`fetchUpdateBlAddress`。

- [ ] **Step 1:** 创建 `BlAddressForm.vue`，套 Task 0.2：迁入 `formItems`（addressType 静态 options）+ 原表单内 `addressType` 相关动态显隐逻辑/回填/提交。
- [ ] **Step 2:** 改造 `BlAddress.vue` 套 Task 0.1，保留顶部 9 类 `addressType` 切换与 `useVxeTable` 的 `where` 过滤，挂 `<BlAddressForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分提单资料-地址簿表单）。

## Task 15: bl-unit 拆表单

**Files:**

- Create: `src/views/data-manage/bl/modules/bl-unit/BlUnitForm.vue`
- Modify: `src/views/data-manage/bl/modules/bl-unit/BlUnit.vue`

- [ ] **Step 1:** 创建 `BlUnitForm.vue`，套 Task 0.2，迁入 `formItems`/回填/提交（`fetchCreateBlUnit`/`fetchUpdateBlUnit`）。
- [ ] **Step 2:** 改造 `BlUnit.vue` 套 Task 0.1，挂 `<BlUnitForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分提单资料-柜型表单）。

## Task 16: track-config 拆表单（含 trackType 动态对接字段）

**Files:**

- Create: `src/views/data-manage/bl/modules/track-config/TrackConfigForm.vue`
- Modify: `src/views/data-manage/bl/modules/track-config/TrackConfig.vue`

**特有差异：** 原 `TrackConfig.vue` 的「按 `trackType` 动态生成必填对接字段」（依赖 `constants/track-config.ts` 的 `TRACK_TYPE_CONFIGS`）属表单内部复杂区块，**整体搬入 `TrackConfigForm`**；`watch(trackType)` 重置校验/清空动态字段逻辑一并迁移。提交 `fetchCreateTrackConfig`/`fetchUpdateTrackConfig`。

- [ ] **Step 1:** 创建 `TrackConfigForm.vue`，套 Task 0.2：迁入 `formItems` 固定项（name/trackType/url/web）+ 按 `trackType` 动态生成的对接字段 + `watch(trackType)` 清字段/重置校验；回填/提交随 `props.mode`。
- [ ] **Step 2:** 改造 `TrackConfig.vue` 套 Task 0.1，删除上述动态字段逻辑，挂 `<TrackConfigForm .../>`。
- [ ] **Step 3:** 验证 typecheck/lint/fmt（重点动态字段回填）。
- [ ] **Step 4:** 提交 `pnpm commit`（feat(data-manage): 拆分提单资料-轨迹配置表单）。

> bl 批次（Task 11-16）完成后，运行一次 `pnpm typecheck && pnpm lint && pnpm fmt && pnpm build` 全量绿灯。

---

## Self-Review 备注

- **Spec 覆盖**：§2 范围（16 拆 / 12 不动）✓；§3 文件形态 ✓；§4 接口契约（Task 0）✓；§5 下拉归属（FBA/Carrier 在 Task 2/10，weight-rule/bl-address/track-config 复杂区块在 Task 9/14/16）✓；§6 命名/类型 ✓；§7 分批（basic=Task1-2、no-rule=3-6、ship=7-10、bl=11-16）✓；§8 验证 ✓；§9 风险（禁用 index.vue、父→子迁移、复杂区块原样搬）✓。
- **无 placeholder**：每个 Task 的 `formItems`/`emptyForm`/提交函数均指向原文件具体位置或给出字段 key 与 service 函数名；复杂区块（carryList/9 类/动态字段）明确标「整体搬入」。
- **类型一致**：全部 `Api.DataManage.Xxx`、`v-model:show` / `:mode` / `:row` / `@submitted` 契约在 Task 0 统一定义，后续 Task 复用一致。
