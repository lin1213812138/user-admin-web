# 资料管理「发货资料」实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 资料管理下新增第 5 页「发货资料」（`data-manage/ship`），含服务商 / 渠道类别 / 计泡规则 / 承运网络 4 个竖向 tab，直连 tms-user 真实接口。

**Architecture:** 页面按系统设置范式：`index.vue` 壳（VerticalTabLayout + defineAsyncComponent + `:key` 重建）+ `modules/<tab>/<Tab>.vue` 各自独立实现（useVxeTable + Drawer + NFormWrap）。service 层 16 个 flat request 函数直连 `/provider|channel-group|weight-rule|carrier` 四组端点，DEV 不写 mock。设计规格见 `changelog/发货资料.md`。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">` + vxe-table（useVxeTable）+ Naive UI + elegant-router 0.3.8 + pnpm workspace。

## Global Constraints

- 本仓库**无测试框架**：每任务验证 = `pnpm typecheck`（必要时 `pnpm lint`），最终 `pnpm build` + 浏览器走查。
- **不要直接 `git commit`**（commit-msg 钩子 + 交互式 `pnpm commit:zh` 由用户执行）；计划不含 commit 步骤。
- 禁止手改 `src/router/elegant/**`、`typings/components.d.ts`；路由由 `pnpm dev` 触发重生成。
- 后端契约：tms-user 通用分页 `{ page, size, keyword, where }` → `{ list, total }`；create/update 返回空对象（service 标注 `request<boolean>`，调用方解包 `{ data, error }`）；**delete 仅单 `_id`**。
- 服务商 providerType：0-发货 1-派送 2-提单 3-杂支（**杂支不管理**）；渠道类别**无 status 字段**。
- 新增按钮文案统一「新增」；i18n 改动必须 zh-cn / en-us / `typings/app.d.ts` 三处同步。
- 时间字段为毫秒时间戳（`createDate`/`updateDate`），列内 dayjs 格式化。
- 列配置 cacheKey：`data-manage-ship-provider` / `data-manage-ship-channel-group` / `data-manage-ship-weight-rule` / `data-manage-ship-carrier`。
- 状态列 status（服务商）是数字 0/1，**不用** Table 的 `type:'status'`（其 activeValue 默认字符串 `'1'`），用插槽 NTag 自渲染。

---

### Task 1: 后端 weight-rule 模型加 calcMode 字段（tms-user 仓库）

**Files:**

- Modify: `d:\LINFLY\WMS\tms-user\lib\common\models\weight-rule.js:9-12`

**Interfaces:**

- Produces: weight-rule 文档新字段 `calcMode`（0-按公斤 1-按方，默认 0）；前端 `WeightRule.calcMode` 类型对齐。

- [ ] **Step 1: 在 `mode` 字段后插入 calcMode**

```js
    mode: {
      type: Number,
      default: 0
    }, // 计泡类型 0-件实重之和 1-件体积重之和 2-票总重和票总体积重取大值 3-件计费重之和
    calcMode: {
      type: Number,
      default: 0
    }, // 计算方式 0-按公斤 1-按方
```

- [ ] **Step 2: 验证**

运行：`node -e "require('d:/LINFLY/WMS/tms-user/lib/common/models/weight-rule.js')" 2>$null`（能加载即可，或直接目检语法）。该字段纯存取（commonService 透传），无需改 query/service/路由。

---

### Task 2: 类型声明 `Api.DataManageShip`

**Files:**

- Create: `d:\LINFLY\CWMS\user-admin-web\src\typings\api\data-manage-ship.d.ts`

**Interfaces:**

- Produces: `Api.DataManageShip.{ShipQueryParams, ShipQueryResult<T>, ShipBaseRow, Provider, ChannelGroup, WeightRuleCarryItem, WeightRuleCarry, WeightRule, Carrier}`（Task 3 service 与 Task 5-8 页面消费；全局命名空间无需 import）。

- [ ] **Step 1: 写入完整声明文件**

```ts
declare namespace Api {
  /** 发货资料（服务商 / 渠道类别 / 计泡规则 / 承运网络），对应 tms-user /provider、/channel-group、/weight-rule、/carrier */
  namespace DataManageShip {
    /** 通用查询参数（tms-user queryCommon 约定：page/size/keyword/where → {list,total}） */
    interface ShipQueryParams {
      page?: number;
      size?: number;
      keyword?: string;
      where?: Record<string, unknown>;
    }

    /** 通用查询返回 */
    interface ShipQueryResult<T> {
      list: T[];
      total: number;
    }

    /** 各模型公共行字段 */
    interface ShipBaseRow {
      _id: string;
      /** 创建人名称 */
      creator?: string;
      /** 修改人名称 */
      updateBy?: string;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
      note?: string;
    }

    /** 服务商（providerType：0-发货 1-派送 2-提单 3-杂支，本页仅管理 0/1/2） */
    interface Provider extends ShipBaseRow {
      code: string;
      name: string;
      providerType: 0 | 1 | 2 | 3;
      /** 结算方式 */
      billMode?: string;
      contact?: string;
      phone?: string;
      email?: string;
      web?: string;
      address?: string;
      balance?: number;
      /** 0-暂停 1-正常 */
      status: 0 | 1;
    }

    /** 渠道类别（后端模型无 status） */
    interface ChannelGroup extends ShipBaseRow {
      name: string;
      nameEn?: string;
      order?: number;
    }

    /** 计泡规则进位区间 */
    interface WeightRuleCarryItem {
      start?: number;
      end?: number;
      /** 计重单位 */
      unit?: number;
    }

    /** 计泡规则进位规则组 */
    interface WeightRuleCarry {
      /** 0-件实重和件体积重进位 1-件计费重进位 2-票总重和票总体积重进位 3-票计费重进位 */
      carry?: number;
      ruleList?: WeightRuleCarryItem[];
    }

    /** 计泡规则（mode：0-件实重之和 1-件体积重之和 2-票总重和票总体积重取大值 3-件计费重之和；calcMode：0-按公斤 1-按方，后端新增字段） */
    interface WeightRule extends ShipBaseRow {
      name: string;
      order?: number;
      mode?: number;
      calcMode?: number;
      carryList?: WeightRuleCarry[];
      /** 材积除 */
      cubicNum?: number;
      /** 计泡比率 0-100 */
      weightOff?: number;
    }

    /** 承运网络（trackConfigId/remoteGroupId 数据源页面不存在，字段保留不展示） */
    interface Carrier extends ShipBaseRow {
      name: string;
      order?: number;
      weightRuleId?: string;
      trackConfigId?: string;
      remoteGroupId?: string;
      /** 燃油费率 */
      oilRate?: number;
      /** 报关费 */
      feeCustom?: number;
      cubicNum?: number;
      weightOff?: number;
    }
  }
}
```

- [ ] **Step 2: typecheck**

运行：`pnpm typecheck`。Expected: 通过（纯新增 declare namespace，无引用点）。

---

### Task 3: service 层 `service/api/data-manage-ship`

**Files:**

- Create: `d:\LINFLY\CWMS\user-admin-web\src\service\api\data-manage-ship\index.ts`
- Modify: `d:\LINFLY\CWMS\user-admin-web\src\service\api\index.ts`（barrel 追加一行）

**Interfaces:**

- Consumes: Task 2 的 `Api.DataManageShip.*`。
- Produces: 16 个函数 `fetchGetProviderList/fetchCreateProvider/fetchUpdateProvider/fetchDeleteProvider`、`fetchGetChannelGroupList/...`、`fetchGetWeightRuleList/...`、`fetchGetCarrierList/...`（均 flat request，返回 `Promise<{ data, error }>`；delete 入参单 `id: string`）。

- [ ] **Step 1: 写入 service 文件**

```ts
import { request } from '../../request';

/**
 * 发货资料接口（服务商 / 渠道类别 / 计泡规则 / 承运网络），全部为 tms-user 真实接口（无 DEV mock）。
 * 均为 flat request，调用方需解包 { data, error }。
 * 通用分页契约：{ page, size, keyword, where } → { list, total }；create/update 返回空对象；delete 仅单条 _id。
 */

// ---- 服务商 /provider ----

/** 服务商列表（keyword 只搜名称；where.providerType 0-发货 1-派送 2-提单，where.status 0-暂停 1-正常） */
export function fetchGetProviderList(params: Api.DataManageShip.ShipQueryParams) {
  return request<Api.DataManageShip.ShipQueryResult<Api.DataManageShip.Provider>>({
    url: '/provider/query',
    method: 'post',
    data: params
  });
}

/** 新建服务商（name/code 后端唯一校验） */
export function fetchCreateProvider(params: Partial<Api.DataManageShip.Provider>) {
  return request<boolean>({ url: '/provider/create', method: 'post', data: params });
}

/** 更新服务商（必填 _id） */
export function fetchUpdateProvider(params: Partial<Api.DataManageShip.Provider>) {
  return request<boolean>({ url: '/provider/update', method: 'post', data: params });
}

/** 删除服务商（后端连带删除其 API 配置与发货渠道） */
export function fetchDeleteProvider(id: string) {
  return request<boolean>({ url: '/provider/delete', method: 'post', data: { _id: id } });
}

// ---- 渠道类别 /channel-group ----

export function fetchGetChannelGroupList(params: Api.DataManageShip.ShipQueryParams) {
  return request<Api.DataManageShip.ShipQueryResult<Api.DataManageShip.ChannelGroup>>({
    url: '/channel-group/query',
    method: 'post',
    data: params
  });
}

export function fetchCreateChannelGroup(params: Partial<Api.DataManageShip.ChannelGroup>) {
  return request<boolean>({ url: '/channel-group/create', method: 'post', data: params });
}

export function fetchUpdateChannelGroup(params: Partial<Api.DataManageShip.ChannelGroup>) {
  return request<boolean>({ url: '/channel-group/update', method: 'post', data: params });
}

export function fetchDeleteChannelGroup(id: string) {
  return request<boolean>({ url: '/channel-group/delete', method: 'post', data: { _id: id } });
}

// ---- 计泡规则 /weight-rule ----

export function fetchGetWeightRuleList(params: Api.DataManageShip.ShipQueryParams) {
  return request<Api.DataManageShip.ShipQueryResult<Api.DataManageShip.WeightRule>>({
    url: '/weight-rule/query',
    method: 'post',
    data: params
  });
}

export function fetchCreateWeightRule(params: Partial<Api.DataManageShip.WeightRule>) {
  return request<boolean>({ url: '/weight-rule/create', method: 'post', data: params });
}

export function fetchUpdateWeightRule(params: Partial<Api.DataManageShip.WeightRule>) {
  return request<boolean>({ url: '/weight-rule/update', method: 'post', data: params });
}

export function fetchDeleteWeightRule(id: string) {
  return request<boolean>({ url: '/weight-rule/delete', method: 'post', data: { _id: id } });
}

// ---- 承运网络 /carrier ----

export function fetchGetCarrierList(params: Api.DataManageShip.ShipQueryParams) {
  return request<Api.DataManageShip.ShipQueryResult<Api.DataManageShip.Carrier>>({
    url: '/carrier/query',
    method: 'post',
    data: params
  });
}

export function fetchCreateCarrier(params: Partial<Api.DataManageShip.Carrier>) {
  return request<boolean>({ url: '/carrier/create', method: 'post', data: params });
}

export function fetchUpdateCarrier(params: Partial<Api.DataManageShip.Carrier>) {
  return request<boolean>({ url: '/carrier/update', method: 'post', data: params });
}

export function fetchDeleteCarrier(id: string) {
  return request<boolean>({ url: '/carrier/delete', method: 'post', data: { _id: id } });
}
```

- [ ] **Step 2: barrel 追加**

`src/service/api/index.ts` 末尾（`export * from './upload';` 之后）追加：

```ts
export * from './data-manage-ship';
```

- [ ] **Step 3: typecheck**

运行：`pnpm typecheck`。Expected: 通过。

---

### Task 4: i18n 三处同步

**Files:**

- Modify: `d:\LINFLY\CWMS\user-admin-web\src\locales\langs\zh-cn.ts`（route 段 306-316 附近 + `page.dataManage` 段 980 附近）
- Modify: `d:\LINFLY\CWMS\user-admin-web\src\locales\langs\en-us.ts`（对应两处）
- Modify: `d:\LINFLY\CWMS\user-admin-web\src\typings\app.d.ts`（I18n Schema：`route` 为 `Record<I18nRouteKey>` 由 RouteKey 驱动，只需改 `page.dataManage` 段 1241 附近）

**Interfaces:**

- Produces: `route.data-manage_ship`、`page.dataManage.ship.{provider,channelGroup,weightRule,carrier}.*`（Task 5-9 页面消费的精确 key 见下方结构）。

- [ ] **Step 1: zh-cn.ts route 段**，`'data-manage_no-rule': '单号资料',` 后插入：

```ts
    'data-manage_ship': '发货资料',
```

- [ ] **Step 2: zh-cn.ts `page.dataManage` 段末尾**（`noRule` 子段闭合后、`dataManage` 闭合 `}` 前）插入 `ship` 子段：

```ts
      ship: {
        provider: {
          title: '服务商',
          code: '服务商代码',
          name: '服务商名称',
          billMode: '结算方式',
          contact: '联系人',
          phone: '电话',
          email: '邮箱',
          web: '网址',
          address: '地址',
          balance: '余额',
          typeOption: { out: '发货服务商', send: '派送服务商', bl: '提单服务商' }
        },
        channelGroup: {
          title: '渠道类别',
          name: '类别名称',
          nameEn: '英文名称',
          order: '排序'
        },
        weightRule: {
          title: '计泡规则',
          calcMode: '计算方式',
          mode: '计泡类型',
          weightOff: '计泡比率',
          cubicNum: '材积除',
          order: '排序',
          calcModeOption: { byKg: '按公斤', byCubic: '按方' },
          modeOption: { m0: '件实重之和', m1: '件体积重之和', m2: '票总重和票总体积重取大值', m3: '件计费重之和' },
          carry: '进位规则',
          carryOption: { c0: '件实重和件体积重进位', c1: '件计费重进位', c2: '票总重和票总体积重进位', c3: '票计费重进位' },
          carryGroup: '进位规则组',
          addCarryGroup: '加进位规则组',
          addRule: '加区间',
          removeCarryGroup: '删除该组',
          removeRule: '删行',
          start: '开始重量',
          end: '结束重量',
          unit: '计重单位'
        },
        carrier: {
          title: '承运网络',
          name: '网络名称',
          weightRule: '关联计泡规则',
          oilRate: '燃油费率',
          feeCustom: '报关费',
          cubicNum: '材积除',
          weightOff: '计泡比率',
          order: '排序'
        }
      }
```

- [ ] **Step 3: en-us.ts** 对应两处（route：`'data-manage_ship': 'Shipping Data',`；ship 段英文对照）：

```ts
      ship: {
        provider: {
          title: 'Provider',
          code: 'Provider Code',
          name: 'Provider Name',
          billMode: 'Settlement',
          contact: 'Contact',
          phone: 'Phone',
          email: 'Email',
          web: 'Website',
          address: 'Address',
          balance: 'Balance',
          typeOption: { out: 'Shipping Provider', send: 'Delivery Provider', bl: 'BL Provider' }
        },
        channelGroup: {
          title: 'Channel Category',
          name: 'Category Name',
          nameEn: 'English Name',
          order: 'Order'
        },
        weightRule: {
          title: 'Weight Rule',
          calcMode: 'Calc Mode',
          mode: 'Calc Type',
          weightOff: 'Volumetric Ratio',
          cubicNum: 'Cubic Divisor',
          order: 'Order',
          calcModeOption: { byKg: 'By Weight', byCubic: 'By Volume' },
          modeOption: { m0: 'Sum of Real Weight', m1: 'Sum of Volumetric Weight', m2: 'Max of Totals', m3: 'Sum of Chargeable Weight' },
          carry: 'Carry Rule',
          carryOption: { c0: 'Round Per-piece Real & Volumetric', c1: 'Round Per-piece Chargeable', c2: 'Round Shipment Totals', c3: 'Round Shipment Chargeable' },
          carryGroup: 'Carry Group',
          addCarryGroup: 'Add Carry Group',
          addRule: 'Add Range',
          removeCarryGroup: 'Remove Group',
          removeRule: 'Remove',
          start: 'Start Weight',
          end: 'End Weight',
          unit: 'Weight Unit'
        },
        carrier: {
          title: 'Carrier Network',
          name: 'Network Name',
          weightRule: 'Weight Rule',
          oilRate: 'Fuel Rate',
          feeCustom: 'Customs Fee',
          cubicNum: 'Cubic Divisor',
          weightOff: 'Volumetric Ratio',
          order: 'Order'
        }
      }
```

- [ ] **Step 4: app.d.ts** `page.dataManage` 段（1241 起）在 `noRule` 子段后插入同构 typed `ship` 子段（键与 Step 2 完全一致，值全部 `string`，`typeOption/calcModeOption/modeOption/carryOption` 为对象字段）。

- [ ] **Step 5: typecheck**（app.d.ts I18n Schema 是强校验：zh/en 键不一致或缺段会报错）

运行：`pnpm typecheck`。Expected: 通过。

---

### Task 5: 服务商 tab `Provider.vue`

**Files:**

- Create: `d:\LINFLY\CWMS\user-admin-web\src\views\data-manage\ship\modules\provider\Provider.vue`

**Interfaces:**

- Consumes: Task 3 的 4 个 provider 函数、Task 4 的 i18n key。
- Produces: 独立组件，供 Task 9 壳异步加载。参照 `views/system-manage/setting/modules/export-format/ExportFormat.vue` 的完整模式（flat request 解包 / current→page 映射 / Drawer / NFormWrap / NPopconfirm 行删）。

- [ ] **Step 1: 写入组件**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateProvider,
  fetchDeleteProvider,
  fetchGetProviderList,
  fetchUpdateProvider
} from '@/service/api/data-manage-ship';

/** 服务商类型（后端固定枚举；杂支服务商 3 不在本页管理） */
const providerTypeOptions = computed(() => [
  { label: $t('page.dataManage.ship.provider.typeOption.out'), value: 0 },
  { label: $t('page.dataManage.ship.provider.typeOption.send'), value: 1 },
  { label: $t('page.dataManage.ship.provider.typeOption.bl'), value: 2 }
]);

/** 当前服务商类型（NRadioGroup 切换后重查） */
const providerType = ref<0 | 1 | 2>(0);
/** 名称搜索关键字（后端 keywordFields: ['name']） */
const keyword = ref('');
/** 状态筛选（null = 全部） */
const statusFilter = ref<0 | 1 | null>(null);

const statusOptions = computed(() => [
  { label: $t('common.enable'), value: 1 },
  { label: $t('common.disable'), value: 0 }
]);

/** 毫秒时间戳格式化展示 */
function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.DataManageShip.ShipQueryResult<Api.DataManageShip.Provider>,
  Api.DataManageShip.Provider
>({
  // 真实接口 flat request：解包 { data, error }，失败返回空列表（错误提示由 request 拦截器统一弹出）
  api: async ({ current, size }) => {
    const where: Record<string, unknown> = { providerType: providerType.value };
    if (statusFilter.value !== null) where.status = statusFilter.value;
    const { data: res, error } = await fetchGetProviderList({
      page: current,
      size,
      keyword: keyword.value || undefined,
      where
    });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'code',
        title: $t('page.dataManage.ship.provider.code'),
        type: 'detail',
        visible: true,
        minWidth: 120,
        sortable: false
      },
      { key: 'name', title: $t('page.dataManage.ship.provider.name'), visible: true, minWidth: 140, sortable: false },
      {
        key: 'billMode',
        title: $t('page.dataManage.ship.provider.billMode'),
        visible: true,
        width: 110,
        sortable: false
      },
      {
        key: 'contact',
        title: $t('page.dataManage.ship.provider.contact'),
        visible: true,
        width: 100,
        sortable: false
      },
      { key: 'phone', title: $t('page.dataManage.ship.provider.phone'), visible: true, width: 130, sortable: false },
      {
        key: 'balance',
        title: $t('page.dataManage.ship.provider.balance'),
        visible: true,
        width: 100,
        align: 'right',
        sortable: false
      },
      { key: 'status', title: $t('common.status'), visible: true, width: 90, align: 'center', sortable: false },
      {
        key: 'createDate',
        title: $t('page.dataManage.common.createTime'),
        visible: true,
        width: 170,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-ship-provider'
});

const columnConfigVisible = ref(false);

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  keyword.value = '';
  statusFilter.value = null;
  providerType.value = 0;
  pagination.current = 1;
  getData();
}

/** 切换服务商类型：重置到第一页重查 */
function handleTypeChange() {
  pagination.current = 1;
  getData();
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

// ---- 勾选与删除（后端 delete 仅单 _id，批量 = 前端逐条） ----
const checkedRows = ref<Api.DataManageShip.Provider[]>([]);

function handleSelectionChange(rows: Api.DataManageShip.Provider[]) {
  checkedRows.value = rows;
}

async function confirmDelete(row: Api.DataManageShip.Provider) {
  const { error } = await fetchDeleteProvider(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteProvider(row._id);
    if (error) return;
  }
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

// ---- 抽屉 ----
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<Api.DataManageShip.Provider>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<Api.DataManageShip.Provider> {
  return {
    code: '',
    name: '',
    billMode: '',
    contact: '',
    phone: '',
    email: '',
    web: '',
    address: '',
    providerType: providerType.value,
    status: 1,
    note: ''
  };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.ship.provider.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.ship.provider.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'code',
    label: $t('page.dataManage.ship.provider.code'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入服务商代码'
  },
  {
    key: 'name',
    label: $t('page.dataManage.ship.provider.name'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入服务商名称'
  },
  { key: 'billMode', label: $t('page.dataManage.ship.provider.billMode'), type: 'input', span: 12 },
  { key: 'contact', label: $t('page.dataManage.ship.provider.contact'), type: 'input', span: 12 },
  { key: 'phone', label: $t('page.dataManage.ship.provider.phone'), type: 'input', span: 12 },
  { key: 'email', label: $t('page.dataManage.ship.provider.email'), type: 'input', span: 12 },
  { key: 'web', label: $t('page.dataManage.ship.provider.web'), type: 'input', span: 12 },
  { key: 'address', label: $t('page.dataManage.ship.provider.address'), type: 'input', span: 12 },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'switch',
    span: 24,
    checkedValue: 1,
    uncheckedValue: 0,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable')
  },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

function openEdit(row: Api.DataManageShip.Provider) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    code: row.code,
    name: row.name,
    billMode: row.billMode ?? '',
    contact: row.contact ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    web: row.web ?? '',
    address: row.address ?? '',
    providerType: row.providerType,
    status: row.status,
    note: row.note ?? ''
  };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  submitting.value = true;
  try {
    const { error } =
      drawerMode.value === 'create'
        ? await fetchCreateProvider(formModel.value)
        : await fetchUpdateProvider(formModel.value);

    if (error) return;

    drawerVisible.value = false;
    getData();
    window.$message?.success($t(drawerMode.value === 'create' ? 'common.createSuccess' : 'common.saveSuccess'));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="h-full w-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      show-checkbox
      show-action
      :action-width="140"
      @refresh="getData"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
    >
      <template #search-action>
        <div class="flex flex-wrap items-center gap-12px">
          <NRadioGroup v-model:value="providerType" @update:value="handleTypeChange">
            <NRadioButton v-for="opt in providerTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </NRadioButton>
          </NRadioGroup>
          <NInput
            v-model:value="keyword"
            class="w-200px!"
            clearable
            placeholder="请输入服务商名称"
            @keyup.enter="handleSearch"
          />
          <NSelect
            v-model:value="statusFilter"
            class="w-140px!"
            clearable
            :options="statusOptions"
            placeholder="状态"
          />
          <NButton size="small" type="primary" @click="handleSearch">
            <template #icon><icon-ic-round-search class="text-icon" /></template>
            {{ $t('common.search') }}
          </NButton>
          <NButton size="small" @click="handleReset">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
            {{ $t('common.reset') }}
          </NButton>
        </div>
      </template>
      <template #status="{ row }">
        <NTag :type="row.status === 1 ? 'success' : 'error'" size="small">
          {{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}
        </NTag>
      </template>
      <template #createDate="{ row }">
        <span>{{ formatDateTime(row.createDate) }}</span>
      </template>
      <template #operation-left>
        <NButton type="primary" ghost size="small" @click="openCreate">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </NButton>
        <NPopconfirm @positive-click="confirmBatchDelete">
          <template #trigger>
            <NButton size="small" type="error" ghost :disabled="checkedRows.length === 0">
              {{ $t('common.delete') }}
            </NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
      <template #operation-right="{ refresh }">
        <NButton size="small" @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </NButton>
        <TableColumnConfig
          v-model:visible="columnConfigVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
        <NPopconfirm @positive-click="confirmDelete(row)">
          <template #trigger>
            <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <Drawer
      v-model:show="drawerVisible"
      :title="drawerTitle"
      :loading="submitting"
      :confirm-text="$t('common.save')"
      @submit="handleDrawerSubmit"
    >
      <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
    </Drawer>
  </div>
</template>
```

- [ ] **Step 2: typecheck + lint 该文件**

运行：`pnpm typecheck`；`pnpm lint`。Expected: 0 error（此时尚未被壳引用，声明文件函数全部被消费）。

---

### Task 6: 渠道类别 tab `ChannelGroup.vue`

**Files:**

- Create: `d:\LINFLY\CWMS\user-admin-web\src\views\data-manage\ship\modules\channel-group\ChannelGroup.vue`

**Interfaces:**

- Consumes: `fetchGetChannelGroupList/fetchCreateChannelGroup/fetchUpdateChannelGroup/fetchDeleteChannelGroup`；i18n `page.dataManage.ship.channelGroup.*`。
- Produces: 独立组件。**与 Provider 的差异点：无 status 列/筛选/表单项、无 NRadioGroup；表单多 nameEn 与 order(number)。**

- [ ] **Step 1: 写入组件**

结构与 Provider.vue 相同（复制后按下述替换）：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchCreateChannelGroup,
  fetchDeleteChannelGroup,
  fetchGetChannelGroupList,
  fetchUpdateChannelGroup
} from '@/service/api/data-manage-ship';

/** 名称搜索关键字 */
const keyword = ref('');

function formatDateTime(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
}

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.DataManageShip.ShipQueryResult<Api.DataManageShip.ChannelGroup>,
  Api.DataManageShip.ChannelGroup
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetChannelGroupList({
      page: current,
      size,
      keyword: keyword.value || undefined,
      where: {}
    });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.dataManage.ship.channelGroup.name'),
        type: 'detail',
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'nameEn',
        title: $t('page.dataManage.ship.channelGroup.nameEn'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'order',
        title: $t('page.dataManage.ship.channelGroup.order'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      {
        key: 'createDate',
        title: $t('page.dataManage.common.createTime'),
        visible: true,
        width: 170,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-ship-channel-group'
});

const columnConfigVisible = ref(false);

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  keyword.value = '';
  pagination.current = 1;
  getData();
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

// ---- 勾选与删除（后端 delete 仅单 _id，批量 = 前端逐条） ----
const checkedRows = ref<Api.DataManageShip.ChannelGroup[]>([]);

function handleSelectionChange(rows: Api.DataManageShip.ChannelGroup[]) {
  checkedRows.value = rows;
}

async function confirmDelete(row: Api.DataManageShip.ChannelGroup) {
  const { error } = await fetchDeleteChannelGroup(row._id);
  if (error) return;
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

async function confirmBatchDelete() {
  for (const row of checkedRows.value) {
    const { error } = await fetchDeleteChannelGroup(row._id);
    if (error) return;
  }
  checkedRows.value = [];
  getData();
  window.$message?.success($t('common.deleteSuccess'));
}

// ---- 抽屉 ----
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<Api.DataManageShip.ChannelGroup>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<Api.DataManageShip.ChannelGroup> {
  return { name: '', nameEn: '', order: 0, note: '' };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.ship.channelGroup.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.ship.channelGroup.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.ship.channelGroup.name'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入类别名称'
  },
  {
    key: 'nameEn',
    label: $t('page.dataManage.ship.channelGroup.nameEn'),
    type: 'input',
    span: 12,
    placeholder: '请输入英文名称'
  },
  { key: 'order', label: $t('page.dataManage.ship.channelGroup.order'), type: 'number', span: 12 },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

function openEdit(row: Api.DataManageShip.ChannelGroup) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    name: row.name,
    nameEn: row.nameEn ?? '',
    order: row.order ?? 0,
    note: row.note ?? ''
  };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  submitting.value = true;
  try {
    const { error } =
      drawerMode.value === 'create'
        ? await fetchCreateChannelGroup(formModel.value)
        : await fetchUpdateChannelGroup(formModel.value);

    if (error) return;

    drawerVisible.value = false;
    getData();
    window.$message?.success($t(drawerMode.value === 'create' ? 'common.createSuccess' : 'common.saveSuccess'));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="h-full w-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      show-checkbox
      show-action
      :action-width="140"
      @refresh="getData"
      @page-change="handlePageChange"
      @selection-change="handleSelectionChange"
    >
      <template #search-action>
        <div class="flex flex-wrap items-center gap-12px">
          <NInput
            v-model:value="keyword"
            class="w-200px!"
            clearable
            placeholder="请输入类别名称"
            @keyup.enter="handleSearch"
          />
          <NButton size="small" type="primary" @click="handleSearch">
            <template #icon><icon-ic-round-search class="text-icon" /></template>
            {{ $t('common.search') }}
          </NButton>
          <NButton size="small" @click="handleReset">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
            {{ $t('common.reset') }}
          </NButton>
        </div>
      </template>
      <template #createDate="{ row }">
        <span>{{ formatDateTime(row.createDate) }}</span>
      </template>
      <template #operation-left>
        <NButton type="primary" ghost size="small" @click="openCreate">
          <template #icon><icon-ic-round-plus class="text-icon" /></template>
          {{ $t('common.add') }}
        </NButton>
        <NPopconfirm @positive-click="confirmBatchDelete">
          <template #trigger>
            <NButton size="small" type="error" ghost :disabled="checkedRows.length === 0">
              {{ $t('common.delete') }}
            </NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
      <template #operation-right="{ refresh }">
        <NButton size="small" @click="refresh">
          <template #icon><icon-ic-round-refresh class="text-icon" /></template>
        </NButton>
        <TableColumnConfig
          v-model:visible="columnConfigVisible"
          v-model:columns="columnConfigs"
          @confirm="persistColumns"
          @reset="resetColumns"
        />
      </template>
      <template #action="{ row }">
        <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
        <NPopconfirm @positive-click="confirmDelete(row)">
          <template #trigger>
            <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
          </template>
          {{ $t('common.confirmDelete') }}
        </NPopconfirm>
      </template>
    </Table>

    <Drawer
      v-model:show="drawerVisible"
      :title="drawerTitle"
      :loading="submitting"
      :confirm-text="$t('common.save')"
      @submit="handleDrawerSubmit"
    >
      <NFormWrap ref="formRef" :model="formModel" :items="formItems" />
    </Drawer>
  </div>
</template>
```

- [ ] **Step 2: typecheck + lint**

运行：`pnpm typecheck`；`pnpm lint`。Expected: 0 error。

---

### Task 7: 计泡规则 tab `WeightRule.vue`（含进位规则动态编辑区）

**Files:**

- Create: `d:\LINFLY\CWMS\user-admin-web\src\views\data-manage\ship\modules\weight-rule\WeightRule.vue`

**Interfaces:**

- Consumes: `fetchGetWeightRuleList/fetchCreateWeightRule/fetchUpdateWeightRule/fetchDeleteWeightRule`；i18n `page.dataManage.ship.weightRule.*`。
- Produces: 独立组件。**要点：calcMode/mode 用 NSelect（FormWrap select 项 + filterable:false）；进位规则 carryList 是嵌套数组，不走 FormWrap，Drawer 内 NFormWrap 下方自绘动态区块（组：carry 下拉；组内行：start/end/unit），提交时合入 payload。**

- [ ] **Step 1: 写入组件**

script 部分骨架与 Task 6 相同，差异如下（完整替换对应片段）：

枚举选项（keyword 之后、useVxeTable 之前）：

```ts
/** 计算方式（后端新增字段 calcMode：0-按公斤 1-按方） */
const calcModeOptions = computed(() => [
  { label: $t('page.dataManage.ship.weightRule.calcModeOption.byKg'), value: 0 },
  { label: $t('page.dataManage.ship.weightRule.calcModeOption.byCubic'), value: 1 }
]);

/** 计泡类型（后端固定枚举 mode 0-3） */
const modeOptions = computed(() => [
  { label: $t('page.dataManage.ship.weightRule.modeOption.m0'), value: 0 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m1'), value: 1 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m2'), value: 2 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m3'), value: 3 }
]);

/** 进位规则类型（carry 0-3） */
const carryOptions = computed(() => [
  { label: $t('page.dataManage.ship.weightRule.carryOption.c0'), value: 0 },
  { label: $t('page.dataManage.ship.weightRule.carryOption.c1'), value: 1 },
  { label: $t('page.dataManage.ship.weightRule.carryOption.c2'), value: 2 },
  { label: $t('page.dataManage.ship.weightRule.carryOption.c3'), value: 3 }
]);

/** 计泡类型列展示文案 */
function modeLabel(mode?: number) {
  return modeOptions.value.find(item => item.value === mode)?.label ?? '';
}

/** 计算方式列展示文案 */
function calcModeLabel(calcMode?: number) {
  return calcModeOptions.value.find(item => item.value === calcMode)?.label ?? '';
}
```

useVxeTable 的 api/transform 与 Task 6 相同（换 weight-rule 函数），columns：

```ts
  columns: () =>
    [
      { key: 'name', title: $t('page.dataManage.ship.weightRule.title'), type: 'detail', visible: true, minWidth: 140, sortable: false },
      { key: 'calcMode', title: $t('page.dataManage.ship.weightRule.calcMode'), visible: true, width: 110, sortable: false },
      { key: 'mode', title: $t('page.dataManage.ship.weightRule.mode'), visible: true, minWidth: 200, sortable: false },
      { key: 'weightOff', title: $t('page.dataManage.ship.weightRule.weightOff'), visible: true, width: 100, align: 'right', sortable: false },
      { key: 'cubicNum', title: $t('page.dataManage.ship.weightRule.cubicNum'), visible: true, width: 100, align: 'right', sortable: false },
      { key: 'order', title: $t('page.dataManage.ship.weightRule.order'), visible: true, width: 90, align: 'center', sortable: false },
      { key: 'createDate', title: $t('page.dataManage.common.createTime'), visible: true, width: 170, align: 'center', sortable: false }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-ship-weight-rule'
```

formModel 类型 `Partial<Api.DataManageShip.WeightRule>`，emptyForm：

```ts
function emptyForm(): Partial<Api.DataManageShip.WeightRule> {
  return {
    name: '',
    calcMode: 0,
    mode: 0,
    weightOff: undefined,
    cubicNum: undefined,
    order: 0,
    note: '',
    carryList: []
  };
}
```

formItems（无 carryList 项；select 均显式 `filterable: false`）：

```ts
const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.ship.weightRule.title'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入规则名称'
  },
  {
    key: 'calcMode',
    label: $t('page.dataManage.ship.weightRule.calcMode'),
    type: 'select',
    required: true,
    span: 12,
    options: calcModeOptions.value,
    filterable: false
  },
  {
    key: 'mode',
    label: $t('page.dataManage.ship.weightRule.mode'),
    type: 'select',
    span: 12,
    options: modeOptions.value,
    filterable: false
  },
  { key: 'weightOff', label: $t('page.dataManage.ship.weightRule.weightOff'), type: 'number', span: 12 },
  { key: 'cubicNum', label: $t('page.dataManage.ship.weightRule.cubicNum'), type: 'number', span: 12 },
  { key: 'order', label: $t('page.dataManage.ship.weightRule.order'), type: 'number', span: 12 },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);
```

进位规则组编辑函数：

```ts
function addCarryGroup() {
  if (!formModel.value.carryList) formModel.value.carryList = [];
  formModel.value.carryList.push({ carry: 0, ruleList: [] });
}

function removeCarryGroup(index: number) {
  formModel.value.carryList?.splice(index, 1);
}

function addRule(carryIndex: number) {
  const group = formModel.value.carryList?.[carryIndex];
  if (!group) return;
  if (!group.ruleList) group.ruleList = [];
  group.ruleList.push({ start: undefined, end: undefined, unit: undefined });
}

function removeRule(carryIndex: number, ruleIndex: number) {
  formModel.value.carryList?.[carryIndex]?.ruleList?.splice(ruleIndex, 1);
}
```

openEdit 回填：

```ts
function openEdit(row: Api.DataManageShip.WeightRule) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    name: row.name,
    calcMode: row.calcMode ?? 0,
    mode: row.mode ?? 0,
    weightOff: row.weightOff,
    cubicNum: row.cubicNum,
    order: row.order ?? 0,
    note: row.note ?? '',
    carryList: (row.carryList ?? []).map(group => ({
      carry: group.carry,
      ruleList: (group.ruleList ?? []).map(rule => ({ start: rule.start, end: rule.end, unit: rule.unit }))
    }))
  };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
```

模板：搜索栏、操作列、批量删除、抽屉骨架同 Task 6（无 status 相关）；额外列插槽与进位规则区块：

```vue
<template #calcMode="{ row }">
  <span>{{ calcModeLabel(row.calcMode) }}</span>
</template>
<template #mode="{ row }">
  <span>{{ modeLabel(row.mode) }}</span>
</template>
<template #createDate="{ row }">
  <span>{{ formatDateTime(row.createDate) }}</span>
</template>
```

Drawer 内（NFormWrap 之后、Drawer 闭合前）：

```vue
      <div class="mt-16px">
        <div class="mb-8px font-bold">{{ $t('page.dataManage.ship.weightRule.carry') }}</div>
        <div
          v-for="(carry, ci) in formModel.carryList"
          :key="ci"
          class="mb-12px border border-[var(--n-border-color)] rd-4px p-12px"
        >
          <div class="mb-8px flex items-center gap-8px">
            <NSelect v-model:value="carry.carry" :options="carryOptions" class="min-w-240px" />
            <NButton quaternary type="error" size="small" @click="removeCarryGroup(ci)">
              {{ $t('page.dataManage.ship.weightRule.removeCarryGroup') }}
            </NButton>
          </div>
          <div v-for="(rule, ri) in carry.ruleList" :key="ri" class="mb-8px flex items-center gap-8px">
            <NInputNumber v-model:value="rule.start" class="w-150px!" :placeholder="$t('page.dataManage.ship.weightRule.start')" />
            <NInputNumber v-model:value="rule.end" class="w-150px!" :placeholder="$t('page.dataManage.ship.weightRule.end')" />
            <NInputNumber v-model:value="rule.unit" class="w-150px!" :placeholder="$t('page.dataManage.ship.weightRule.unit')" />
            <NButton quaternary type="error" size="small" @click="removeRule(ci, ri)">
              {{ $t('page.dataManage.ship.weightRule.removeRule') }}
            </NButton>
          </div>
          <NButton dashed size="small" @click="addRule(ci)">
            {{ $t('page.dataManage.ship.weightRule.addRule') }}
          </NButton>
        </div>
        <NButton dashed size="small" @click="addCarryGroup">
          {{ $t('page.dataManage.ship.weightRule.addCarryGroup') }}
        </NButton>
      </div>
```

- [ ] **Step 2: typecheck + lint**

运行：`pnpm typecheck`；`pnpm lint`。Expected: 0 error。

---

### Task 8: 承运网络 tab `Carrier.vue`（含计泡规则下拉联动）

**Files:**

- Create: `d:\LINFLY\CWMS\user-admin-web\src\views\data-manage\ship\modules\carrier\Carrier.vue`

**Interfaces:**

- Consumes: carrier 4 函数 + `fetchGetWeightRuleList`（Task 3）；i18n `page.dataManage.ship.carrier.*`。
- Produces: 独立组件。**要点：挂载时拉计泡规则全量（size 500）供列表名称映射与表单下拉；trackConfigId/remoteGroupId 保留在 openEdit 回填但不渲染任何控件。**

- [ ] **Step 1: 写入组件**

骨架同 Task 6；差异片段：

```ts
import { computed, onMounted, ref } from 'vue';
// ...同 Task 6 imports（换 carrier 函数 + fetchGetWeightRuleList）

/** 计泡规则全量缓存：列表名称映射 + 表单下拉共用 */
const weightRuleOptions = ref<{ label: string; value: string }[]>([]);

async function loadWeightRuleOptions() {
  const { data: res, error } = await fetchGetWeightRuleList({ page: 1, size: 500, where: {} });
  if (error || !res) return;
  weightRuleOptions.value = res.list.map(item => ({ label: item.name, value: item._id }));
}

onMounted(() => {
  loadWeightRuleOptions();
});

/** 列表列展示计泡规则名称 */
function weightRuleLabel(id?: string) {
  return weightRuleOptions.value.find(item => item.value === id)?.label ?? '--';
}
```

columns：

```ts
  columns: () =>
    [
      { key: 'name', title: $t('page.dataManage.ship.carrier.name'), type: 'detail', visible: true, minWidth: 140, sortable: false },
      { key: 'weightRuleId', title: $t('page.dataManage.ship.carrier.weightRule'), visible: true, minWidth: 140, sortable: false },
      { key: 'oilRate', title: $t('page.dataManage.ship.carrier.oilRate'), visible: true, width: 100, align: 'right', sortable: false },
      { key: 'feeCustom', title: $t('page.dataManage.ship.carrier.feeCustom'), visible: true, width: 100, align: 'right', sortable: false },
      { key: 'cubicNum', title: $t('page.dataManage.ship.carrier.cubicNum'), visible: true, width: 100, align: 'right', sortable: false },
      { key: 'weightOff', title: $t('page.dataManage.ship.carrier.weightOff'), visible: true, width: 100, align: 'right', sortable: false },
      { key: 'order', title: $t('page.dataManage.ship.carrier.order'), visible: true, width: 90, align: 'center', sortable: false },
      { key: 'createDate', title: $t('page.dataManage.common.createTime'), visible: true, width: 170, align: 'center', sortable: false }
    ] as VxeColumnConfig[],
  cacheKey: 'data-manage-ship-carrier'
```

formItems：

```ts
const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.dataManage.ship.carrier.name'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入网络名称'
  },
  {
    key: 'weightRuleId',
    label: $t('page.dataManage.ship.carrier.weightRule'),
    type: 'select',
    span: 12,
    options: weightRuleOptions.value,
    clearable: true,
    filterable: false
  },
  { key: 'order', label: $t('page.dataManage.ship.carrier.order'), type: 'number', span: 12 },
  { key: 'oilRate', label: $t('page.dataManage.ship.carrier.oilRate'), type: 'number', span: 12 },
  { key: 'feeCustom', label: $t('page.dataManage.ship.carrier.feeCustom'), type: 'number', span: 12 },
  { key: 'cubicNum', label: $t('page.dataManage.ship.carrier.cubicNum'), type: 'number', span: 12 },
  { key: 'weightOff', label: $t('page.dataManage.ship.carrier.weightOff'), type: 'number', span: 12 },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 24 }
]);
```

emptyForm / openEdit（trackConfigId/remoteGroupId 原样带回、不渲染控件）：

```ts
function emptyForm(): Partial<Api.DataManageShip.Carrier> {
  return {
    name: '',
    weightRuleId: undefined,
    trackConfigId: undefined,
    remoteGroupId: undefined,
    oilRate: undefined,
    feeCustom: undefined,
    cubicNum: undefined,
    weightOff: undefined,
    order: 0,
    note: ''
  };
}

function openEdit(row: Api.DataManageShip.Carrier) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    name: row.name,
    weightRuleId: row.weightRuleId,
    trackConfigId: row.trackConfigId,
    remoteGroupId: row.remoteGroupId,
    oilRate: row.oilRate,
    feeCustom: row.feeCustom,
    cubicNum: row.cubicNum,
    weightOff: row.weightOff,
    order: row.order ?? 0,
    note: row.note ?? ''
  };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}
```

模板插槽：

```vue
<template #weightRuleId="{ row }">
  <span>{{ weightRuleLabel(row.weightRuleId) }}</span>
</template>
<template #createDate="{ row }">
  <span>{{ formatDateTime(row.createDate) }}</span>
</template>
```

- [ ] **Step 2: typecheck + lint**

运行：`pnpm typecheck`；`pnpm lint`。Expected: 0 error。

---

### Task 9: 壳 `data-manage/ship/index.vue` + 重生成路由

**Files:**

- Create: `d:\LINFLY\CWMS\user-admin-web\src\views\data-manage\ship\index.vue`
- Auto-gen: `src/router/elegant/routes.ts` / `imports.ts` / `transform.ts`（pnpm dev 触发，禁止手改）

**Interfaces:**

- Consumes: Task 5-8 的 4 个组件默认导出路径；`ArchiveTabItem`（`@/views/data-manage/components/types`）。
- Produces: 路由名 `data-manage_ship`（elegant 扫描 `src/views` 下 `**/index.vue` 生成）。

- [ ] **Step 1: 写入壳（照 basic/index.vue 模式，顶层无 HTML 注释）**

```vue
<script setup lang="ts">
import { computed, defineAsyncComponent, h, ref, type Component } from 'vue';
import { NSpin } from 'naive-ui';
import { $t } from '@/locales';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
import type { ArchiveTabItem } from '@/views/data-manage/components/types';

/** 发货资料四项（懒加载子页）：左侧竖向 tab 与右侧内容均由它驱动 */
const items: ArchiveTabItem[] = [
  {
    key: 'provider',
    labelKey: 'page.dataManage.ship.provider.title',
    load: () => import('@/views/data-manage/ship/modules/provider/Provider.vue')
  },
  {
    key: 'channelGroup',
    labelKey: 'page.dataManage.ship.channelGroup.title',
    load: () => import('@/views/data-manage/ship/modules/channel-group/ChannelGroup.vue')
  },
  {
    key: 'weightRule',
    labelKey: 'page.dataManage.ship.weightRule.title',
    load: () => import('@/views/data-manage/ship/modules/weight-rule/WeightRule.vue')
  },
  {
    key: 'carrier',
    labelKey: 'page.dataManage.ship.carrier.title',
    load: () => import('@/views/data-manage/ship/modules/carrier/Carrier.vue')
  }
];

/** 左侧竖向 tab（labelKey → 当前语言文案） */
const tabs = items.map(item => ({ value: item.key, label: $t(item.labelKey) }));

/** 分包加载中的占位 */
const loadingComponent: Component = () =>
  h('div', { class: 'flex h-full w-full items-center justify-center' }, [h(NSpin)]);

/** 每个资料项一个异步组件：key 不同即组件不同，切 tab 时自动重建并重新取数 */
const asyncComps: Record<string, Component> = {};
for (const item of items) {
  asyncComps[item.key] = defineAsyncComponent({ loader: item.load, loadingComponent });
}

const activeKey = ref(items[0]?.key ?? '');
const activeComponent = computed(() => asyncComps[activeKey.value]);
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.data-manage_ship')">
    <component :is="activeComponent" :key="activeKey" class="h-full w-full" />
  </VerticalTabLayout>
</template>
```

- [ ] **Step 2: pnpm dev 触发 elegant 重生成路由**

运行：先删缓存 `Remove-Item -Recurse -Force node_modules/.vite-temp`，再后台起 `pnpm dev`，待 `src/router/elegant/routes.ts` 出现 `'data-manage_ship'` 条目后停掉 dev（**不要 Stop-Process 中途强杀**，等输出稳定再 Ctrl+C，防 routes.ts 截断）。

- [ ] **Step 3: typecheck**（此时 route key `data-manage_ship` 已生成，`route.data-manage_ship` i18n key 由 Task 4 提供）

运行：`pnpm typecheck`。Expected: 通过。

---

### Task 10: 路由 meta、贴边页、菜单权限

**Files:**

- Modify: `d:\LINFLY\CWMS\user-admin-web\build\plugins\router.ts`（routeIcons + routeOrders 两处）
- Modify: `d:\LINFLY\CWMS\user-admin-web\src\layouts\base-layout\index.vue:26-40`（contentShowPadding 数组）
- Modify: `d:\LINFLY\CWMS\user-admin-web\src\constants\menu-permissions.ts`（`const dataShip = op('dataShip');` + 资料管理 children 追加条目）

**Interfaces:**

- Consumes: Task 9 生成的 `data-manage_ship` RouteKey。

- [ ] **Step 1: router.ts routeIcons**（`'data-manage_no-rule'` 行后加）：

```ts
        'data-manage_ship': 'ic:baseline-local-shipping',
```

- [ ] **Step 2: router.ts routeOrders**（`'data-manage_no-rule': 4,` 行后加）：

```ts
        'data-manage_ship': 5,
```

- [ ] **Step 3: base-layout/index.vue**：`'data-manage_no-rule',` 后加 `'data-manage_ship',`，并把该数组上方注释里「资料管理四个页面」改为「资料管理五个页面」。

- [ ] **Step 4: menu-permissions.ts**：`const dataNoRule = op('dataNoRule');` 后加 `const dataShip = op('dataShip');`；资料管理 children 中单号资料条目（`subMenus: sub('dataNoRule', [['noRule', '单号规则']])` 所在对象）之后追加：

```ts
      {
        name: '发货资料',
        icon: 'ic:baseline-local-shipping',
        routePath: '/data-manage/ship',
        buttons: [
          dataShip.query,
          dataShip.reset,
          dataShip.add,
          dataShip.edit,
          dataShip.delete,
          dataShip.export,
          dataShip.import
        ],
        subMenus: sub('dataShip', [
          ['provider', '服务商'],
          ['channelGroup', '渠道类别'],
          ['weightRule', '计泡规则'],
          ['carrier', '承运网络']
        ])
      }
```

- [ ] **Step 5: typecheck + lint**

运行：`pnpm typecheck`；`pnpm lint`。Expected: 0 error。

---

### Task 11: 全量验证 + changelog 补实施记录

- [ ] **Step 1: 构建验证**

运行：`pnpm typecheck` → `pnpm lint` → `pnpm fmt` → `pnpm build`。Expected: 全部通过。

- [ ] **Step 2: 浏览器走查（pnpm dev + tms-user 在线）**

验收点：

1. 侧栏「资料管理」出现第 5 项「发货资料」（图标 `ic:baseline-local-shipping`），页面贴边（content 无 16px padding）。
2. 默认服务商 tab：顶部 NRadioGroup 发货/派送/提单切换列表重查（Network 面板 `/provider/query` body `where.providerType` 变化）；新增 → 列表出现；编辑回填；行删/勾选批量删逐条 DELETE；name/code 重复时后端错误信息弹出。
3. 渠道类别 tab：列表/新增（name 必填、nameEn/order/note）/编辑/删除正常；无状态列。
4. 计泡规则 tab：calcMode 下拉（按公斤/按方）保存后列表列回显；进位规则组可加组/加区间/删行，编辑回显一致。
5. 承运网络 tab：列表「关联计泡规则」显示名称而非 id；表单下拉可选；保存后编辑回填（含不展示的 trackConfigId/remoteGroupId 不丢）。
6. 4 个 tab 切换重建、各自列配置持久化（cacheKey 独立）；console 0 error。

- [ ] **Step 3: changelog 补实施与验证记录**

在 `changelog/发货资料.md` 的「状态」小节前追加「实施」小节（改动文件清单 + 验证结果 + 走查偏差），并在 `AGENTS_CHANGELOG.md` 对应条目末尾补充实施结论。同时更新 working memory 日报。
