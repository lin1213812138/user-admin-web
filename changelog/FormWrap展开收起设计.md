# FormWrap 展开/收起 + 右侧独立按钮区 设计

- 日期：2026-08-31
- 状态：设计稿（待用户确认后开发）
- 相关文件：`src/components/Form/index.vue`、`src/components/Form/form-config.ts`、`src/locales/langs/zh-cn.ts`、`src/locales/langs/en-us.ts`、`src/views/system-manage/role/index.vue`

## 背景

用户反馈：`FormWrap` 目前把搜索/重置按钮当成 `items` 里的一个字段（`slot: 'actions'`）塞进 `NGrid` 栅格，视觉上是「第 N 列」而非「表单右侧独立按钮区」；且字段较多（超过两行）时没有展开/收起能力。

需求：给 `FormWrap` 增加**通用**展开/收起能力——字段按 `span` 排布行数 > `collapseRows` 时自动显示展开/收起按钮，**收起时只显示第 1 行**字段；并把操作类按钮（纯 slot 项）抽离到右侧独立按钮区，不计入行数、始终显示。

## 决策记录（已与用户确认）

1. 行数计算方式：**A. 组件按 `span` 自动计算**（满 24 换一行），而非页面显式声明。已知局限：不考虑 `item-responsive` 窄屏额外换行。
2. 收起时显示行数：**只显示第 1 行**（`collapseRows` 默认 `1`）。
3. 操作按钮区：**X. 从 `NGrid` 抽离，放右侧独立按钮区**，不计入行数、始终显示；展开/收起按钮也在此区。

## 改动方案

### 1. `FormWrap` 组件（`src/components/Form/index.vue`）

**不新增 prop** —— 触发条件改为：只要 `items` 里存在 `slot` 项（action），就自动具备展开/收起能力，无需显式开关。无 action 的纯表单（如抽屉）不受影响。

**script 逻辑新增：**

- `actionItems` = `items.filter(i => i.slot)` —— 纯插槽项，视作操作按钮，不计入行数。
- `fieldItems` = `items.filter(i => !i.slot)` —— 真实字段。
- `totalRows` = 按 `fieldItems` 的 `span` 累加（>=24 换行）算出的行数；空 `span` 按 `24` 计。
- `expanded` = `ref(true)`。
- `showToggle` = `actionItems.length > 0 && totalRows > 1`（收起只显示第 1 行）。
- `visibleFieldItems` = `expanded ? fieldItems : 前 1 行对应的字段`。

**模板改动：**

- `NGrid` 只 `v-for` `visibleFieldItems`（移除原来的 `actions` 渲染分支）。
- 新增右侧独立按钮区（在 `NForm` 内、`NGrid` 之下）：
  ```vue
  <div v-if="actionItems.length || showToggle" class="flex-y-center justify-end gap-8px">
    <template v-for="it in actionItems" :key="it.key">
      <slot :name="it.slot" :model="model" :item="it" />
    </template>
    <NButton v-if="showToggle" text type="primary" @click="expanded = !expanded">
      {{ expanded ? $t('common.collapseFilter') : $t('common.expandFilter') }}
      <icon-ic-baseline-keyboard-arrow-up v-if="expanded" class="text-icon" />
      <icon-ic-baseline-keyboard-arrow-down v-else class="text-icon" />
    </NButton>
  </div>
  ```

### 2. i18n 新增（zh-cn / en-us 同步）

在**顶层 `common`**（即 `Schema.common`，`const local` 所在的那一层，注意 lang 文件里还有另一个带 `themeConfig`/`fullscreen`/`collapse: '折叠菜单'` 的嵌套 `common`，不要加错）下新增：

- `common.expandFilter` = `展开` / `Expand`
- `common.collapseFilter` = `收起` / `Collapse`

> ⚠️ 坑：`GetI18nKey<Schema>` 对 `common` 的大联合类型会**截断**——放在 `common` 末尾的新键会从 `I18nKey` 联合里消失（表现为 `$t('common.xxx')` 报类型错误）。必须把新键加到 `common` 顶部（`action` 之后），并在 `src/typings/app.d.ts` 的 `Schema.common` 同步、同样放在顶部。

### 3. role 页面用法（`src/views/system-manage/role/index.vue`）

- 无需加任何 prop：`searchItems` 已含 `actions` 项（slot），自动启用能力并触发右侧按钮区。
- `searchItems` 保持 4 项（`roleName`/`roleCode`/`status`/`actions`）；`actions` 项自动进右侧按钮区，不再占栅格列。
- role 当前 3 字段 1 行，不会触发展开/收起，但能力就位，字段增多时自动生效。

## 影响范围 / 风险

- 现有 3 处 `FormWrap` 使用（user/role/menu 抽屉）若无 slot 项则完全不受影响；有 slot 项的页面（role 搜索区）自动获得右侧按钮区 + 可能的展开/收起。
- 行数计算基于 `span` 累加，是 A 方案已知局限（已确认接受）。
- 不引入 `any`，类型沿用 `FormItemConfig`。

## 验收

- [x] typecheck 通过
- [x] lint 通过
- [ ] 手动验证：role 搜索区按钮在右侧、字段增多（>1 行）时出现展开/收起
