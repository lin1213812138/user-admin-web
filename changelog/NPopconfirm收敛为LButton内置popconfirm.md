# NPopconfirm 手写包法收敛为 LButton 内置 popconfirm

> 日期：2026-09-19
> 触发：用户看到 `<NPopconfirm><template #trigger><LButton>…` 的写法，指出「这种的不是内置了吗？不能直接改好吗？」

## 背景

`LButton`（`src/components/basic/LButton.vue`）已内置二次确认能力：

- `popconfirm`：传 `true` 用默认文案 `$t('common.confirmDelete')`，传字符串用自定义文案
- `@positive-click` / `@negative-click`：组件内部从 `attrs` 摘出 `onPositiveClick/onNegativeClick` 转交给内部 `NPopconfirm`（并从 `buttonBind` 中剔除，避免误落到按钮根）
- `popconfirm-placement` / `popconfirm-positive-text` / `popconfirm-negative-text`

因此手写 `<NPopconfirm @positive-click="…"><template #trigger><LButton …>…</LButton></template>文案</NPopconfirm>` 属于重复样板，可全部收敛。

## 实施方案（脚本化批量，临时脚本已删除）

范围：全仓 `<NPopconfirm>` 块（排除 `LButton.vue` 自身实现），共 **48 处 / 38+10 个文件**。

转换规则：

1. trigger **恰好是单个 `<LButton>`** 的块才转换；否则跳过人工处理。
2. NPopconfirm 属性白名单：`@positive-click`、`@negative-click`、`v-if/v-else-if/v-else`、`placement`、`positive-text`、`negative-text`（含 `:` 绑定形式）。未知属性（如 `:show-icon`）跳过。
3. 弹窗文案 → 属性：
   - `{{ $t('common.confirmDelete') }}` → 裸 `popconfirm`
   - `{{ expr }}` → `:popconfirm="expr"`（如禁用/启用的三元文案）
   - 纯文本 → `popconfirm="文本"`
4. `v-if` 等结构指令移到 LButton 上（如 `InputFormat.vue` 的 `v-if="row.buildIn !== 1"`）。
5. `placement` / `positive-text` 等改名为 `popconfirm-placement` / `popconfirm-positive-text`。

### 特例：批量删除按钮的 NPopconfirm `:disabled`（10 处）

`<NPopconfirm :disabled="checkedRows.length === 0">` 包裹的批量删除按钮，其 trigger LButton 自身也是**相同的 `:disabled` 条件**。按钮禁用时根本无法点击、弹窗本就打不开，因此该层 `:disabled` 是冗余的，转换时直接丢弃，行为等价：

```vue
<!-- 之前 -->
<NPopconfirm :disabled="checkedRows.length === 0" @positive-click="handleDelete(checkedRows.map(i => i._id))">
  <template #trigger>
    <LButton type="error" :disabled="checkedRows.length === 0" …>批量删除</LButton>
  </template>
  {{ $t('common.confirmDelete') }}
</NPopconfirm>

<!-- 之后 -->
<LButton
  type="error"
  :disabled="checkedRows.length === 0"
  popconfirm
  @positive-click="handleDelete(checkedRows.map(i => i._id))"
  …
>批量删除</LButton>
```

## 踩坑

1. **正则被箭头函数截断**：初版属性匹配用 `[^>]*`，遇到 `@positive-click="…map(i => i._id)"` 中的 `=>` 直接断掉，导致 10 个批量删除块静默漏转。修正为引号感知匹配 `(?:"[^"]*"|'[^']*'|[^>"'])*`。
2. **重复 `:disabled`**：脚本在「丢弃 NPopconfirm 的 `:disabled`」判断后，组装属性列表时忘了排除该 token，导致 10 处出现重复属性（Vue 3 模板编译器对重复属性报错）。补一个去重脚本修复。
3. **缩进错乱**：脚本插入属性后未做缩进对齐，靠 `pnpm lint`（eslint `vue/html-indent`、`vue/attributes-order` 可自动修复规则）整体修正。

## 顺带发现：`components.d.ts` 陈旧条目「复活」

上次会话已删除的 `components.d.ts(160)` `LButton.bak` 陈旧条目（指向不存在的 `LButton.bak.vue`）再次出现。排查：`src/components/basic/` 下**无** `.bak.vue` 文件、9527 端口无服务，但机器上有大量 node 进程——判断是**某个运行中的 Vite dev server**（会话间启动）内存缓存还留着已删除的 `LButton.bak`，每次 `src` 文件变更都触发它重写 `components.d.ts`。已再次删除该行；**需重启 dev server 才能根治**，否则会反复写回。

## 验证

- `pnpm lint`：0 error（仅 `link.vue` 2 个既有 warning）。
- `pnpm typecheck`：48 个转换文件 0 错误；唯一报错是 `components.d.ts(160)` 的 `.bak` 陈旧条目（见上，待重启 dev server 后消失）。
- `pnpm fmt`：已执行（882 files）。

## 影响面

- 删除行为不变：仍是点击按钮 → NPopconfirm 二次确认 → `positive-click` 回调。
- 少一层组件嵌套与 `#trigger` 样板代码；弹窗 trigger 直接是按钮本体，定位不会漂移（原手写包法在部分场景会把弹窗定位飞到左上角）。
- 自定义文案/方向/按钮文案由 `popconfirm` 系列属性承接；若未来需要 `:show-icon` 等 LButton 未暴露的 NPopconfirm 属性，需先扩展 LButton 再使用。
