# 角色编辑界面：数据权限改多选下拉 + 限制性权限设置区块 — 设计文档

- 日期：2026-09-18
- 作者：Agent（brainstorming 流程，用户已确认方向）
- 关联项目：`user-admin-web`（CWMS Admin，Vue3 + Naive UI + vxe-table）

## 1. 背景与目标

用户提了两张截图：

1. 角色编辑抽屉底部红框圈出两个复选框「仅查看专属客户业务」「仅查看所属组别客户业务」→ **改成下拉**（追问后明确为**多选**）。
2. 老系统的「限制性权限设置」弹窗（出库后禁止修改 / 用户修改密码 / 出库必须称重 / 用户修改个人信息 / 运单列表禁止设置列表字段）→ **配置到角色修改界面**。

用户已拍板：**全部改成下拉，不要使用 switch**。

## 2. 现状与后端事实

### 2.1 前端现状（`src/views/system-manage/role/modules/role-operate-drawer.vue`）

- `dataAuths` 用 `#dataAuths` 具名插槽裸写 `NCheckboxGroup + NCheckbox`，**未走 FormWrap 控件体系**（无法享受详情只读态自动渲染）。
- 已有 4 个 `type: 'switch'` 项（span 12 两列）：`sendOrderCtrl` / `sendCtrl` / `orderColCtrl` / `editInfoCtrl`。
- `model` 为 `Api.SystemManage.RoleCreateParams`；`fillFormByRow()` / `resetForm()` 逐字段赋值/重置。

### 2.2 后端事实（`tms-user/lib/common/models/role.js`，**零改动**）

```js
sendOrderCtrl: Number, // 出库后禁止修改 0-不允许 1-允许
sendCtrl:      Number, // 出库必须称重 0-不启用 1-启用
orderColCtrl:  Number, // 运单列禁止设置列表字段 0-不允许 1-允许
editPwdCtrl:   Number, // 用户修改密码 0-不允许 1-允许
editInfoCtrl:  Number, // 用户修改个人信息 0-不允许 1-允许
```

第二张图的 5 项与这 5 个后端字段**一一对应**，语义与现有 4 个 switch 同源（仅文案口径相反：前端现在用正向描述「出库后允许修改运单」，后端注释是「出库后禁止修改」）。

**唯一缺口**：`editPwdCtrl`（用户修改密码）在前端 `Role` / `RoleCreateParams` 类型、model、回填、重置中**全部缺失**，本轮补齐。

补充事实：`lib/services/role.js:72-92` 用户侧取 `max(map(roleList, 'editPwdCtrl'))`，且 `roleType == 100` 强制 `editPwdCtrl = editInfoCtrl = 1`（后端 ADMIN=100 与前端 roleType=5 不一致，本轮不处理）。

### 2.3 组件能力（`src/components/Form/index.vue`）

- `FormItemConfig` 已有 `multiple?: boolean`，`NSelect` 透传 `:multiple` → **多选下拉零组件改动**。
- `FormItemConfig.type` 已有 `'section'`：占整行、渲染「左侧蓝色竖条 + 15px 粗体标题」、不包 `NFormItem`、不参与校验 → **区块标题零组件改动**。
- `viewText()` 的 `select` 分支已处理数组值（`value.map(...).join('、')`）→ 详情只读态多选下拉自动正确展示。

## 3. 范围与不变项

**改动文件（最小集合）**

| 文件                                                           | 改动                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/views/system-manage/role/modules/role-operate-drawer.vue` | 主要改造（formItems / model / fill / reset / 删插槽）        |
| `src/typings/api/system-manage.d.ts`                           | `Role` 与 `RoleCreateParams` 补 `editPwdCtrl?: RoleCtrl`     |
| `src/locales/langs/zh-cn.ts`                                   | role 段文案调整 + 新增 key                                   |
| `src/locales/langs/en-us.ts`                                   | 同上（英文）                                                 |
| `src/typings/app.d.ts`                                         | i18n Schema 同步（**不同步会 TS2353/TS2345**，本仓既有结论） |

**明确不变**

- 后端（`tms-user`）零改动。
- 公共 `Form` / `FormItemConfig` 组件零改动。
- 角色列表页 `role/index.vue`：`dataAuths` 列已是 `map` 转文案（`dataAuthLabels`），无需改动。
- 路由 / 菜单 / 权限零改动。

## 4. 设计

### 4.1 `dataAuths` → 多选下拉

删除 `#dataAuths` 插槽与 `NCheckboxGroup`，改为配置驱动：

```ts
const dataAuthOptions = computed<CommonType.Option<Api.SystemManage.RoleDataAuth>[]>(() => [
  { label: $t('page.manage.role.dataAuthOptions.user'), value: 0 },
  { label: $t('page.manage.role.dataAuthOptions.group'), value: 1 }
]);

// formItems 中
{ key: 'dataAuths', label: $t('page.manage.role.dataAuths'), type: 'select',
  multiple: true, filterable: false, span: 24, options: dataAuthOptions.value }
```

- `span: 24`（原插槽项也是 24，保持整行）。
- `filterable: false`：仅 2 个固定选项，无需搜索框（对齐 `BasicConfig.vue` 的 `NO_FILTER` 写法）。
- 多选语义不变：仍可同时选 0 和 1，与后端 `dataAuths: [Number]` 一致。

### 4.2 「限制性权限设置」区块：4 个 switch → 5 个下拉

新增 section 标题项 + 5 个下拉（`span: 12`，两列排布，与原 switch 布局一致）：

```ts
// 允许 / 不允许（sendOrderCtrl、orderColCtrl、editInfoCtrl、editPwdCtrl 共用）
const allowOptions = computed<CommonType.Option<Api.SystemManage.RoleCtrl>[]>(() => [
  { label: $t('page.manage.role.ctrlOptions.deny'), value: 0 },
  { label: $t('page.manage.role.ctrlOptions.allow'), value: 1 }
]);

// 启用 / 不启用（仅 sendCtrl）
const enableOptions = computed<CommonType.Option<Api.SystemManage.RoleCtrl>[]>(() => [
  { label: $t('page.manage.role.ctrlOptions.disable'), value: 0 },
  { label: $t('page.manage.role.ctrlOptions.enable'), value: 1 }
]);

// formItems 中（放在 desc 之前、dataAuths 之后）
{ key: 'restrictSection', label: $t('page.manage.role.restrictSection'), type: 'section', span: 24 },
{ key: 'sendOrderCtrl', label: $t('page.manage.role.ctrls.sendOrder'), type: 'select', span: 12, options: allowOptions.value, filterable: false },
{ key: 'sendCtrl',      label: $t('page.manage.role.ctrls.sendCtrl'),  type: 'select', span: 12, options: enableOptions.value, filterable: false },
{ key: 'orderColCtrl',  label: $t('page.manage.role.ctrls.orderCol'),  type: 'select', span: 12, options: allowOptions.value, filterable: false },
{ key: 'editInfoCtrl',  label: $t('page.manage.role.ctrls.editInfo'),  type: 'select', span: 12, options: allowOptions.value, filterable: false },
{ key: 'editPwdCtrl',   label: $t('page.manage.role.ctrls.editPwd'),   type: 'select', span: 12, options: allowOptions.value, filterable: false }
```

文案对齐第二张图 + 后端注释：

| 字段            | label（zh）              | 选项                           |
| --------------- | ------------------------ | ------------------------------ |
| `sendOrderCtrl` | 出库后禁止修改           | 不允许(0) / 允许(1)            |
| `sendCtrl`      | 出库必须称重             | 不启用(0) / 启用(1)            |
| `orderColCtrl`  | 运单列表禁止设置列表字段 | 不允许(0) / 允许(1)            |
| `editInfoCtrl`  | 用户修改个人信息         | 不允许(0) / 允许(1)            |
| `editPwdCtrl`   | 用户修改密码             | 不允许(0) / 允许(1) ← **新增** |

> 注意 `sendOrderCtrl` / `orderColCtrl` 的现有中文是正向描述（「出库后允许修改运单」「允许设置运单列表字段」），本轮改为后端/截图口径的负向描述，值域 0/1 的含义**不变**。

### 4.3 model / 回填 / 重置

- `model` 新增 `editPwdCtrl: 1`（**假设：默认允许修改密码**；与现状 `editInfoCtrl=1` 口径一致）。
- `fillFormByRow()`：`model.editPwdCtrl = props.row.editPwdCtrl ?? 1;`
- `resetForm()`：`model.editPwdCtrl = 1;`
- 其余 4 个字段的默认值沿用现状：`sendOrderCtrl=1`、`sendCtrl=0`、`orderColCtrl=1`、`editInfoCtrl=1`。

### 4.4 i18n（zh-cn / en-us / app.d.ts 三处同步）

`page.manage.role` 下：

- 新增 `restrictSection`：限制性权限设置 / Restrictive Permission Settings
- 新增 `ctrlOptions.{allow,deny,enable,disable}`：允许 / 不允许 / 启用 / 不启用 — Allowed / Not Allowed / Enabled / Disabled
- 新增 `ctrls.editPwd`：用户修改密码 / Allow changing password
- 修改 `ctrls.sendOrder`：出库后禁止修改 / Prohibit editing after outbound
- 修改 `ctrls.orderCol`：运单列表禁止设置列表字段 / Prohibit configuring waybill columns
- 修改 `ctrls.editInfo`：用户修改个人信息 / Allow editing personal info
- `ctrls.sendCtrl` 文案不变（出库必须称重 / Weighing required for outbound）

> `ctrls.*` 仅被 `role-operate-drawer.vue` 使用（改动前需全仓确认），改文案无外部回归。

## 5. 实现要点

- section 项 `key` 用 `restrictSection`（不存在于 model 也无妨：section 分支不读 `model[key]`、不包 `NFormItem`、不参与校验）。
- `totalRows` 会把 section 计入一行——`showToggle` 依赖 `actionItems.length`（本抽屉无 slot 项）→ 不受影响。
- 多选下拉值写回：`NSelect` 的 `v-model:value` 已在模板里 `as` 断言，`dataAuths` 仍为 `RoleDataAuth[]`，提交结构不变。
- 详情态（`mode="view"`）：section 标题与 5 个下拉自动走 `viewText` 渲染文案（多选用「、」连接），无需额外处理。
- `filterable: false` 显式关闭搜索框，避免 2 个选项还弹输入框。

## 6. 验证

无单测框架，按项目约定：

1. `pnpm typecheck` — 0 错误（重点：`editPwdCtrl` 类型链、i18n Schema 同步）。
2. `pnpm lint` — 0 error（`link.vue` 2 条既有 warning 与本改动无关）。
3. `pnpm fmt` — 提交前必须执行。
4. `pnpm build:test` — 构建通过。
5. 手动抽查（`pnpm dev`）：
   - 新增角色：数据权限为多选下拉（可选两项）、限制性权限设置 5 个下拉默认值正确；
   - 编辑已有角色：5 个下拉按后端值回填（含新增的「用户修改密码」）；
   - 详情态：数据权限多选值以「、」展示，5 项显示文案而非 0/1；
   - 提交后列表刷新，后端字段值正确落库。

## 7. 风险与备注

- 抽屉宽度沿用 `CommonDrawer` 默认 420px，两列（span 12）下长标签（如「运单列表禁止设置列表字段」）会折行——与现状 switch 布局一致，若视觉不佳再改 `span: 24` 单列或调宽抽屉。
- 后端 `roleType == 100`（ADMIN）强制 `editPwdCtrl = editInfoCtrl = 1`，前端 roleType 用 5 表示管理员（已知不一致），本轮不处理，前端不对其做特殊禁用。
- 老角色数据若缺 `editPwdCtrl`，回填按 `?? 1` 兜底为「允许」，与后端 `services/role.js` 缺省取 `max` 的行为一致（缺省即 0 会被视为不允许——前端兜底 1 仅影响表单初始展示，保存后由用户显式决定）。
