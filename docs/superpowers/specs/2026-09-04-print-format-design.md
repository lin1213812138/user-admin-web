# 打印格式界面实现设计

日期：2026-09-04
范围：`src/views/system-manage/setting/modules/PrintFormat.vue` 及相关组件、api、类型、i18n

## 一、背景

设置页「打印格式」tab 当前是占位状态（`MasterDetail` + `LookForward` 空组件），没有真实业务内容。
目标：按产品截图实现左侧固定分类 + 右侧模板管理表格 + 新建/查看/复制/删除/设为默认 的完整交互。

已确认前提（用户决策）：

1. **数据来源**：纯前端 mock。在 `service/api` 层预留接口函数，DEV 下返回内存 mock；后续接真后端只需改 api 实现。
2. **表单范围**：简单字段表单。`Drawer` + `FormWrap` 录入（模板名称、标签尺寸、备注、是否默认）；查看为只读详情。不含标签设计画布。
3. **左侧实现**：复用 `MasterDetail` 组件，4 个固定分类作为 items，关闭状态点/操作栏，隐藏搜索框。

## 二、整体结构

- 复用设置页 `setting/modules/PrintFormat.vue`。
- 左侧：`MasterDetail` 承载 **固定 4 个分类**（数据写死，非接口）。
- 右侧：`MasterDetail` 的默认 slot 放 **顶部操作栏（新建/删除）+ 模板表格**。
- 分类切换驱动右侧表格数据切换。

固定分类（业务数据常量，不进 i18n，与 InputFormat 格式名写法一致）：

```ts
const categories = [
  { id: 1, name: '内单标签' },
  { id: 2, name: '转单标签' },
  { id: 3, name: '形式发票' },
  { id: 4, name: '总单标签' }
];
```

## 三、左侧固定分类（改造 `MasterDetail`）

`MasterDetail` 当前无条件渲染搜索框。新增 prop：

- `showSearch?: boolean`（默认 `true`）。为 `false` 时不渲染搜索 `NInput`。
- 本页使用：`:show-search="false"`、`:show-status="false"`、`:show-actions="false"`。

传入 `:items="categories"`、`:selected-id="selectedCategoryId"`，`@update:selected-id` 更新状态并触发右侧表格刷新。

## 四、右侧表格 + 顶部操作

使用通用 `<Table>` 组件（不绕过 `useVxeTable`）。

### 列定义（按截图）

| 字段             | 标题       | 类型/渲染                                           |
| ---------------- | ---------- | --------------------------------------------------- |
| `name`           | 模板名称   | 文本                                                |
| `labelSize`      | 标签尺寸   | 文本（如 `100×150mm`）                              |
| `isDefault`      | 是否默认   | 自定义插槽：`是`(success NTag) / `否`(default NTag) |
| `generatedCount` | 已生成标签 | 数字                                                |
| `remark`         | 备注       | 文本，`show-overflow="tooltip"`                     |
| `lastEditor`     | 最后编辑   | 文本                                                |
| `editTime`       | 编辑时间   | 文本（yyyy-MM-dd HH:mm）                            |
| （操作列）       | 操作       | 查看 / 复制 / 设为默认                              |

- `useVxeTable({ api, transform })`：`api` 闭包读取当前 `selectedCategoryId.value`，分类切换或增删后调用 `getData()` 刷新。
- 表格 `showCheckbox` 支持批量删除；`showAction` 渲染操作列。
- 顶部操作栏放在 `Table` 的 `#operation-left` 插槽：**新建**（开抽屉）、**删除**（删除勾选行，带 `window.$dialog` 确认，无勾选时禁用）。
- `#operation-right`：刷新按钮 + 列设置（`TableColumnConfig`，`cacheKey="setting-print-format"`），`@confirm="persistColumns"`。
- 列宽与溢出遵循通用 Table 约定（`:column-config="{ resizable: true }"`、`show-overflow="tooltip"`）。

## 五、新建 / 查看 / 复制 抽屉

统一使用 `@/components/common/drawer.vue` + `FormWrap`：

表单字段（`FormItemConfig[]`）：

- `name`：模板名称，type `input`，required，span 24
- `labelSize`：标签尺寸，type `select`，options：`100×150mm` / `80×60mm` / `A4` / `100×100mm` / `自定义`，span 24
- `isDefault`：是否默认，type `switch`，`checkedValue:1` / `uncheckedValue:0`，span 24
- `remark`：备注，type `textarea`，span 24

三种打开模式：

- **新建**：空模型，可编辑，标题「新建打印模板」。提交走 `fetchCreatePrintTemplate`。
- **查看**：`:disabled` 只读，标题「打印模板详情」。
- **复制**：预填当前行数据并生成新 id，可编辑，标题「复制打印模板」。提交走 `fetchCreatePrintTemplate`（复制为新记录）。

行操作：

- **查看**：开只读抽屉。
- **复制**：开预填抽屉。
- **设为默认**：调 `fetchSetDefaultPrintTemplate`，把同分类其它模板 `isDefault` 置 0、当前置 1，成功后 `getData()` 刷新 + `$message.success`。

## 六、数据层（mock + service/api）

新建 `src/service/api/print-format.ts`：

```ts
export function fetchGetPrintTemplateList(params: { categoryId: number; current: number; size: number }) {
  if (import.meta.env.DEV) {
    return mockGetPrintTemplateList(params) as unknown as Promise<Api.PrintFormat.List>;
  }
  return request<Api.PrintFormat.List>({ url: '/print/template/list', method: 'post', data: params });
}
// fetchCreatePrintTemplate / fetchUpdatePrintTemplate / fetchDeletePrintTemplate
// fetchCopyPrintTemplate / fetchSetDefaultPrintTemplate 同理
```

- DEV 下维护模块级 `mockDb: Api.PrintFormat.Template[]`，按 `categoryId` 过滤、增删改持久化于内存（create/delete/setDefault 直接改 mockDb）。
- 生产分支 `request(...)` 路径先占位，待后端联调替换。
- 命名以 `fetch` 开头，遵循项目约定。

类型放 `src/typings/api/print-format.d.ts`：

```ts
declare namespace Api {
  namespace PrintFormat {
    interface Template {
      id: number;
      categoryId: number;
      name: string;
      labelSize: string;
      isDefault: Api.Common.EnableStatus; // 0|1
      generatedCount: number;
      remark: string;
      lastEditor: string;
      editTime: string;
    }
    interface List {
      records: Template[];
      total: number;
    }
    // CreateParams / UpdateParams / DeleteParams / CopyParams / SetDefaultParams
  }
}
```

> 注：本模块 mock 内 `isDefault` 用 `0/1` 数字，遵循全局 `Api.Common.EnableStatus` 约定。

## 七、i18n 与类型

- `locales/langs/zh-cn.ts` / `en-us.ts` 新增 `page.manage.setting.printFormat.*` 键：
  列名（name/labelSize/isDefault/generatedCount/remark/lastEditor/editTime）、按钮（create/delete/view/copy/setDefault）、抽屉标题（newTitle/detailTitle/copyTitle）、是否默认文案（yes/no）等。
- 在 `typings/app.d.ts` 的 `App.I18n.Schema` 同步上述键，避免 `pnpm typecheck` 报 `I18nKey`。
- 分类名作为业务数据常量写死（与 InputFormat 一致），不进 i18n。

## 八、涉及文件清单

| 动作         | 文件                                                                                    |
| ------------ | --------------------------------------------------------------------------------------- |
| 改           | `src/views/system-manage/setting/modules/PrintFormat.vue`                               |
| 改           | `src/views/system-manage/setting/components/MasterDetail.vue`（新增 `showSearch` prop） |
| 新增         | `src/service/api/print-format.ts`                                                       |
| 新增         | `src/typings/api/print-format.d.ts`                                                     |
| 改           | `src/locales/langs/zh-cn.ts`                                                            |
| 改           | `src/locales/langs/en-us.ts`                                                            |
| 改           | `src/typings/app.d.ts`                                                                  |
| 改（索引）   | `AGENTS_CHANGELOG.md`                                                                   |
| 新增（记录） | `changelog/打印格式界面实现.md`                                                         |

## 九、验证

- `pnpm typecheck` 通过（新增 i18n 键三处同步、类型无 `any`）。
- `pnpm lint` 通过（注意现有 `PrintFormat.vue` 的 6 个 unused-vars 误报需一并处理：本实现重写该文件，删除占位 `Item` 接口与未用 `LookForward` 引用）。
- `pnpm dev` 手动走查：左侧 4 分类切换、表格列/分页、新建/查看/复制抽屉、设为默认、批量删除。
