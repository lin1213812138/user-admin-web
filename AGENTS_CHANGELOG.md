# AGENTS_CHANGELOG

> 本文件维护所有 Agent 讨论/修复记录的索引，**按日期分组（最新日期在上）**。详细文档见 `changelog/` 目录。

## 2026-09-04

- [录单格式「字段映射」高度自适应占满（MasterDetail slot 容器撑满 + FieldMapping fill）](./changelog/录单格式字段映射高度自适应占满.md)
- [录单格式列表启用/禁用不明显（MasterDetail 状态改实心彩色徽标）](./changelog/录单格式列表启用禁用不明显.md)
- [设置页整理：字段映射项改为 key/label/span 结构 + 清空其余 5 页占位内容（LookForward 空状态）](./changelog/设置页整理字段映射结构与占位清理.md)

## 2026-09-03

- [设置页 MasterDetail：启用/禁用与操作栏改为可选（showStatus/showActions）](./changelog/设置页MasterDetail状态与操作栏改为可选.md)
- [设置页操作按钮样式统一（工具栏 ghost 一致）](./changelog/设置页操作按钮样式统一.md)
- [系统设置点开卡死：路由重定向死循环修复（子页移出自动路由目录）](./changelog/系统设置点开卡死-路由重定向死循环修复.md)
- [录单格式列表 hover 样式修正（hover 与选中态区分）](./changelog/录单格式列表hover样式修正.md)
- [系统设置 tab 栏不够突出：NCard 包裹增强视觉层次](./changelog/系统设置tab栏不够突出.md)
- [系统设置右侧内容区补充背景卡片（MasterDetail 右侧 NCard 包裹）](./changelog/系统设置右侧内容区补充背景卡片.md)
- [系统设置：顶层 tab 固定显示「系统设置」+ 页内 tab 切子模块](./changelog/系统设置顶层tab显示系统设置.md)
- [系统设置：单一菜单项 + tab 切换（hiddenRoutes 配置 + 默认进入录单格式）](./changelog/系统设置单一菜单项与tab切换.md)
- [录单格式列表 hover 与选中高亮失效修复（改用 useThemeVars）](./changelog/录单格式列表hover与选中高亮修复.md)
- [pnpm release 提交被 pre-commit 钩子拦截（git diff --exit-code 失败）](./changelog/pnpm-release 提交被 pre-commit 拦截.md)
- [侧边栏菜单顺序 vs elegant-router 自动重排路由文件](./changelog/路由菜单顺序与elegant路由生成.md)
- [资料管理子档案按需懒加载（KeepAlive 缓存）](./changelog/资料管理子档案按需懒加载.md)
- [搜索栏独立封装为 SearchBar 组件（通用 Table 配置委托、各界面独立配置）](./changelog/搜索栏内置通用Table组件.md)

## 2026-09-01

- [菜单管理样式对齐](./changelog/菜单管理样式对齐.md)
- [菜单管理多级测试数据](./changelog/菜单管理多级测试数据.md)（已撤销）
- [菜单管理树形子级不显示](./changelog/菜单管理树形子级不显示.md)
- [图标选择器封装](./changelog/图标选择器封装.md)
- [图标选择器接入 xicons（@vicons）](./changelog/图标选择器接入xicons.md)
- [菜单排序必填校验不通过（number 字段缺 type）](./changelog/菜单排序必填校验不通过.md)
- [菜单管理操作列「增加子菜单」](./changelog/增加子菜单.md)
- [资料管理模块设计](./changelog/资料管理模块设计.md)（基础/财务/业务资料，方案 A 通用配置驱动组件）
- [pnpm release 命令报错诊断](./changelog/pnpm-release命令报错诊断.md)
- [资料管理子档案左侧子导航（不作为路由/菜单）](./changelog/资料管理子档案左侧子导航.md)

## 2026-08-31

- [重写 AGENTS 文档结构](./changelog/重写AGENTS文档结构.md)
- [菜单管理模块设计](./changelog/菜单管理模块设计.md)
- [角色管理搜索区改用 FormWrap](./changelog/角色管理搜索区改用FormWrap.md)
- [FormWrap 展开/收起 + 右侧独立按钮区 设计与实现](./changelog/FormWrap展开收起设计.md)
