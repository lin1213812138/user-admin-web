# Icon Picker 设计文档

> 日期：2026-09-01
> 关联：菜单管理页图标字段（`src/views/system-manage/menu/`）

## 背景

菜单管理页（目录/菜单）的 `icon` 字段当前用 `FormWrap` 的 `type: 'input'` 纯文本输入，用户需手动拼写出 iconify 图标名（如 `mdi:home`），易错且无法预览。需要封装一个可搜索、可预览的图标选择器，并接入菜单编辑抽屉。

## 目标

1. 封装一个可复用、离线可用、零额外构建体积的图标选择器组件 `IconPicker`。
2. 选择器接入声明式表单 `FormWrap`，作为新的控件类型 `icon-picker`。
3. 菜单编辑抽屉的 `icon` 字段改用图标选择器。

## 非目标（YAGNI）

- 不接入本地 svg 图标（`vite-plugin-svg-icons` 的 `localIcon`），菜单仅用 iconify 图标名。
- 不实现全量 iconify 集合动态加载 / 实时 API 检索（离线 + 体积考虑）。
- 不做图标颜色/尺寸自定义（沿用全局 `text-icon` 等尺寸约定）。

## 方案

### 1. 图标数据源 — `src/constants/icons.ts`

新增常量文件，导出精选图标名数组：

```ts
/** curated iconify icon names for the menu icon picker */
export const iconifyIcons: string[] = [
  'mdi:home',
  'mdi:menu',
  'ic:round-menu'
  // ... 数百个常用图标，覆盖 mdi / ic 等本项目已用集合
];
```

- 纯字符串全名，与现有 `<SvgIcon :icon>` / `<Icon :icon>` 完全兼容。
- 离线可用，不引入 `@iconify/json` 运行期依赖，包体积不变。
- 后续扩充只需往数组追加名字。

### 2. 选择器组件 — `src/components/custom/icon-picker.vue`

组件名 `IconPicker`，位于 `src/components/custom/`（与 `svg-icon.vue` 同级）。

**Props**

| Prop          | 类型      | 说明                          |
| ------------- | --------- | ----------------------------- |
| `modelValue`  | `string`  | 当前选中的图标名（v-model）   |
| `disabled`    | `boolean` | 禁用                          |
| `placeholder` | `string`  | 占位文案                      |
| `clearable`   | `boolean` | 是否显示清空按钮，默认 `true` |

**Emits**

- `update:modelValue: [string]`

**UI 行为**

- 触发器：一个只读的 `NInput`（或等价的自定义按钮区），左侧渲染当前图标（用 `<SvgIcon :icon="modelValue">` 或 `<Icon>`），右侧显示 `placeholder` 或「已选图标名」；点击展开 `NPopover`。
- Popover 内容：
  - 顶部 `NInput` 搜索框（实时按子串过滤 `iconifyIcons`）。
  - 中部可滚动网格（固定高度，约每行 8 个），每个格子用 `<Icon :icon="name">` 渲染，hover/选中高亮。
  - 底部「清空」按钮（`clearable` 时），点击 emit `''` 并关闭。
- 选中某个图标：emit 对应名字、关闭 Popover。
- 空列表时显示「无匹配图标」占位。

### 3. 接入 FormWrap

**`src/components/Form/form-config.ts`**

- `FormItemType` 增加 `'icon-picker'`：
  ```ts
  export type FormItemType = 'input' | 'textarea' | 'number' | 'switch' | 'select' | 'icon-picker';
  ```

**`src/components/Form/index.vue`**

- 在字段渲染分支中增加：
  ```vue
  <IconPicker
    v-else-if="item.type === 'icon-picker'"
    v-model:value="model[item.key] as string"
    :placeholder="item.placeholder"
    :disabled="item.disabled"
  />
  ```
- 需要 `import IconPicker from '@/components/custom/icon-picker.vue'`（自动按需引入，显式 import 亦可）。

### 4. 菜单抽屉接入 — `src/views/system-manage/menu/modules/menu-operate-drawer.vue`

将 `icon` 表单项：

```ts
// 改前
{ key: 'icon', label: ..., type: 'input', span: 24, placeholder: ... }
// 改后
{ key: 'icon', label: ..., type: 'icon-picker', span: 24, placeholder: $t('common.iconPicker.placeholder') }
```

表格的 `#icon` 插槽（`<SvgIcon v-if="row.icon" :icon="row.icon">`）保持不变。

### 5. 国际化

`src/locales/langs/zh-cn.ts` 与 `en-us.ts` 新增（保持 `common.*` 命名空间，zh/en 同步）：

```
common.iconPicker.placeholder = '请选择图标' / 'Select an icon'
common.iconPicker.clear      = '清空' / 'Clear'
common.iconPicker.search     = '搜索图标' / 'Search icons'
common.iconPicker.empty      = '无匹配图标' / 'No matching icons'
```

（菜单 `page.manage.menu.form.iconPlaceholder` 原键可保留或迁移到 `common.iconPicker.placeholder`，本设计统一改用 `common.iconPicker.*`。）

## 数据流

```
menu-operate-drawer.vue
  └─ NFormWrap :items (icon.type = 'icon-picker')
       └─ IconPicker v-model:value="model.icon"
            ├─ 读取 src/constants/icons.ts 的 iconifyIcons
            └─ 选中 → emit('update:modelValue') → model.icon
  └─ handleSubmit(): fetchCreateMenu / fetchUpdateMenu(model)
```

图标名以字符串存库（与现有 `Menu.icon` 字段一致）。

## 错误处理 / 边界

- 当前值不在 `iconifyIcons` 列表中（如历史数据旧名）：触发器仍用 `<Icon>` 渲染（iconify 同名则显示，否则空），不报错；选择器网格只影响可选项，不影响已存值。
- `disabled` 时触发器不可点击、Popover 不打开。
- 搜索无结果：网格区显示「无匹配图标」空态。

## 验证

- `pnpm typecheck`（vue-tsc 严格模式，无 `any`）。
- `pnpm lint`（oxlint + eslint）。
- `pnpm build`（prod 构建通过）。
- 本仓库无单测框架，不编写单元测试。
- 手动验收（开发服务器）：菜单抽屉 icon 字段打开选择器，搜索、选择、清空均正常，保存后表格图标列正确显示。

## 文件清单

| 操作 | 文件                                                           |
| ---- | -------------------------------------------------------------- |
| 新增 | `src/constants/icons.ts`                                       |
| 新增 | `src/components/custom/icon-picker.vue`                        |
| 修改 | `src/components/Form/form-config.ts`                           |
| 修改 | `src/components/Form/index.vue`                                |
| 修改 | `src/views/system-manage/menu/modules/menu-operate-drawer.vue` |
| 修改 | `src/locales/langs/zh-cn.ts`                                   |
| 修改 | `src/locales/langs/en-us.ts`                                   |
