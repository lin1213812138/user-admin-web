# VerticalTabLayout 左侧竖向 Tab 布局

「左侧竖向 tab 栏（含页面名称标题）+ 右侧内容区」的公共布局组件。右侧内容通过默认插槽传入，**既可以放表格，也可以放动态组件**。

## 文件位置

- 组件：`src/components/VerticalTabLayout/index.vue`
- 组件名：`VerticalTabLayout`

## 引入

组件会被 `unplugin-vue-components` 自动注册（可省略 import），但**推荐显式 import**，避免依赖自动生成的 `src/typings/components.d.ts`：

```ts
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
```

## Props

| 名称    | 类型                                           | 默认值 | 说明                                           |
| ------- | ---------------------------------------------- | ------ | ---------------------------------------------- |
| `value` | `string \| number`                             | —      | 当前激活的 tab，配合 `v-model:value` 使用      |
| `tabs`  | `{ value: string \| number; label: string }[]` | —      | tab 项列表，`value` 唯一标识、`label` 展示文案 |
| `title` | `string`                                       | `''`   | 左栏顶部页面名称（不传则不渲染标题区）         |

## 事件

| 名称           | 参数                        | 说明                             |
| -------------- | --------------------------- | -------------------------------- |
| `update:value` | `(value: string \| number)` | tab 切换，`v-model:value` 已处理 |

## 插槽

| 名称      | 说明                                                                 |
| --------- | -------------------------------------------------------------------- |
| `default` | 右侧内容区（自带 `p-10px` 内边距），可放 `Table`、动态组件等任意内容 |

## 用法示例

### 1）右侧放表格（左分类 + 右列表）

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import VerticalTabLayout from '@/components/VerticalTabLayout/index.vue';
// pagination / getData / handlePageChange 等来自 useVxeTable + Table 常规用法

const categories = [
  { id: 1, name: '业务清单导出' },
  { id: 2, name: '收货交接单导出' }
];

/** tab 值统一转字符串 */
const tabs = computed(() => categories.map(c => ({ value: String(c.id), label: c.name })));
const activeKey = ref(String(categories[0].id));

// api 闭包内读取 activeKey；切 tab 后手动重置分页并重新取数
watch(activeKey, () => {
  pagination.current = 1;
  getData();
});
</script>

<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" title="导出格式">
    <Table
      :columns="columns"
      :data="data"
      :pagination="pagination"
      @refresh="getData"
      @page-change="handlePageChange"
    />
  </VerticalTabLayout>
</template>
```

### 2）右侧放动态组件（同一页面切换多个子模块）

```vue
<template>
  <VerticalTabLayout v-model:value="activeKey" :tabs="tabs" :title="$t('route.system-manage_setting')">
    <component :is="activeComponent" :key="activeKey" class="h-full w-full" />
  </VerticalTabLayout>
</template>
```

`activeKey` 变化时组件重建（重新挂载、重新取数），**不要再套 `<KeepAlive>`**：布局层 `<Transition mode="out-in">` 与页面内嵌 `<KeepAlive>` 组合会触发 Vue 上游缺陷（见「注意事项」第 7 条），导致离开本页后内容区永久空白。

## 注意事项

1. **切 tab 不会自动刷新数据**：右侧是插槽，组件不知道内容语义。放表格时需自行 `watch(activeKey)` 重置分页 + `getData()`（参考 `export-format/ExportFormat.vue`）；放动态组件时用 `:key="activeKey"` 重建即可。
2. **`tabs` 的 `value` 支持 `string | number`**：原数据为数值 id 时需自行 `String(id)` 映射，在 api 闭包内再 `Number(activeKey)` 还原。
3. **左栏宽度自适应**（`w-fit`）：tab 文案越长左栏越宽；tab 项过多时左栏内部滚动，不会撑破页面。
4. **右栏自带 `p-10px`**：组件暂未暴露 padding 配置，页面如需贴边自行处理。
5. **左栏 tab 外层包裹 div 不可删**：naive `.n-tabs` 自带 `width:100%`，直接当 flex item 会占满整行、把右侧 `flex-1` 挤成 0 宽。
6. 页面若位于 `base-layout` 内容区且需要整体贴边，请用 `base-layout` 的 `contentShowPadding` 路由名排除机制，不要在页面里用 `!important` 覆盖。
7. **页面内不要再套 `<KeepAlive>` 包动态组件**：布局层 `<Transition mode="out-in">` 与页内 `<KeepAlive>` 组合会触发 Vue 上游缺陷（vuejs/core#11775），表现为离开本页后所有 SPA 跳转都空白；动态组件场景用 `:key` 重建即可。

## 已接入页面

| 页面                                    | 用法                                                        |
| --------------------------------------- | ----------------------------------------------------------- |
| `views/system-manage/setting/index.vue` | 标题「系统设置」，右侧 componentMap 动态组件（切 tab 重建） |
| `views/data-manage/basic/index.vue`     | 标题「基础资料」，右侧 5 个档案懒加载组件（切 tab 重建）    |
| `views/data-manage/business/index.vue`  | 标题「业务资料」，右侧 9 个档案懒加载组件（切 tab 重建）    |
| `views/data-manage/finance/index.vue`   | 标题「财务资料」，右侧 4 个档案懒加载组件（切 tab 重建）    |
