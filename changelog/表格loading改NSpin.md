# 表格 loading 改为 NSpin（与全站统一）

> 日期：2026-09-21 ｜ 状态：**已实施，待手动冒烟**
> spec：`docs/superpowers/specs/2026-09-21-表格loading改NSpin-design.md`

## 用户原话

> 「然后能不能帮我自定义一下和表格组件的loading？x现在的loading太丑了」
> （追问是否要文字后）**「先不加文字」**

## 现状与选型

`Table` 之前把 `:loading` 直接透传给 `vxe-table`，加载态由 vxe 自带的 `vxe-loading` 渲染（半透明遮罩 + 其默认转圈图标）。

而项目其他加载态**统一用 naive 的 `NSpin`**：

| 位置                                                                    | 用法                      |
| ----------------------------------------------------------------------- | ------------------------- |
| `src/views/data-manage/components/useArchiveTabs.ts`                    | 分包加载占位 `h(NSpin)`   |
| `src/views/data-manage/components/archive-switch.vue`                   | 同上                      |
| `src/views/customer-manage/customer/modules/customer-detail-drawer.vue` | `<NSpin :show="loading">` |

⇒ 表格与全站风格不一致。

**选型：方案 A —— 换成 `NSpin`**（与全站统一，且自动跟随主题色与暗黑模式）。
（备选 B「保留 vxe 转圈但变小变淡」、C「骨架屏灰条」本轮均未采纳。）

## 实施

`src/components/Table/table.vue`：在 `<vxe-table>` 内新增 `#loading` 插槽（vxe 官方支持的写法，其告警文案即提示 `loading=false | <template #loading>...</template>`）：

```vue
<!-- 加载态：用 naive 的 NSpin 替换 vxe 默认 loading（与全站 loading 风格统一），按要求不显示文字 -->
<template #loading>
  <div class="h-full w-full flex items-center justify-center">
    <NSpin size="large" />
  </div>
</template>
```

- 遮罩层仍由 vxe 提供，仅替换其中内容并居中；
- **无文字**（用户要求；后续若加，只需补 `description`，无需改 API）；
- `NSpin` 走 unplugin 自动导入（`src/typings/components.d.ts` 已登记，同文件已在用 `NEmpty`）；
- `Table` 的 `loading` prop 语义与调用方式**完全不变** ⇒ **业务页面零改动，全仓表格统一生效**。

## 验证

- `pnpm typecheck`：0 错误（全项目仅 `handsontable` 未安装的 18 处既有错误）；
- `npx oxlint --fix`：**0 warnings 0 errors**；`npx oxfmt` + `--check`：通过。

## 待用户冒烟

1. 任意表格加载中（列表页 / 附加费抽屉 / 同步到渠道抽屉）→ 显示 naive 风格转圈、**居中、无文字**；
2. 加载结束 → 遮罩正常消失，无残留、无布局抖动；
3. 暗黑模式下转圈清晰可见；
4. 矮容器内的表格（抽屉 `h-[calc(100vh_-_160px)]`）→ 转圈仍居中、不溢出；
5. 与全站其它 loading（资料管理分包占位、客户详情抽屉）观感一致。

> **风险兜底**：若 vxe 4.21.2 的 `#loading` 插槽未真正替换遮罩内容（例如仅附加渲染），退回方案 B/C（spec §3 备选）。
