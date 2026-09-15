# 基础信息初始化：公司 LOGO 改用上传组件

日期：2026-09-15

## 背景

用户："基础信息初始化的公司logo要使用上传组件"——「系统设置 → 初始化数据 → 基本信息初始化」的公司 LOGO
原为文本输入框（placeholder「LOGO 图片 URL」），要求换成上传组件。

## 改动

`src/views/system-manage/setting/modules/init-data/BasicInfoForm.vue`：

- `companyLogo` 字段 `type: 'input'` → `type: 'image'`，删除 `placeholder: 'LOGO 图片 URL'`。

复用 `FormWrap` 既有 `image` 控件（`NUpload` + `list-type="image-card"`、`max: 1`、`default-upload: false`），
与用户管理「微信二维码」同款：本地选择图片即预览（blob），`model.companyLogo` 存文件名；后端上传接口就绪后
由 `FormWrap` 统一接入真实上传（当前 DEV 无上传接口，属既有约定）。

## 不改动

- `FormWrap`（图片控件实现已存在，零改动）、i18n 文案、其它字段与保存逻辑。

## 验证

- `pnpm typecheck` 0 错误；单文件 oxfmt / oxlint / eslint 0；
- 无浏览器端到端（本地无后端会话），视觉确认由用户进行。
