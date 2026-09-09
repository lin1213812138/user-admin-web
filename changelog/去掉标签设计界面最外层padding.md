# 去掉标签设计界面最外层 padding

## 问题

标签设计页（打印设计器）四周有一圈留白，没有占满内容可视区，看起来「不贴边」。

## 定位

打印设计页根容器 `src/views/system-manage/print-design/index.vue` 为 `<div class="h-full w-full flex flex-col overflow-hidden">`，自身并无 padding。
那圈留白来自布局层 `src/layouts/modules/global-content/index.vue` 的 content 区域默认 `p-16px`
（`GlobalContent` 的 `showPadding` prop 默认 `true`，`blank-layout` 才传 `false`）。

## 方案

在 `src/layouts/base-layout/index.vue` 中按当前路由控制 `show-padding`：

- `const route = useRoute()`
- `const contentShowPadding = computed(() => route.name !== 'system-manage_print-design')`
- `<GlobalContent :show-padding="contentShowPadding" />`

仅对打印设计页（`system-manage_print-design`）关掉 content 外层 16px 内边距，其余页面行为不变。
画布内部 `#hiprint-printTemplate` 的 16px padding（用于承载设计态标尺、不被滚动容器裁剪）保留，不属于「整页最外层」。

## 影响

- 仅打印设计页内容区占满可视区，顶部工具栏 / 左右栏贴边。
- 其它页面不受影响（路由名不匹配时 `showPadding` 仍为 `true`）。
