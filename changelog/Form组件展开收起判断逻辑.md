# Form 组件展开/收起的判断逻辑

## 背景

用户截图角色新增抽屉，红框标"收起"按钮，问：form 组件的展开和收起是通过什么判断显示隐藏的？

## 结论

逻辑全部在 `src/components/Form/index.vue`（FormWrap）内部，三层协同：

### 1. 按钮是否显示：`showToggle`

```ts
const showToggle = computed<boolean>(() => actionItems.value.length > 0 && totalRows.value > 1);
```

- `actionItems` = items 配置中带 `slot` 的操作项（渲染在表单下方右侧操作区）；`fieldItems` = 无 slot 的字段项。
- `totalRows` = 按 24 栅格累加各 item 的 `span`（默认 24）算出的总行数。
- 两个条件同时满足才渲染"收起/展开"按钮：**存在 slot 操作项 且 字段超过 1 行**。

### 2. 收起时隐藏哪些字段：`expanded` + `visibleFieldItems`

- `expanded` ref 默认 `true`，点击按钮 `toggleExpand()` 切换。
- 收起时 `visibleFieldItems` 同样按 span 累加，**只保留第一行**字段（`rows >= 1` 即 break），其余项不在 `NGrid` 中 `v-for` 渲染——是彻底不渲染，不是 CSS 隐藏。

### 3. 按钮文案与图标

`expanded === true` 显示 `$t('common.collapseFilter')`（收起）+ 上箭头，否则显示展开 + 下箭头（模板 448-452 行）。
