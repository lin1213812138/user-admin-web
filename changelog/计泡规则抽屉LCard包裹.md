# 计泡规则抽屉 LCard 包裹

## 需求

用户贴「新增计泡规则」抽屉截图，要求把「基础信息」「进位规则」两个模块用刚封装的 `LCard` 卡片组件包起来（AGENTS.md 规则 1/2 已读，组件为同日已确认实施的 `src/components/basic/l-card/index.vue`）。

## 实施

`src/views/data-manage/ship/modules/weight-rule/WeightRuleOperateDrawer.vue`：

1. `formItems` 删除 `__sectionBasic` / `__sectionCarry` 两个 `type: 'section'` 项——区块标题（蓝条+文字）由 `LCard` 的 header 承担，避免双重标题。
2. 模板结构调整：
   - `<LCard :title="basicInfo">` 包住 `NFormWrap`（基础信息表单字段）；
   - `<LCard :title="carry">` 包住进位类型多选下拉 + 各进位规则组手写结构；
   - 两卡片之间 `mb-16px` 分隔。
3. `LCard` 默认 `content-padding: 12px 16px`，组内既有 `space-y-8px` / `mt-16px` 间距保持不变。

## 不变

- 表单字段、必填规则、提交校验逻辑零改动；
- `carryList: [{carry, ruleList:[{start,end,unit}]}]` 提交契约不变；
- 抽屉宽度、底部按钮、列表页均未动。

## 验证

- `pnpm typecheck` 0 错误；
- 浏览器渲染效果待用户冒烟。
