# 注释 Form 组件展开/收起按钮

## 背景

上一条讨论定位了 FormWrap 展开/收起的判断逻辑（`showToggle` + `expanded` + `visibleFieldItems`），用户确认"那就先注释掉吧，暂时不需要这个了"。

## 改动

仅改 `src/components/Form/index.vue`，共两处连锁注释：

1. 模板：展开/收起 `NButton` 整块包 HTML 注释（含"恢复时一并取消注释"标注）；
2. script：`toggleExpand()` 函数注释（仅被该按钮引用，不注释会 unused 报错）。

**保留不动**：`expanded`（仍被 `visibleFieldItems` 使用，默认 true 即全展开）、`showToggle`（仍被 `visibleFieldItems` 和表单下方操作区 `v-if="actionItems.length || showToggle"` 使用）。

## 验证

read_lints 0 / `pnpm typecheck` 通过。
