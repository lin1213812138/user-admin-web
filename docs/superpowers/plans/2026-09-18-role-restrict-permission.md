# 角色编辑界面：数据权限改多选下拉 + 限制性权限设置区块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把角色编辑抽屉里的 `dataAuths` 两个复选框改成多选下拉，并把后端已有的 5 个限制性权限字段以「下拉 + section 区块」形式整合进角色修改/新增/详情界面，全部用下拉、不用 switch。

**Architecture:** 仅改造 `role-operate-drawer.vue` 的 `formItems` / `model` / `fillFormByRow` / `resetForm`、删除 `#dataAuths` 插槽；补齐 `editPwdCtrl` 类型；i18n 三处同步。复用 `FormWrap` 已有的 `select+multiple` 与 `section` 能力，公共组件与后端零改动。

**Tech Stack:** Vue 3.5 `<script setup lang="ts"` · Naive UI 2.44 `NSelect`(`multiple`) · 内部 `FormWrap`(`NForm`) · TypeScript 6 strict · pnpm workspace。

## Global Constraints

- Node.js >= 20.19.0，pnpm >= 10.5.0；**禁止 npm / yarn**，包管理只用 pnpm。
- 后端 `tms-user` **零改动**（5 个字段已在 `lib/common/models/role.js`）。
- 公共 `Form` / `FormItemConfig` 组件零改动。
- i18n 必须三处同步（zh-cn / en-us / `src/typings/app.d.ts` Schema），不同步会触发 `vue-tsc` TS2353/TS2345。
- 提交用 `pnpm commit`（交互式 Conventional Commits），**不要**裸 `git commit`；pre-commit 钩子依次跑 `typecheck → lint → fmt → git diff --exit-code`。
- 验证无单测框架：每个任务以 `pnpm typecheck` + `pnpm lint` 为门槛，全量完成后跑 `pnpm build:test` + `pnpm fmt`。
- 值域语义沿用后端：5 个 ctrl 字段 `0 = 不允许/不启用`、`1 = 允许/启用`；`dataAuths` 仍 `0 | 1` 数组（0=仅查看专属客户业务、1=仅查看所属组别客户业务）。

---

## File Structure

- `src/typings/api/system-manage.d.ts` — `Role` 与 `RoleCreateParams` 补 `editPwdCtrl?: RoleCtrl`。
- `src/locales/langs/zh-cn.ts` — `page.manage.role` 下：新增 `restrictSection` / `ctrlOptions.{allow,deny,enable,disable}` / `ctrls.editPwd`；改 `ctrls.sendOrder` / `ctrls.orderCol` / `ctrls.editInfo`。
- `src/locales/langs/en-us.ts` — 同上（英文）。
- `src/typings/app.d.ts` — i18n Schema 同步（上述新增/修改 key）。
- `src/views/system-manage/role/modules/role-operate-drawer.vue` — 主改造：删 `#dataAuths` 插槽；`dataAuths` 改 `select+multiple`；新增 `restrictSection` section 项 + 5 个 `select` 项；`model` / `fillFormByRow` / `resetForm` 补 `editPwdCtrl`。

---

### Task 1: 类型补 `editPwdCtrl`

**Files:**

- Modify: `src/typings/api/system-manage.d.ts`

**Interfaces:**

- Consumes: 已有 `Api.SystemManage.RoleCtrl`（0|1）、`Role`、`RoleCreateParams`。
- Produces: `Role.editPwdCtrl?`、`RoleCreateParams.editPwdCtrl?` 供 Task 3 的 `model` / 回填使用。

- [ ] **Step 1: 在 `Role` 接口补字段**

在 `src/typings/api/system-manage.d.ts` 的 `Role` 接口（约 192 行 `editInfoCtrl` 之后、`order` 之前）加入：

```ts
      /** 用户修改密码 0-不允许 1-允许 */
      editPwdCtrl?: Api.SystemManage.RoleCtrl;
```

- [ ] **Step 2: 在 `RoleCreateParams` 补字段**

在同文件的 `RoleCreateParams` 类型（约 234 行 `editInfoCtrl` 之后、`order` 之前）加入：

```ts
      /** 用户修改密码 0-不允许 1-允许 */
      editPwdCtrl?: Api.SystemManage.RoleCtrl;
```

- [ ] **Step 3: 类型检查**

Run: `pnpm typecheck`
Expected: 0 错误（仅新增可选字段，无调用方破坏）。

- [ ] **Step 4: 提交**

```bash
pnpm commit
```

提交信息建议：`feat(role): add editPwdCtrl to Role types`

---

### Task 2: i18n 三处同步（zh-cn / en-us / app.d.ts）

**Files:**

- Modify: `src/locales/langs/zh-cn.ts`
- Modify: `src/locales/langs/en-us.ts`
- Modify: `src/typings/app.d.ts`

**Interfaces:**

- Consumes: Task 1 已存在的 `Role` / `RoleCreateParams`（无直接依赖，仅同批语义）。
- Produces: `$t('page.manage.role.restrictSection')`、`$t('page.manage.role.ctrlOptions.{allow,deny,enable,disable}')`、`$t('page.manage.role.ctrls.editPwd')` 及更新后的 `ctrls.sendOrder` / `ctrls.orderCol` / `ctrls.editInfo`，供 Task 3 的 `formItems` 使用。

- [ ] **Step 1: zh-cn 文案**

在 `src/locales/langs/zh-cn.ts` 的 `page.manage.role` 段：

- 在 `dataAuths: '数据权限',` 之后新增一行：
  ```ts
        restrictSection: '限制性权限设置',
  ```
- 在 `dataAuthOptions: { user, group }` 之后、`ctrls: {` 之前新增选项块：
  ```ts
        ctrlOptions: {
          allow: '允许',
          deny: '不允许',
          enable: '启用',
          disable: '不启用'
        },
  ```
- 修改 `ctrls` 块为：

  ```ts
        ctrls: {
          sendOrder: '出库后禁止修改',
          sendCtrl: '出库必须称重',
          orderCol: '运单列表禁止设置列表字段',
          editInfo: '用户修改个人信息',
          editPwd: '用户修改密码'
        },
  ```

- [ ] **Step 2: en-us 文案**

在 `src/locales/langs/en-us.ts` 的 `page.manage.role` 段：

- 在 `dataAuths: 'Data Permissions',` 之后新增：
  ```ts
        restrictSection: 'Restrictive Permission Settings',
  ```
- 在 `dataAuthOptions: { user, group }` 之后、`ctrls: {` 之前新增：
  ```ts
        ctrlOptions: {
          allow: 'Allowed',
          deny: 'Not Allowed',
          enable: 'Enabled',
          disable: 'Disabled'
        },
  ```
- 修改 `ctrls` 块为：

  ```ts
        ctrls: {
          sendOrder: 'Prohibit editing after outbound',
          sendCtrl: 'Weighing required for outbound',
          orderCol: 'Prohibit configuring waybill columns',
          editInfo: 'Allow editing personal info',
          editPwd: 'Allow changing password'
        },
  ```

- [ ] **Step 3: app.d.ts Schema 同步**

在 `src/typings/app.d.ts` 的 `role` Schema（约 696 行 `dataAuths: string;` 之后）新增：

```ts
restrictSection: string;
ctrlOptions: {
  allow: string;
  deny: string;
  enable: string;
  disable: string;
}
```

并在该 Schema 的 `ctrls` 块（沿用同文件 `role.ctrls` 现有结构）新增 `editPwd: string;`，将 `sendOrder` / `orderCol` / `editInfo` 的声明值更新为新文案对应字符串（Schema 只校验 key 存在与类型为 string，文案内容不影响类型，但需保证 key 齐全，否则 TS2353）。

- [ ] **Step 4: 类型检查**

Run: `pnpm typecheck`
Expected: 0 错误（Schema 与 locales 的 key 集合一致）。

- [ ] **Step 5: 提交**

```bash
pnpm commit
```

提交信息建议：`feat(role): sync i18n for restrict permission section`

---

### Task 3: `role-operate-drawer.vue` 改造

**Files:**

- Modify: `src/views/system-manage/role/modules/role-operate-drawer.vue`

**Interfaces:**

- Consumes: Task 1 的 `RoleCreateParams.editPwdCtrl?`、Task 2 的全部 `$t` key。
- Produces: 角色编辑抽屉界面，`dataAuths` 多选下拉 + 限制性权限设置 5 个下拉（含 `editPwdCtrl`），详情只读态自动渲染。

- [ ] **Step 1: `model` 补 `editPwdCtrl`**

在 `role-operate-drawer.vue` 的 `model`（`reactive<Api.SystemManage.RoleCreateParams>`）对象（约 79 行 `editInfoCtrl: 1,` 之后、`order: 0` 之前）加入：

```ts
  editPwdCtrl: 1,
```

- [ ] **Step 2: 新增下拉选项 computed**

在 `roleTypeOptions` 之后新增两段 `computed`（与现有 `roleTypeOptions` 同级）：

```ts
/** 允许 / 不允许（sendOrderCtrl、orderColCtrl、editInfoCtrl、editPwdCtrl 共用） */
const allowOptions = computed<CommonType.Option<Api.SystemManage.RoleCtrl>[]>(() => [
  { label: $t('page.manage.role.ctrlOptions.deny'), value: 0 },
  { label: $t('page.manage.role.ctrlOptions.allow'), value: 1 }
]);

/** 启用 / 不启用（仅 sendCtrl） */
const enableOptions = computed<CommonType.Option<Api.SystemManage.RoleCtrl>[]>(() => [
  { label: $t('page.manage.role.ctrlOptions.disable'), value: 0 },
  { label: $t('page.manage.role.ctrlOptions.enable'), value: 1 }
]);
```

- [ ] **Step 3: 改 `dataAuths` 表单项为多选下拉**

把 `formItems` 中原来的：

```ts
  {
    key: 'dataAuths',
    label: $t('page.manage.role.dataAuths'),
    slot: 'dataAuths',
    span: 24
  },
```

替换为：

```ts
  {
    key: 'dataAuths',
    label: $t('page.manage.role.dataAuths'),
    type: 'select',
    multiple: true,
    filterable: false,
    span: 24,
    options: dataAuthOptions.value
  },
```

注意：`dataAuthOptions` 当前在 `role/index.vue` 里定义；本抽屉需新增一份本地 `dataAuthOptions`：

```ts
/** 数据权限下拉选项（后端 RoleDataAuth：0-仅查看专属客户业务 1-仅查看所属组别客户业务） */
const dataAuthOptions = computed<CommonType.Option<Api.SystemManage.RoleDataAuth>[]>(() => [
  { label: $t('page.manage.role.dataAuthOptions.user'), value: 0 },
  { label: $t('page.manage.role.dataAuthOptions.group'), value: 1 }
]);
```

- [ ] **Step 4: 替换 4 个 switch 为下拉并新增 `editPwdCtrl`**

把 `formItems` 中原来的 4 个 `type: 'switch'` 项（sendOrderCtrl / sendCtrl / orderColCtrl / editInfoCtrl）整体替换为「section + 5 个 select」：

```ts
  {
    key: 'restrictSection',
    label: $t('page.manage.role.restrictSection'),
    type: 'section',
    span: 24
  },
  {
    key: 'sendOrderCtrl',
    label: $t('page.manage.role.ctrls.sendOrder'),
    type: 'select',
    span: 12,
    options: allowOptions.value,
    filterable: false
  },
  {
    key: 'sendCtrl',
    label: $t('page.manage.role.ctrls.sendCtrl'),
    type: 'select',
    span: 12,
    options: enableOptions.value,
    filterable: false
  },
  {
    key: 'orderColCtrl',
    label: $t('page.manage.role.ctrls.orderCol'),
    type: 'select',
    span: 12,
    options: allowOptions.value,
    filterable: false
  },
  {
    key: 'editInfoCtrl',
    label: $t('page.manage.role.ctrls.editInfo'),
    type: 'select',
    span: 12,
    options: allowOptions.value,
    filterable: false
  },
  {
    key: 'editPwdCtrl',
    label: $t('page.manage.role.ctrls.editPwd'),
    type: 'select',
    span: 12,
    options: allowOptions.value,
    filterable: false
  },
```

保持这些项在 `desc` 表单项之前（即原 switch 所在顺序位置）。

- [ ] **Step 5: `fillFormByRow` 补 `editPwdCtrl`**

在 `fillFormByRow()` 中 `model.editInfoCtrl = props.row.editInfoCtrl ?? 1;` 之后加入：

```ts
model.editPwdCtrl = props.row.editPwdCtrl ?? 1;
```

- [ ] **Step 6: `resetForm` 补 `editPwdCtrl`**

在 `resetForm()` 中 `model.editInfoCtrl = 1;` 之后加入：

```ts
model.editPwdCtrl = 1;
```

- [ ] **Step 7: 删除 `#dataAuths` 插槽**

在 `<template>` 的 `<NForm>` 内，删除整个 `#dataAuths` 插槽块：

```vue
<template #dataAuths>
  <NCheckboxGroup v-model:value="model.dataAuths" :disabled="isDetail">
    <NSpace :size="16" wrap>
      <NCheckbox :value="0">{{ $t('page.manage.role.dataAuthOptions.user') }}</NCheckbox>
      <NCheckbox :value="1">{{ $t('page.manage.role.dataAuthOptions.group') }}</NCheckbox>
    </NSpace>
  </NCheckboxGroup>
</template>
```

（删除后 `dataAuths` 走 FormWrap 的 `select+multiple` 自动渲染，详情态也自动展示。）

- [ ] **Step 8: 类型检查**

Run: `pnpm typecheck`
Expected: 0 错误（`editPwdCtrl` 已在类型与 model 中存在；`dataAuths` 多选值类型与 `RoleDataAuth[]` 一致）。

- [ ] **Step 9: 提交**

```bash
pnpm commit
```

提交信息建议：`feat(role): dataAuths multi-select + restrict permission dropdowns`

---

### Task 4: 全量验证

**Files:**

- 无新增文件；校验 Task 1–3 产物。

**Interfaces:**

- Consumes: Task 1–3 全部改动。
- Produces: 绿灯状态，可交付手动冒烟。

- [ ] **Step 1: 全量类型 + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: typecheck 0 错误；lint 0 error（仅 `link.vue` 2 条既有 warning，与本次无关）。

- [ ] **Step 2: 格式化**

Run: `pnpm fmt`
Expected: 退出码 0，无 `git diff` 残留（pre-commit 的 `git diff --exit-code` 通过）。

- [ ] **Step 3: 构建**

Run: `pnpm build:test`
Expected: 构建成功。

- [ ] **Step 4: 手动冒烟清单（交给用户 `pnpm dev` 验证）**

- 新增角色：数据权限为多选下拉（可选 0 和 1 两项）；限制性权限设置区块 5 个下拉默认值 = 出库后禁止修改(允许) / 出库必须称重(不启用) / 运单列表禁止设置列表字段(允许) / 用户修改个人信息(允许) / 用户修改密码(允许)。
- 编辑已有角色：5 个下拉按后端值正确回填（含新增「用户修改密码」）。
- 详情态（mode=view）：数据权限多选值以「、」连接展示，5 个下拉显示文案而非 0/1，控件禁用。
- 保存后列表刷新，后端字段值落库正确。

---

## Self-Review

**1. Spec coverage:**

- `dataAuths` 多选下拉 → Task 3 Step 3 + Step 7 ✅
- 删 switch、改 5 个下拉 + section → Task 3 Step 4 ✅
- `editPwdCtrl` 类型 → Task 1 ✅
- `editPwdCtrl` model / fill / reset → Task 3 Step 1 / 5 / 6 ✅
- i18n 三处同步 → Task 2 ✅
- 后端零改动 / 公共组件零改动 / 列表页零改动 → 全计划明确未涉及 ✅

**2. Placeholder scan:** 无 TBD/TODO；每个 Step 含具体代码或命令。

**3. Type consistency:** `editPwdCtrl`、`restrictSection`、`ctrlOptions.*`、`ctrls.editPwd` 在 Task 1/2 定义、Task 3 引用，命名与值类型一致；`dataAuthOptions` / `allowOptions` / `enableOptions` 在 Task 3 内统一定义与使用。无前后不一致。
