# 公共上传组件类型限制（统一收口）

> 日期：2026-09-18
> 状态：设计已批准（待实现）

## 背景 / 问题

用户贴「微信二维码」上传截图，要求上传组件只能选指定类型格式。排查发现存在**两套上传实现**：

1. `src/components/Upload/index.vue` —— 真正的公共上传组件（调 `/upload` 接口、回写 URL）。已支持 `accept`，但 `handleBeforeUpload` **只校验大小，不校验格式**（拖拽可绕过 `accept`）。
2. `src/components/Form/index.vue` 内联 `NUpload`（`image` / `file` 类型，第 420-428 行）——**连 `accept` 都没设**，任何格式都能选。截图中的「微信二维码」(`user-operate-drawer.vue` 的 `qrCodeUrl`，`type:'image'`) 走的就是这套。

结论：只给公共组件加限制，对截图那个框**不生效**（它不是同一个组件）。

## 目标

- 文件类型限制逻辑**只存在一份**（公共组件内部），调用方零感知。
- 所有上传入口复用公共 `Upload` 组件，不再各自内联 `NUpload`。
- 校验强度：MIME(`file.type`) + 后缀名双重判断，任一满足即通过。

## 设计

### 1. 新增工具函数 `src/utils/common/upload.ts`

```ts
export function validateUploadFileType(file: File, accept?: string): boolean;
```

- 解析 `accept`（逗号分隔），支持三种写法：
  - `image/*` / `video/*` 等带 `*` 的 MIME 前缀
  - `image/png` 等完整 MIME
  - `.png,.jpg,.jpeg` 等后缀名（`.` 开头）
- 判断规则：`file.type` 匹配任一 MIME（含 `*` 前缀）**或** `file.name` 后缀名匹配任一后缀 ⇒ 通过。
- `accept` 为空 ⇒ 直接通过（不限制）。

### 2. 公共 `Upload` 组件 `components/Upload/index.vue`

- `import { validateUploadFileType } from '@/utils/common/upload'`。
- `handleBeforeUpload`：大小校验之后追加类型校验：

```ts
if (!validateUploadFileType(file.file, resolvedAccept.value)) {
  window.$message?.warning($t('common.upload.invalidType', { accept: resolvedAccept.value }));
  return false;
}
```

- `image-card` 默认 `resolvedAccept = 'image/*'` 不变；`file` / `dragger` 默认不限制（传 `accept` 才限制）。

### 3. FormWrap `Form/index.vue` 改用公共组件

- 删除内联 `image` / `file` 的 `<NUpload>`（第 405-428 行）及其配套 `uploadFileList` / `handleUploadChange` / `uploadPreview` 中**仅服务于 image/file 的部分**（如 `handleUploadChange` 仅被 image/file 使用则可整体移除；`uploadPreview` 仅 image 用，一并移除）。
- `image` 类型改为：

```vue
<Upload
  v-else-if="item.type === 'image'"
  v-model:value="model[item.key] as string"
  :dest="item.dest ?? 1"
  list-type="image-card"
  :accept="item.accept ?? 'image/*'"
  :max="1"
  :disabled="item.disabled"
  @success="..."   <!-- 如需回填可省略，v-model 已回写 -->
/>
```

- `file` 类型改为：

```vue
<Upload
  v-else-if="item.type === 'file'"
  v-model:value="model[item.key] as string"
  :dest="item.dest ?? 1"
  list-type="file"
  :accept="item.accept"
  :max="1"
  :disabled="item.disabled"
  show-file-list
/>
```

- `FormItemConfig` 新增可选字段：
  - `accept?: string`（file 类型自定义允许格式，默认不限制；image 类型默认 `image/*`）
  - `dest?: Api.Upload.Dest`（上传目录，默认 `1`-用户）

### 4. 行为变更（已与用户确认）

FormWrap 的 `image` / `file` 类型复用公共组件后，**会真实调 `/upload` 并回写 URL**（原内联 `NUpload` 是 `default-upload=false`，只存文件名、不上传）。`qrCodeUrl` 等字段提交值由「文件名」变为「URL」，这是更正确的口径（二维码需 URL 才能展示/下载）。

### 5. i18n

`src/locales/langs/zh-cn.ts` / `en-us.ts` 的 `common.upload` 下新增：

- `invalidType`: 中文「文件格式不支持，仅支持 {accept}」 / 英文「Unsupported file format, only {accept} allowed」

## 不改范围

- 调用处（`user-operate-drawer.vue`、`personal-center` 等）仅声明 `type:'image'` 即自动受 `image/*` 限制，**零改动**。
- 不新增上传目录、不动后端、不动路由/菜单。
- 公共组件的 `refId` 附件入库模式不变。

## 验证

- `pnpm typecheck` 0
- `pnpm lint` 0 error
- `pnpm fmt`
- 手动：`pnpm dev` 后在用户新增抽屉点「微信二维码」选一个非图片文件，预期被拦截并提示；选图片可正常上传回显。
