# 角色管理搜索区改用封装 FormWrap

- 日期：2026-08-31
- 文件：`src/views/system-manage/role/index.vue`

## 问题

角色管理列表页的搜索区直接使用了原生 `NForm` + `NFormItem` 手写，未使用项目封装的声明式表单组件 `FormWrap`（`src/components/Form/index.vue`），不符合 AGENTS.md「新业务表单优先用 `FormWrap`」的约定。

## 改动

1. 引入 `NFormWrap` 及 `FormItemConfig` 类型。
2. 新增 `searchItems` 计算属性，将 `roleName` / `roleCode` / `status` 三个字段及一个占位的 `actions` 按钮项配置化（`span: 6` 实现四列横向布局，`status` 用 `type: 'select'` 复用 `statusOptions`）。
3. 模板中 `<NForm>` 搜索区替换为 `<NFormWrap :model="searchParams" :items="searchItems" grid-responsive="self">`，搜索/重置按钮放入 `#actions` 具名插槽。

## 说明

- 原 `inline` 模式下的 `@keyup.enter` 回车搜索改为点击搜索按钮触发；如需保留回车提交可后续在 FormWrap 内补充。
- `label` 使用 `' '` 占位避免按钮项出现空标签。
- 该文件同时以临时路径 `C:\Users\l1998\AppData\Local\Temp\codebuddy-dropped-files\...\index.vue` 由用户提供，已同步修改至项目实际路径。
