# 系统设置 tab 切换后跳转其它界面空白（含「A 方案无效」的更正与性能实测）

## 结论（2026-09-17 二次定位修订）

**根因：`setting/index.vue` 的 `<template>` 与根节点之间存在一行 HTML 注释。**

dev 模式下模板注释会被编译成注释节点，使**页面组件变成多根（Fragment）**；而布局层
`src/layouts/modules/global-content/index.vue` 的 `<Transition mode="out-in">` 的过渡钩子
（`setTransitionHooks`）只能挂到「单个根元素」上，递归到 Fragment 就中断了。

于是离开设置页时：

1. Transition 进入 out-in 分支：`state.isLeaving = true`，渲染空占位（`emptyPlaceholder`）；
2. 页面组件随之被卸载，但卸载走的是 **Fragment 分支** —— `remove()` 对 Fragment 直接 `removeFragment()` 摘 DOM，**不看 `vnode.transition`，`leave` 流程从未启动**；
3. `afterLeave` 永不调用 → `state.isLeaving` 永久为 `true` → 之后**任何页面**都只渲染空占位（内容区永久空白）；连点其它页签同样空白；
4. 刷新页面（重建应用）才能恢复。

**修复：把该注释移到根组件 `<VerticalTabLayout>` 内部**（页面模板保证单根，注释信息不丢）。

## 证据链（playwright + Vue 运行时探针）

| 观测项                                   | 修复前                                                                      | 修复后                              |
| ---------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------- |
| 设置页页面组件的渲染根                   | `Symbol(v-fgt)`（**Fragment**），children = `[注释节点, VerticalTabLayout]` | 组件节点（VerticalTabLayout），单根 |
| 离开设置页后站点页 `main.innerHTML` 长度 | **54**（只剩注释占位）                                                      | 84856（正常渲染）                   |
| 离开设置页时长任务                       | 卡死、无 leave 类变化                                                       | 69ms / 66ms                         |
| 控制台错误                               | 0 error（纯状态死锁，不报错）                                               | 0 error                             |

排除项：路由匹配正常（`matched: 2`、`components.default` 存在）、`reloadFlag === true`、
`cacheRoutes === ["iframe-page"]`、与接口/数据无关（无请求失败）、与 vxe-table 无关
（切「基础配置」纯表单页同样复现）。

## 一次错误结论的更正（重要）

本问题首轮定位曾怀疑「设置页的页内 `<KeepAlive>`」，并给出 A 方案（去掉页内 KeepAlive）。
用户实施后**仍然复现** —— 说明 KeepAlive 不是根因，现予更正。
第二轮改用「读取页面组件 vnode 结构」的探针，才拿到 Fragment 的直接证据。

**教训**：排查「Transition 相关异常」时，应先确认**页面组件渲染根的类型**（元素 / 组件 / Fragment / 注释），
而不是从业务组件结构上猜。

## 为什么只有系统设置页触发

全项目页面级组件（`views/**/index.vue`）中，只有 `setting/index.vue` 在模板顶层写了 HTML 注释，
其余页面模板第一行都是单根元素/组件。子组件内的模板顶层注释（如 label-designer 的若干 panels）
不参与布局层 Transition，不受影响。

## 性能观察：为什么设置页「卡」

同环境（dev 9112）实测主线程长任务（单 PerformanceObserver、切换前后各观察 2~3 秒）：

| 切换目标           | 主线程长任务            | 表格行数 | DOM 节点数 |
| ------------------ | ----------------------- | -------- | ---------- |
| 基础配置（纯表单） | 0ms                     | –        | –          |
| 轨迹抓取配置       | 86ms                    | –        | –          |
| 运单号规则         | 143ms                   | –        | –          |
| 打印格式           | 235ms                   | 18       | 2373       |
| **录单格式**       | **932ms + 83ms + 74ms** | 40       | 3660       |

规律与结论：

- 卡顿量级 ≈ **表格行数 × 每行组件/DOM 数量**：录单格式每行约 90 个 DOM 节点（Link + 复制图标 + Tooltip + 最多 3 个 NTag + 2 个按钮 + NPopconfirm），40 行 ≈ 3660 节点 → 近 1 秒阻塞。
- **dev 模式放大明显**：未压缩代码 + `vite-plugin-vue-devtools` 对每次组件创建的采集开销；生产构建预期显著好转（未单独构建实测）。
- 去掉页内 `<KeepAlive>` 后每次切 tab 都**重建**组件，卡的**频率**因此上升；根因修复后 KeepAlive 可安全恢复（切过的 tab 直接复用缓存，不再重建）。
- 首次进入设置页另有一次 ~1.1 秒长任务（各模块首次加载 + 首次挂载），第二次进入为 0。

## 相关文件

- `src/views/system-manage/setting/index.vue` —— 修复点（模板注释位置）
- `src/layouts/modules/global-content/index.vue` —— `<Transition mode="out-in">` + `<KeepAlive>` 所在
- `src/components/VerticalTabLayout/index.vue` —— 设置页壳布局

## 复现/验证探针（备查）

在页面控制台或 playwright `eval` 中（本机 shell 对 `>`、`|`、双引号、`$` 有解析，需用 IIFE + 单引号）：

1. 从 `document.body` 中找到带 `__vue_app__` 的容器 → `app._instance.subTree` 递归找到 `BaseTransition` 实例；
2. `KeepAlive 实例.subTree` → 页面组件 vnode → `.component.subTree` 即页面渲染根：
   - `String(type)` 为 `Symbol(v-fgt)` ⇒ 多根（有问题）
   - 为普通组件对象/`div` ⇒ 单根（正常）
3. 卡死时 `BaseTransition.subTree` 会是 clone 的 KeepAlive 且 `children === null`（isLeaving 卡住的标志）。
