# data-manage 子档案按需懒加载设计

日期：2026-09-03
状态：已与用户确认（方案：首次访问才加载 + 界面缓存）

## 背景 / 问题

`src/views/data-manage/{basic,finance,business}/index.vue` 三个模块页当前结构几乎相同：

- 静态 `import` 本模块全部 4 个子档案组件（`@/components/MasterData/archives/**/index.vue`）；
- 页面 `onMounted` 后通过 `requestIdleCallback` 把本页 **4 个子档案全部标记为已挂载**；
- 每个子档案本质是 `MasterDataArchive` 实例，其 `setup` 中 `useVxeTable({ immediate: true })` 会立即**初始化一张 VXE 表格并发起一次数据请求**。

因此打开任意模块页 = 一次性构建 4 张表格 + 发起 4 个请求（+ 4 份 mock 数据载入），首屏明显卡顿。

## 目标

- 打开模块页时只构建**当前默认选中的 1 个子档案**（1 张表格 + 1 个请求）；
- 点击其它子档案时才**首次加载**对应档案（异步 chunk）；
- **已访问过的子档案界面必须缓存**：切回时秒显、搜索条件 / 页码 / 已选行状态不丢；
- 不改路由 / 菜单 / i18n / mock / `MasterDataArchive` 本身；可被 `pnpm typecheck` + `pnpm lint` 验证。

## 非目标

- 不改后端接口与 mock 数据结构；
- 不做虚拟滚动、不做数据预取（访问过即缓存，不做"空闲预加载全部"）。

## 方案：抽共享切换容器 + 异步组件 + 懒挂载缓存

### 1. 新增共享容器 `src/components/MasterData/archive-switch.vue`

职责：渲染左侧子档案导航 + 右侧内容区，统一管理激活态与"访问过即缓存"的 DOM 保留。

Props（单一定义类型）：

```ts
interface ArchiveSwitchItem {
  key: string;
  labelKey: App.I18n.I18nKey;
  load: () => Promise<{ default: Component }>;
}
defineProps<{ items: ArchiveSwitchItem[] }>();
```

内部要点：

- 遍历 `items` 用 `defineAsyncComponent({ loader: item.load, loadingComponent })` 生成异步组件（每个档案独立 chunk）；`loadingComponent` 为居中 `<NSpin>` 的全屏容器组件。
- 维护 `activeKey`（默认第一个）。
- 内容区**同一时刻只渲染激活的那个档案**，外层用 `<KeepAlive>` 包裹实现界面缓存：

```vue
<div class="relative min-w-0 flex-1">
  <div class="absolute inset-0">
    <KeepAlive>
      <component :is="asyncComps[activeKey]" :key="activeKey" />
    </KeepAlive>
  </div>
</div>
```

- `handleSelect(key)` 仅置 `activeKey = key`。首次点击某档案触发 async chunk 加载，`loadingComponent` 覆盖加载期；访问过的档案由 `KeepAlive` 缓存（组件实例不销毁、DOM 卸载），切回时秒恢复、搜索条件/页码保留、**不再重发请求**。

### 2. 三个模块页瘦身为纯配置壳

`src/views/data-manage/{basic,finance,business}/index.vue` 全部替换为：

```vue
<script setup lang="ts">
import ArchiveSwitch from '@/components/MasterData/archive-switch.vue';

const items = [
  {
    key: 'customer',
    labelKey: 'page.dataManage.basic.customer.title',
    load: () => import('@/components/MasterData/archives/basic/customer/index.vue')
  }
  // ... 其余 3 项
];
</script>

<template>
  <ArchiveSwitch :items="items" />
</template>
```

每个模块项 key 与 `labelKey` 沿用现有 `archiveMap` 中的值；`load` 指向各自档案 `index.vue`（目录不变，elegant-router 不会把它当路由——组件仍在 `components/` 下）。

### 3. 需要改动的文件清单

| 文件                                           | 动作         |
| ---------------------------------------------- | ------------ |
| `src/components/MasterData/archive-switch.vue` | 新增共享容器 |
| `src/views/data-manage/basic/index.vue`        | 改为配置壳   |
| `src/views/data-manage/finance/index.vue`      | 改为配置壳   |
| `src/views/data-manage/business/index.vue`     | 改为配置壳   |

不改：路由、菜单、i18n、mock、`MasterDataArchive`、`Table`、`FormWrap`。

## 行为对照

| 场景           | 现状                   | 改造后                                         |
| -------------- | ---------------------- | ---------------------------------------------- |
| 打开模块页     | 构建 4 表格 + 4 请求   | 构建 1 表格 + 1 请求                           |
| 点击未访问档案 | 实例已预建，切换瞬开   | 首次异步加载该档案（短暂 loading），加载后缓存 |
| 切回已访问档案 | 状态保留、秒开         | KeepAlive 缓存恢复，状态保留、秒开、不重发请求 |
| 模块间跳转     | 离开页面组件销毁       | 不变（路由级），再进入重新走本流程             |
| 生产 chunk     | 4 档案打在同一页 chunk | 每档案独立 chunk，按需下载                     |

## 验证

- `pnpm typecheck` 0 error；
- `pnpm lint` 0 error；
- 浏览器手测：依次打开基础/财务/业务三页，Network 确认仅加载当前档案 chunk + 1 个列表请求；点击其余档案仅首次新增 1 个 chunk 请求，切回已看档案无网络请求且搜索条件保留。

## 相关记录

- 变更记录文件：`changelog/资料管理子档案按需懒加载.md`
