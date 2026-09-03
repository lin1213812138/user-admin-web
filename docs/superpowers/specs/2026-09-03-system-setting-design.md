# 系统设置（System Settings）设计方案

> 日期：2026-09-03
> 状态：已确认（含左右布局统一骨架 + 运单号规则表格），待进入实现计划

## 1. 背景与目标

后端 `wms-user` 的「系统设置」模块在兄弟项目 `user-web`（`src/views/systemSettings/basic`）里是用 `n-tabs` 把多个子模块做横向切换的单页方案。本仓库（`user-admin-web`，Naive UI + TS 重写版）目前 `src/views/system-manage/setting/` 目录为空，需要补齐。

本次目标：搭建「系统设置」单页，内部用 7 个 Tab 切换子模块。**除「运单号规则」外，其余 6 个 Tab 均为左右布局（左列列表 + 右列基础信息表单 + 字段映射区）**，其中「录单格式」填真实字段、其余 5 个用示例字段占位后续迭代；「运单号规则」是整页表格。

## 2. 范围

| Tab          | 类型     | 内容                                  |
| ------------ | -------- | ------------------------------------- |
| 录单格式     | 左右布局 | 真实示例字段（对齐截图）              |
| 打印格式     | 左右布局 | 统一骨架 + 示例字段占位               |
| 导出格式     | 左右布局 | 统一骨架 + 示例字段占位               |
| 运单号规则   | 整页表格 | 通用 Table + useVxeTable（mock 列表） |
| 通知配置     | 左右布局 | 统一骨架 + 示例字段占位               |
| 初始化数据   | 左右布局 | 统一骨架 + 示例字段占位               |
| 站点扫描配置 | 左右布局 | 统一骨架 + 示例字段占位               |

## 3. 架构决策

| 决策点         | 结论                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 整体架构       | 单页 + 7 Tabs（对齐 user-web），不是 7 个独立菜单                                                                      |
| 子模块文件组织 | 每个 Tab 占独立目录 `setting/<name>/index.vue`                                                                         |
| 路由方式       | 每 Tab 目录自动注册为 `system-manage_setting_<name>` 子路由，全部 `hideInMenu`                                         |
| Tab 切换机制   | 父页 `NTabs` 切换时 `router.push` 到对应子路由，父页用 `<router-view>` 渲染                                            |
| 左右布局复用   | 抽 `setting/components/MasterDetail.vue`（左右骨架）+ `setting/components/FieldMapping.vue`（字段映射区），各 Tab 复用 |
| 运单号规则     | 普通整页表格，使用本仓库通用 `Table` + `useVxeTable`，不进左右布局                                                     |

> 说明：elegant-router 默认递归扫描 `src/views/**/index.vue` 自动注册路由，因此 `setting/<name>/index.vue` 会被扫成 7 条子路由。用 `customRoutes` 给它们加 `hideInMenu: true` 即可让菜单只显示父「系统设置」一项，路由本身保留（支持深链接、刷新保持 Tab）。`setting/components/*.vue` 不叫 `index.vue`，不会被扫成路由。

## 4. 目录结构

```
src/views/system-manage/setting/
├── index.vue                       # 父页：NTabs 容器 + <router-view>
├── components/                     # 私有共享组件（非 index.vue，不进路由）
│   ├── MasterDetail.vue            # 左右布局骨架：左列列表 + 右列容器（含操作行）
│   └── FieldMapping.vue           # 字段映射区：导航菜单 + 已选字段复选框
├── input-format/index.vue          # 录单格式（左右布局，真实字段）
├── print-format/index.vue          # 打印格式（左右布局，示例字段）
├── export-format/index.vue         # 导出格式（左右布局，示例字段）
├── waybill-rule/index.vue          # 运单号规则（整页表格）
├── notification-config/index.vue   # 通知配置（左右布局，示例字段）
├── init-data/index.vue             # 初始化数据（左右布局，示例字段）
└── station-scan/index.vue          # 站点扫描配置（左右布局，示例字段）
```

## 5. 路由与菜单

### 5.1 自动生成

新建上述 `index.vue` 后跑 `pnpm gen-route`，elegant-router 自动生成：

- `system-manage_setting`（父，component = `setting/index.vue`）
- `system-manage_setting_input-format` / `_print-format` / `_export-format` / `_waybill-rule` / `_notification-config` / `_init-data` / `_station-scan`（共 7 条子路由）

### 5.2 customRoutes 覆盖

在 `src/router/routes/index.ts` 的 `customRoutes` 数组里按 name 合并：

```ts
{
  name: 'system-manage_setting',
  meta: {
    icon: 'ic:baseline-settings-applications',
    order: 3,
    redirect: 'system-manage_setting_input-format'
  }
},
{
  name: 'system-manage_setting_input-format',
  meta: { hideInMenu: true }
},
{
  name: 'system-manage_setting_print-format',
  meta: { hideInMenu: true }
},
{
  name: 'system-manage_setting_export-format',
  meta: { hideInMenu: true }
},
{
  name: 'system-manage_setting_waybill-rule',
  meta: { hideInMenu: true }
},
{
  name: 'system-manage_setting_notification-config',
  meta: { hideInMenu: true }
},
{
  name: 'system-manage_setting_init-data',
  meta: { hideInMenu: true }
},
{
  name: 'system-manage_setting_station-scan',
  meta: { hideInMenu: true }
}
```

> `redirect` 用路由 name 字符串（elegant-router 支持 name 重定向）。若不生效，则在父页 `onMounted` 里 `router.replace({ name: 'system-manage_setting_input-format' })` 兜底。

## 6. 父页 `setting/index.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { $t } from '@/locales';

const router = useRouter();
const route = useRoute();

const tabs = [
  { key: 'input-format', label: $t('page.system-manage.setting.inputFormat') },
  { key: 'print-format', label: $t('page.system-manage.setting.printFormat') },
  { key: 'export-format', label: $t('page.system-manage.setting.exportFormat') },
  { key: 'waybill-rule', label: $t('page.system-manage.setting.waybillRule') },
  { key: 'notification-config', label: $t('page.system-manage.setting.notificationConfig') },
  { key: 'init-data', label: $t('page.system-manage.setting.initData') },
  { key: 'station-scan', label: $t('page.system-manage.setting.stationScan') }
];

const activeTab = computed(() => {
  const seg = route.name?.toString().replace('system-manage_setting_', '');
  return seg && tabs.some(t => t.key === seg) ? seg : tabs[0].key;
});

function handleTabChange(key: string) {
  router.push({ name: `system-manage_setting_${key}` as never });
}
</script>

<template>
  <div class="h-full w-full flex-col p-16px">
    <NTabs :value="activeTab" type="line" @update:value="handleTabChange">
      <NTabPane v-for="t in tabs" :key="t.key" :name="t.key" :tab="t.label" />
    </NTabs>
    <div class="min-h-0 flex-1">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>
```

## 7. 共享组件

### 7.1 `setting/components/MasterDetail.vue`（左右骨架）

- 外层 `class="h-full w-full flex overflow-hidden"`（内容区 `overflow-hidden` 配合 fade 动画，避免溢出滚动条）。
- **左列（width: 240px）**：`NCard`，标题 slot `list-title`；内部 `NInput` 搜索框（placeholder 由 prop 传入）+ 单列列表。
  - 列表项：`{ id, name, status }`，渲染 `{name} · {启用/禁用}`；active 项用主色高亮（参考 user-web `.menu__item-click` 视觉）。
  - 点击项 → `emit('update:selectedId', id)`。
- **右列（flex: 1，min-w-0）**：
  1. 操作行（`flex justify-between`）：左侧按钮 `+ 新建` / `编辑` / `删除`（通过 props `editable` 控制是否显示；未选中时 `编辑`/`删除` 置灰）；右侧默认空 slot `operation-extra`。
  2. 默认插槽 `#default`：右列详细内容（各 Tab 放入 `FormWrap` 基础信息表单 + `FieldMapping` 字段映射区）。
- Props：
  - `listTitle: string`
  - `searchPlaceholder: string`
  - `items: { id: number; name: string; status: Api.Common.EnableStatus }[]`
  - `selectedId: number | null`（v-model）
  - `editable?: boolean`（默认 true）
- Emits：`update:selectedId`、`create`、`edit`、`delete`、`save`、`cancel`（具体按钮事件由各 Tab 监听，组件只负责触发）。

### 7.2 `setting/components/FieldMapping.vue`（字段映射区）

- Props：
  - `navGroups: { key: string; title: string; fields: string[] }[]`（导航菜单分组，如运单信息/收件人信息/...）
  - `modelValue: Record<string, string[]>`（各分组下已选字段，v-model）
- 结构：左列「导航菜单」分组标题列表，右列 `NGrid` + `NCheckbox` 展示每个分组的 `fields`，勾选写入 `modelValue[groupKey]`。
- 视觉：左列固定宽（如 160px），右列 `flex-1`；分组之间用 `NDivider` 或间距分隔。

## 8. 「录单格式」Tab（左右布局，真实字段）

文件：`setting/input-format/index.vue`。

### 8.1 数据模型（mock，内存态，不调接口）

```ts
interface InputFormatItem {
  id: number;
  name: string;
  status: Api.Common.EnableStatus; // '1' 启用 / '0' 禁用
  scope: ('internal' | 'customer' | 'wechat')[]; // 适用范围
  remark: string;
  fields: Record<NavMenuKey, string[]>; // 各导航菜单下已选字段
}
```

初始 mock（2 条，对齐截图）：

```ts
const formats = ref<InputFormatItem[]>([
  {
    id: 1,
    name: '代发录单',
    status: '1',
    scope: ['internal', 'customer', 'wechat'],
    remark: '',
    fields: {
      waybill: ['业务备注', '内部备注'],
      receiver: [],
      sender: [],
      goods: ['小计金额', '净重', '货物件数', '长', '宽'],
      subItem: ['单件材积', '计费重']
    }
  },
  {
    id: 2,
    name: '专线录单',
    status: '1',
    scope: ['internal', 'customer'],
    remark: '',
    fields: {
      waybill: ['业务备注'],
      receiver: ['收件人姓名'],
      sender: [],
      goods: ['净重', '货物件数'],
      subItem: []
    }
  }
]);
```

### 8.2 布局与交互

- 使用 `MasterDetail` 组件：`listTitle="录单格式列表"`、`searchPlaceholder="搜索列表"`、`:items="formats"`、`v-model:selectedId`。
- 右列插槽内容：
  1. `FormWrap`（`src/components/Form/index.vue`）基础信息：格式名称(input,required) / 状态(switch) / 适用范围(checkbox-group: 内部系统/客户下单/微信下单) / 备注说明(input)。
  2. `FieldMapping` 字段映射区：`navGroups` 为 5 组（运单/收件人/发件人/物品/子件信息），`v-model` 绑定当前选中项的 `fields`。
- 交互：`selectedId` 默认第一条；`新建` → 清空右栏、置 `selectedId=null`、进编辑态；`编辑` → 右栏可编辑、按钮变 `保存`/`取消`；`保存` 写回 `formats`；`取消` 恢复；`删除` 移除列表项并回退选中。全部改动仅存内存 `ref`，不调接口。

## 9. 其余 5 个「左右布局」Tab（统一骨架 + 示例字段）

文件：`setting/{print-format,export-format,notification-config,init-data,station-scan}/index.vue`。

- 每个 Tab 复用 `MasterDetail` + `FieldMapping`，结构与录单格式一致。
- **左列列表项含义各 Tab 不同**（示例数据 2~3 条）：打印格式列表 / 导出格式列表 / 通知配置列表 / 初始化数据列表 / 站点扫描配置列表。
- **右列基础信息表单与字段映射区用示例字段占位**（如「格式名称 / 状态 / 备注」+ 通用导航菜单分组与示例字段复选框）。后续迭代时按真实业务替换字段，父页与路由结构不动。
- 交互逻辑与录单格式一致（新建/编辑/删除/保存/取消，内存态）。

## 10. 「运单号规则」Tab（整页表格）

文件：`setting/waybill-rule/index.vue`。**不做左右布局，直接整页表格。**

- 使用本仓库通用 `Table` + `useVxeTable`（严格遵循 AGENTS.md「禁止绕过 useVxeTable 自行封装表格」）。
- mock 列表数据（示例列）：规则名称、前缀、起始值、步长、当前序号、状态（启用/禁用）、创建时间。
- 列配置示例：`useVxeTable` 的 `columns` 提供 `name`(detail) / `prefix` / `startValue` / `step` / `currentNo` / `status`(status 类型) / `createTime`，`cacheKey: 'system-manage-setting-waybill-rule'`。
- 操作区：新增 / 刷新 / 列设置（与 `user/index.vue` 同款按钮），编辑/删除走 `action` 插槽（mock 直接改内存，不调接口）。
- 搜索栏（可选）：复用 `SearchBar` 或 `<Table>` 的 `searchItems`，按「规则名称 / 状态」过滤 mock 数据。

## 11. i18n 补充（zh-cn.ts / en-us.ts 同步）

### 11.1 route 命名空间（TS 类型要求，menu 隐藏但 key 需存在）

```ts
'system-manage_setting': '系统设置',                  // System Settings
'system-manage_setting_input-format': '录单格式',     // Input Format
'system-manage_setting_print-format': '打印格式',     // Print Format
'system-manage_setting_export-format': '导出格式',    // Export Format
'system-manage_setting_waybill-rule': '运单号规则',   // Waybill Rule
'system-manage_setting_notification-config': '通知配置', // Notification Config
'system-manage_setting_init-data': '初始化数据',      // Init Data
'system-manage_setting_station-scan': '站点扫描配置'  // Station Scan Config
```

### 11.2 page 命名空间（Tab 文案）

```ts
page: {
  system-manage: {
    setting: {
      inputFormat: '录单格式',
      printFormat: '打印格式',
      exportFormat: '导出格式',
      waybillRule: '运单号规则',
      notificationConfig: '通知配置',
      initData: '初始化数据',
      stationScan: '站点扫描配置'
    }
  }
}
```

### 11.3 common 命名空间

```ts
common: {
  devInProgress: '待开发'; // In Progress
}
```

> 各 Tab 右列示例字段（如「格式名称/状态/适用范围/备注」）复用现有 `page.manage.*` 或 `common.*` 文案，不额外新增 key；若需新增专用文案，按「zh-cn / en-us / App.I18n.Schema 三处同步」补。

## 12. 后续迭代路径

- 框架、路由、i18n、共享组件就绪后，每个 Tab 在各自 `setting/<name>/index.vue` 目录内替换示例字段为真实业务字段，父页与路由结构不动。
- 「打印格式 / 导出格式」真实功能可复用本仓库通用 `Table` + `useVxeTable`（若后续改为表格形态），不要搬 user-web 的 NTable。

## 13. 验收手段

- `pnpm gen-route` 后检查 `src/router/elegant/routes.ts` 出现 7 条 `system-manage_setting_*` 路由。
- `pnpm typecheck` 通过（i18n key 三处同步）。
- `pnpm dev` 启动后：菜单只出现「系统设置」一项；进入后默认显示「录单格式」Tab；7 个 Tab 均可切换；录单格式左右布局、新建/编辑/删除交互符合预期；其余 5 个 Tab 为左右布局示例骨架；运单号规则为整页表格；其余 Tab 显示示例字段。
- `pnpm lint && pnpm fmt` 通过。
