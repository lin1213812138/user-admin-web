# 系统设置 tab 栏不够突出

## 问题现象

系统设置页顶部的 7 个内页 tab（录单格式 / 打印格式 / 导出格式 / 运单号规则 / 通知配置 / 初始化数据 / 站点扫描配置）使用 `NTabs type="segment"`，与页面背景融为一体，边界不明显，视觉上不够突出。

## 根因

`src/views/system-manage/setting/index.vue` 中 `NTabs` 直接放在 `p-16px` 的页面容器里，没有额外背景或边框；segment 类型本身又偏扁平，导致 tab 栏看起来像是「浮在空白页面上」，层次弱。

## 修复

用 `NCard` 包裹 `NTabs`，并收紧卡片内容区内边距：

```vue
<NCard class="mb-16px" :content-style="{ padding: '8px' }">
  <NTabs :value="activeKey" type="segment" @update:value="handleTabChange">
    <NTabPane v-for="t in tabs" :key="t.key" :name="t.key" :tab="t.label" />
  </NTabs>
</NCard>
```

效果：

- tab 栏区域获得卡片背景、边框与阴影（随亮/暗主题自动切换），从页面背景中凸显出来。
- `mb-16px` 让 tab 栏与下方内容区保持清晰间距。
- `content-style="{ padding: '8px' }"` 避免默认卡片内边距过大，保持 tab 栏紧凑。
- 保留 `type="segment"` 的等分布局，7 个 tab 仍然均匀分布。

## 验证

- `pnpm typecheck` 0 error。
- `pnpm fmt` 已格式化。
