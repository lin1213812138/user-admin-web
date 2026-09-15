# Spec：轨迹抓取配置页重构（合并「操作轨迹」）

> 状态：待批准（design 已与用户确认，默认假设已确认）
> 关联：系统设置页 `system-manage/setting`
> 日期：2026-09-15

## 1. 背景与目标

系统设置页当前 `轨迹抓取配置` 与 `操作轨迹配置` 是两个**并列的顶层 tab**，且各自仍是占位态
（`MasterDetail` 简单列表 + `LookForward`）。根据产品截图，`轨迹抓取配置` 应是一个**带顶部子 tab
的全宽表格页**：

- 子 tab 共 5 个：`追踪网络` / `轨迹改造` / `轨迹关键词` / `抓取时间` / `操作轨迹`
- 前 4 个子 tab **同构**（7 列：序号、名称、服务器地址、系统类型、最后编辑、编辑时间、操作）
- `操作轨迹` 子 tab 独立结构（7 列：序号、操作节点、时间格式、服务地点、详细描述、是否发布、操作）
- 顶部「新增」按钮、行内「编辑」抽屉

**目标**：把 `操作轨迹` 从顶层 tab 合并进 `轨迹抓取配置` 作为第 5 个子 tab，并用通用表格
（`useVxeTable` + `Table` + `NFormWrap` 抽屉）替换当前占位实现，对齐仓库既有
`init-data` / `print-format` 模块模式。

## 2. 用户场景

- 管理员进入「系统设置 → 轨迹抓取配置」，顶部看到 5 个子 tab，默认停留在「追踪网络」。
- 切换子 tab，下方全宽表格展示对应数据（前 4 个同构，操作轨迹结构不同）。
- 点「新增」弹抽屉，填写表单后保存（DEV 走本地 mock，落库到对应子 tab 分类）。
- 点某行「编辑」弹抽屉并回填，保存后刷新表格。
- 列设置（列显隐/排序）沿用 `TableColumnConfig`，按组件 `cacheKey` 缓存到 localStorage。

## 3. 范围

### In scope

- 移除 `setting/index.vue` 的 `operation-trace` 顶层 tab 及其 `componentMap` 入口。
- 重构 `trace-capture/TraceCapture.vue` 为「子 tab 壳 + 全宽表格」。
- 新增前 4 个同构子 tab 的通用表格 + 抽屉（`TraceConfigTable.vue` / `TraceConfigDrawer.vue`）。
- 新增 `操作轨迹` 子 tab 的表格 + 抽屉（`OperationTraceTable.vue` / `OperationTraceDrawer.vue`）。
- 删除不再被引用的 `modules/operation-trace/` 目录。
- 在 `service/api/system-manage.ts` 新增 DEV mock 函数；在 `typings/api/system-manage.d.ts`
  新增类型；在 `locales` 中扩展 `traceCapture` 为对象（子 tab / 列名 / 表单文案），移除 `operationTrace` 顶层 key。

### Out of scope

- 不接真实后端接口（仅 DEV mock，按 `import.meta.env.DEV` 分支）。
- 不加「删除」功能（截图操作列仅有「编辑」）。如需删除，后续单独追加。
- 不改动其余 5 个顶层 tab（input-format / print-format / export-format / waybill-rule / init-data）。
- 不改动 `MasterDetail` 组件本身（仅本模块不再使用它）。

## 4. 功能需求

- FR-1：顶部子 tab 切换，5 个 tab 名称来自 i18n。
- FR-2：前 4 个 tab 同构 7 列，第一列「名称」标题随当前 tab 名动态变化
  （追踪网络 / 轨迹改造 / 轨迹关键词 / 抓取时间）。
- FR-3：操作轨迹 tab 7 列，含「是否发布」开关展示列。
- FR-4：表格支持分页、序号列、列设置（显隐/缓存）、刷新。
- FR-5：新增 / 编辑共用抽屉表单；编辑回填、新增清空；保存后刷新当前 tab 数据。
- FR-6：DEV 环境下数据来自本地 mock，按子 tab 分类隔离。

## 5. 非功能需求

- NF-1：沿用仓库既有 `useVxeTable` + `Table` + `NFormWrap`（Drawer）模式，不复造轮子。
- NF-2：列配置 `cacheKey` 按子 tab 区分，避免串 tab 缓存。
- NF-3：i18n 中英文同步；不遗留未翻译 key。

## 6. 设计方案

### 6.1 UI 布局（TraceCapture.vue）

```
NCard(NTabs 子 tab: 追踪网络/轨迹改造/轨迹关键词/抓取时间/操作轨迹)
  └─ 当前子 tab 对应表格组件（v-if 或 <component :is>）
        ├─ 顶部「新增」按钮（operation-left slot）
        ├─ Table（序号/分页/列设置/刷新）
        └─ 抽屉（NFormWrap 表单）
```

### 6.2 组件结构（新增/改动）

- `modules/trace-capture/TraceCapture.vue`：**重构**为子 tab 壳，管理 `activeSubTab`，
  渲染 `TraceConfigTable` 或 `OperationTraceTable`。
- `modules/trace-capture/TraceConfigTable.vue`：**新增**，前 4 个同构 tab 的通用表格
  （props: `category: TraceCaptureCategory`），内含 `useVxeTable` + `Table` + 抽屉触发。
- `modules/trace-capture/TraceConfigDrawer.vue`：**新增**，前 4 个 tab 的抽屉表单
  （字段：名称、服务器地址、系统类型）。
- `modules/trace-capture/OperationTraceTable.vue`：**新增**，操作轨迹表格
  （7 列，含「是否发布」开关）。
- `modules/trace-capture/OperationTraceDrawer.vue`：**新增**，操作轨迹抽屉表单
  （字段：操作节点、时间格式、服务地点、详细描述、是否发布）。
- `modules/operation-trace/`：**删除**（不再被引用）。

### 6.3 数据模型（typings/api/system-manage.d.ts，命名空间 `Api.SystemManage`）

```ts
/** 轨迹抓取 - 前 4 个同构子 tab 分类 */
type TraceCaptureCategory = 'track-network' | 'track-transform' | 'track-keyword' | 'capture-time';

interface TraceConfigItem {
  id: number;
  category: Api.SystemManage.TraceCaptureCategory;
  name: string; // 名称（标题随子 tab 动态）
  serverAddress: string; // 服务器地址
  systemType: string; // 系统类型
  lastEditor: string; // 最后编辑
  editTime: string; // 编辑时间
}

type TraceConfigList = Api.Common.PaginatingQueryRecord<TraceConfigItem>;
type TraceConfigSearchParams = Api.Common.CommonSearchParams & { category: TraceCaptureCategory };
type TraceConfigCreateParams = {
  category: TraceCaptureCategory;
  name: string;
  serverAddress: string;
  systemType: string;
};
type TraceConfigUpdateParams = TraceConfigCreateParams & { id: number };

interface OperationTraceItem {
  id: number;
  node: string; // 操作节点
  timeFormat: string; // 时间格式
  location: string; // 服务地点
  description: string; // 详细描述
  published: Api.Common.EnableStatus; // 是否发布
}
type OperationTraceList = Api.Common.PaginatingQueryRecord<OperationTraceItem>;
type OperationTraceSearchParams = Api.Common.CommonSearchParams;
type OperationTraceCreateParams = Omit<OperationTraceItem, 'id'>;
type OperationTraceUpdateParams = OperationTraceItem;
```

### 6.4 Service / Mock（service/api/system-manage.ts）

新增 DEV 分支函数（与 `fetchGetInitDataList` 等一致）：

- `fetchGetTraceConfigList(params)` / `fetchCreateTraceConfig` / `fetchUpdateTraceConfig`
- `fetchGetOperationTraceList` / `fetchCreateOperationTrace` / `fetchUpdateOperationTrace`
- mock 实现：本地内存数组，按 `category` 过滤（前 4 个），分页返回
  `PaginatingQueryRecord<T>`；create/update 改写内存数组。

### 6.5 i18n（locales/langs/zh-cn.ts & en-us.ts）

将 `page.manage.setting.traceCapture`（当前为字符串 `'轨迹抓取配置'`）**扩展为对象**：

```ts
traceCapture: {
  title: '轨迹抓取配置',
  subTab: {
    trackNetwork: '追踪网络',
    trackTransform: '轨迹改造',
    trackKeyword: '轨迹关键词',
    captureTime: '抓取时间',
    operationTrace: '操作轨迹'
  },
  col: {
    name: '名称', serverAddress: '服务器地址', systemType: '系统类型',
    lastEditor: '最后编辑', editTime: '编辑时间',
    node: '操作节点', timeFormat: '时间格式', location: '服务地点',
    description: '详细描述', published: '是否发布'
  },
  form: { /* 各字段 label / placeholder */ },
  createTitle: '新增', editTitle: '编辑'
}
```

移除 `page.manage.setting.operationTrace` 顶层 key（并入上述结构）。
en-us 同步翻译。

### 6.6 顶层设置（setting/index.vue）

- `tabs` 数组移除 `{ key: 'operation-trace', ... }`。
- `componentMap` 移除 `'operation-trace': OperationTrace` 及对应 import。

## 7. 影响文件清单

1. `src/views/system-manage/setting/index.vue`（移除 operation-trace 顶层 tab）
2. `src/views/system-manage/setting/modules/trace-capture/TraceCapture.vue`（重构为子 tab 壳）
3. `src/views/system-manage/setting/modules/trace-capture/TraceConfigTable.vue`（新增）
4. `src/views/system-manage/setting/modules/trace-capture/TraceConfigDrawer.vue`（新增）
5. `src/views/system-manage/setting/modules/trace-capture/OperationTraceTable.vue`（新增）
6. `src/views/system-manage/setting/modules/trace-capture/OperationTraceDrawer.vue`（新增）
7. `src/views/system-manage/setting/modules/operation-trace/`（删除目录）
8. `src/service/api/system-manage.ts`（新增 DEV mock 函数）
9. `src/typings/api/system-manage.d.ts`（新增类型）
10. `src/locales/langs/zh-cn.ts` / `en-us.ts`（i18n 扩展与清理）

## 8. 已确认假设（默认）

- A1：数据 DEV mock 先行，不接真实后端。
- A2：不实现「删除」，操作列仅「编辑」。
- A3：前 4 个 tab 的「名称」列标题随当前子 tab 名动态显示。

## 9. 验收标准

- 系统设置只剩 6 个顶层 tab，`轨迹抓取配置` 内含 5 个子 tab。
- 5 个子 tab 均渲染为全宽表格，前 4 个同构、操作轨迹独立。
- 新增/编辑抽屉可正常保存并刷新；列设置可缓存。
- `npm run lint` / `vue-tsc` 无新增错误；`operation-trace` 目录已删除且无残留引用。
