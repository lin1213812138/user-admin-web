# AGENTS_CHANGELOG

> 本文件维护所有 Agent 讨论/修复记录的索引，**按日期分组（最新日期在上）**。详细文档见 `changelog/` 目录。

## 2026-09-05

- [分配权限界面改为表格模式（抽屉内 vxe 树形表格 + 双接口拼接列数据，已实现待手测）](./changelog/%E5%88%86%E9%85%8D%E6%9D%83%E9%99%90%E7%95%8C%E9%9D%A2%E6%94%B9%E4%B8%BA%E8%A1%A8%E6%A0%BC%E6%A8%A1%E5%BC%8F.md)
- [导出组件增加「数据范围」选项（全部 / 当前页 / 勾选数据），仅作用于 exceljs 字段选择弹窗（已实现，待手测）](./changelog/%E5%AF%BC%E5%87%BA%E8%8C%83%E5%9B%B4%E9%80%89%E9%A1%B9%E8%AE%BE%E8%AE%A1.md)
- [导出字段弹窗升级为「可新增字段」的编辑表格（可编辑列名 + 拖拽排序 + 自定义字段取数据/固定值）](./changelog/%E5%AF%BC%E5%87%BA%E5%AD%97%E6%AE%B5%E5%BC%B9%E7%AA%97%E5%8D%87%E7%BA%A7%E4%B8%BA%E5%8F%AF%E6%96%B0%E5%A2%9E%E5%AD%97%E6%AE%B5%E7%9A%84%E7%BC%96%E8%BE%91%E8%A1%A8%E6%A0%BC.md)
- [Table action-export 改为打开 vxe-table 原生高级导出弹窗](./changelog/Table%20action-export%20%E6%89%93%E5%BC%80%20vxe%20%E9%AB%98%E7%BA%A7%E5%AF%BC%E5%87%BA%E5%BC%B9%E7%AA%97.md)
- [共用导出 v3：Table 右上 action-export 回归 vxe 原生一键导出 + exceljs 字段选择导出放表格左侧操作栏（两套并存）](./changelog/共用导出组件设计.md)

## 2026-09-04

- [导出格式界面实现（左侧 13 项固定分类 + 右侧模板表格 + 新建/编辑含上传文件/删除，下载为占位）](./changelog/导出格式界面实现.md)
- [打印格式界面实现（左侧固定分类 + 右侧模板表格 + 新建/查看/复制/删除/设为默认）](./changelog/打印格式界面实现.md)
- [菜单「状态」选了仍报必填（FormWrap 必填规则带 trigger 导致数字值被判空）](./changelog/菜单状态必填校验失败.md)
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
