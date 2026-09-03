# 录单格式列表 hover 与选中高亮失效

## 问题现象

系统设置 - 录单格式页，左侧 `MasterDetail` 列表：

- 鼠标 hover 列表项无任何反馈；
- 点击切换时选中项没有高亮，看起来像「没选中」。

## 根因

`src/views/system-manage/setting/components/MasterDetail.vue` 的列表项样式直接写了全局 CSS 变量：

```css
.menu-item:hover {
  background-color: var(--primary-color-hover);
}
.menu-item--active {
  color: #fff;
  background-color: var(--primary-color);
}
```

但本项目 `App.vue` 的 `NConfigProvider` 并未把这些变量以可继承的 DOM 变量形式稳定暴露，运行时 app 根节点上不存在 `--primary-color` / `--primary-color-hover`。`src/plugins/loading.ts` 只在启动加载屏临时写过一份 `--primary-color`，启动后即被替换，对运行时无影响。

结果：

- hover 背景取不到变量 → 无 hover 反馈；
- 选中态 `background-color` 取不到，只剩 `color:#fff` → 白字白底，肉眼看不出高亮。

## 修复

参照项目已有的 `src/components/common/link.vue` 范式，改用 `useThemeVars()` 从最近的 `NConfigProvider` 读取响应式主题色，在根容器通过 `:style` 注入为局部 CSS 变量（CSS 变量会继承到子节点），scoped 样式引用该局部变量：

```ts
import { useThemeVars } from 'naive-ui';
const themeVars = useThemeVars();
```

```html
<div
  class="h-full w-full flex overflow-hidden"
  :style="{ '--menu-primary': themeVars.primaryColor, '--menu-primary-hover': themeVars.primaryColorHover }"
></div>
```

```css
.menu-item:hover {
  background-color: var(--menu-primary-hover);
}
.menu-item--active {
  color: #fff;
  background-color: var(--menu-primary);
}
```

优点：不依赖全局变量是否注入 DOM，且随亮/暗主题切换自动更新。

## 附带改动

- `input-format/index.vue` 的演示数据由 2 条扩充到 10 条，覆盖启用/禁用、不同适用范围（内部/客户/微信）与不同字段映射组合，便于测试列表与字段映射。
