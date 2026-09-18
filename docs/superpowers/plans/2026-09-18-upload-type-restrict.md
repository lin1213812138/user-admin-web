# 公共上传组件类型限制（统一收口）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把文件类型限制逻辑内聚到公共 `Upload` 组件内部（MIME+后缀双重校验），并让 FormWrap 的 `image`/`file` 表单项复用该公共组件，使所有上传入口都受统一限制，调用处零改动。

**Architecture:** 新增纯函数工具 `validateUploadFileType` 作为唯一格式判定来源；公共 `Upload` 组件在 `handleBeforeUpload` 中调用它拦截非法文件；FormWrap 删掉内联 `NUpload`(`image`/`file`)，改渲染公共 `<Upload>` 并通过 `FormItemConfig.accept`/`dest` 透传配置。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">`、Naive UI `NUpload`、TypeScript 6 strict、pnpm workspace monorepo。

## Global Constraints

- 包管理**只能用 pnpm**（禁止 npm/yarn）；Node >= 20.19.0，pnpm >= 10.5.0。
- 本仓库**没有测试框架、无 test 脚本**；验证手段仅 `pnpm typecheck` + `pnpm lint` + `pnpm build`（或 `pnpm build:test`）。本计划不臆造单测，每一步以 typecheck/lint 作为门禁。
- pre-commit 钩子顺序：`typecheck → lint → fmt → git diff --exit-code`；提交用 `pnpm commit` / `pnpm commit:zh`，**不要直接 `git commit`**。
- 国际化 key 必须**同时**维护 `src/locales/langs/zh-cn.ts` 与 `src/locales/langs/en-us.ts`。
- 本计划不新增任何路由页/视图文件，因此不存在 elegant-router 误扫 `index.vue` 问题；也不要新建 `index.vue`。
- 限制逻辑只存在一处（公共组件 + 其调用的工具函数），调用处（如 `user-operate-drawer.vue`、`ProfileInfo.vue`）零改动。

---

## File Structure

- **Create** `src/utils/common/upload.ts` —— 纯函数 `validateUploadFileType(file, accept)`，统一解析 `accept` 并做 MIME+后缀双重判断。
- **Modify** `src/components/Upload/index.vue` —— `handleBeforeUpload` 增加类型校验调用 + 引入工具函数；文案走 i18n `common.upload.invalidType`。
- **Modify** `src/components/Form/form-config.ts` —— `FormItemConfig` 新增 `accept?` / `dest?`。
- **Modify** `src/components/Form/index.vue` —— 删除 `image`/`file` 内联 `<NUpload>` 及仅服务于它的 `uploadFileList`/`handleUploadChange`/`uploadPreview`/`resolveUploadPreview` 与对应 `onBeforeUnmount` blob 回收；改为渲染公共 `<Upload>`。
- **Modify** `src/locales/langs/zh-cn.ts` 与 `src/locales/langs/en-us.ts` —— 在 `common.upload` 下新增 `invalidType`。
- 已落盘（非本计划产出，仅记录）：`docs/superpowers/specs/2026-09-18-upload-type-restrict-design.md`、`changelog/公共上传组件类型限制.md`、`AGENTS_CHANGELOG.md` 索引条目。

---

### Task 1: 新增 `validateUploadFileType` 工具函数

**Files:**

- Create: `src/utils/common/upload.ts`

**Interfaces:**

- Produces: `validateUploadFileType(file: File, accept?: string): boolean` —— 后续 Task 2 公共组件与 Task 4 FormWrap 共用此函数。

- [ ] **Step 1: 创建工具文件**

```ts
/**
 * 解析 accept 字符串，返回允许的后缀名集合（含点，小写）与允许的 MIME 前缀集合。
 * accept 支持三种写法：
 *   - 带通配：image/*  video/*            → MIME 前缀 image / video
 *   - 完整 MIME：image/png               → MIME 精确 image/png
 *   - 后缀名：.png,.jpg,.jpeg            → 后缀 .png/.jpg/.jpeg
 * accept 为空/undefined → 不限制（返回空集合，调用方直接放行）。
 */
function parseAccept(accept?: string): { suffixes: Set<string>; mimePrefixes: Set<string> } {
  const suffixes = new Set<string>();
  const mimePrefixes = new Set<string>();

  if (!accept) return { suffixes, mimePrefixes };

  for (const raw of accept.split(',')) {
    const token = raw.trim().toLowerCase();
    if (!token) continue;

    if (token.startsWith('.')) {
      suffixes.add(token);
    } else if (token.endsWith('/*')) {
      mimePrefixes.add(token.slice(0, -1)); // 去掉末尾 '*'，保留 "image/"
    } else {
      mimePrefixes.add(`${token}/`); // 精确 MIME 当作前缀匹配，如 image/png → image/png/
    }
  }

  return { suffixes, mimePrefixes };
}

/** 取得文件名小写后缀（含点），无后缀返回空串 */
function fileSuffix(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

/**
 * 判断文件是否符合 accept 限制。
 * 规则：file.type 命中任一 MIME 前缀，或文件名后缀命中任一后缀名 ⇒ 通过。
 * accept 为空 ⇒ 始终通过。
 */
export function validateUploadFileType(file: File, accept?: string): boolean {
  const { suffixes, mimePrefixes } = parseAccept(accept);
  if (mimePrefixes.size === 0 && suffixes.size === 0) return true;

  const type = (file.type || '').toLowerCase();
  const suffix = fileSuffix(file.name || '');

  if (mimePrefixes.size > 0 && type && mimePrefixes.has(`${type}/`.slice(0, type.indexOf('/') + 1))) {
    return true;
  }
  if (mimePrefixes.has(type)) return true; // 精确 MIME（image/png/ 形式）
  if (suffix && suffixes.has(suffix)) return true;

  return false;
}
```

> 注：上面的 MIME 前缀匹配用 `mimePrefixes.has(\`${type}/\`.slice(0, type.indexOf('/') + 1))`等价于「type 是否以某个前缀开头」，可简化为`Array.from(mimePrefixes).some(p => type.startsWith(p))`。实现时若更清晰，可直接写：
>
> ```ts
> if (mimePrefixes.size > 0 && type) {
>   for (const p of mimePrefixes) if (type.startsWith(p)) return true;
> }
> ```

- [ ] **Step 2: 类型检查门禁**

Run: `pnpm typecheck`
Expected: PASS（`src/utils/common/upload.ts` 为纯 TS，无依赖，类型零错误）。

- [ ] **Step 3: 提交（本任务独立可测，建议先提交）**

```bash
pnpm commit:zh
```

提交信息示例：`feat(upload): 新增 validateUploadFileType 文件类型校验工具`

---

### Task 2: 公共 `Upload` 组件接入类型校验 + i18n

**Files:**

- Modify: `src/components/Upload/index.vue:1-35`（import 区）、`:119-128`（`handleBeforeUpload`）
- Modify: `src/locales/langs/zh-cn.ts:55-58`（`common.upload` 块）
- Modify: `src/locales/langs/en-us.ts`（对应 `common.upload` 块）

**Interfaces:**

- Consumes: `validateUploadFileType(file: File, accept?: string): boolean`（Task 1）。
- Consumes: 组件既有 `resolvedAccept` computed（`props.accept ?? (isImageCard.value ? 'image/*' : undefined)`）。
- Produces: 公共组件在 `before-upload` 阶段拦截非法文件并 `$message.warning($t('common.upload.invalidType'))`。

- [ ] **Step 1: 引入工具函数**

在 `src/components/Upload/index.vue` 顶部 import 区增加：

```ts
import { validateUploadFileType } from '@/utils/common/upload';
```

- [ ] **Step 2: 修改 `handleBeforeUpload` 增加类型校验**

将现有函数（约第 120-128 行）：

```ts
function handleBeforeUpload({ file }: { file: UploadFileInfo }) {
  const maxSize = props.maxSize;

  if (!maxSize || (file.file?.size ?? 0) <= maxSize * 1024 * 1024) return true;

  window.$message?.warning($t('common.upload.exceedSize', { size: maxSize }));

  return false;
}
```

替换为：

```ts
function handleBeforeUpload({ file }: { file: UploadFileInfo }) {
  if (file.file && !validateUploadFileType(file.file, resolvedAccept.value)) {
    window.$message?.warning($t('common.upload.invalidType', { accept: resolvedAccept.value || '' }));

    return false;
  }

  const maxSize = props.maxSize;

  if (!maxSize || (file.file?.size ?? 0) <= maxSize * 1024 * 1024) return true;

  window.$message?.warning($t('common.upload.exceedSize', { size: maxSize }));

  return false;
}
```

> `resolvedAccept` 在第 66 行已定义为 `computed`，本文件内可直接引用，无需新增。

- [ ] **Step 3: zh-cn 增加 `invalidType`**

在 `src/locales/langs/zh-cn.ts` 的 `upload: { ... }` 块（`common.upload` 下，约第 55-58 行）新增一行：

```ts
    upload: {
      exceedSize: '文件大小不能超过 {size}MB',
      draggerText: '点击或者拖动文件到该区域来上传',
      invalidType: '文件格式不支持，仅支持 {accept}'
    },
```

- [ ] **Step 4: en-us 增加 `invalidType`**

在 `src/locales/langs/en-us.ts` 的 `common.upload` 对应块新增：

```ts
    upload: {
      exceedSize: 'File size cannot exceed {size}MB',
      draggerText: 'Click or drag file to this area to upload',
      invalidType: 'Unsupported file format, only {accept} allowed'
    },
```

- [ ] **Step 5: 类型检查 + lint 门禁**

Run: `pnpm typecheck && pnpm lint`
Expected: typecheck PASS；lint 无 error（`link.vue` 的 2 个既有 warning 不计入本次引入）。

- [ ] **Step 6: 提交**

```bash
pnpm commit:zh
```

提交信息示例：`feat(upload): 公共上传组件增加文件类型硬校验`

---

### Task 3: `FormItemConfig` 新增 `accept` / `dest`

**Files:**

- Modify: `src/components/Form/form-config.ts:21-61`（`FormItemConfig` 接口，紧接 `multiple?: boolean` 之后）

**Interfaces:**

- Produces: `FormItemConfig.accept?: string` 与 `FormItemConfig.dest?: Api.Upload.Dest`，供 Task 4 的 `image`/`file` 渲染读取。

- [ ] **Step 1: 在接口末尾追加字段**

在 `form-config.ts` 的 `FormItemConfig` 内，于 `multiple?: boolean;` 之后增加：

```ts
  /** 上传允许的文件类型（type 为 file 时自定义，如 '.pdf,.doc'；不传则 file 不限制、image 默认 image/*） */
  accept?: string;
  /** 上传目录（type 为 image / file 时透传给公共 Upload 组件，对应后端 dest；默认 1-用户） */
  dest?: Api.Upload.Dest;
```

> `Api.Upload.Dest` 为全局类型（`src/typings/api/*.d.ts` 命名空间，无需 import）。

- [ ] **Step 2: 类型检查门禁**

Run: `pnpm typecheck`
Expected: PASS。

- [ ] **Step 3: 提交**

```bash
pnpm commit:zh
```

提交信息示例：`feat(form): FormItemConfig 新增 accept/dest 配置项`

---

### Task 4: FormWrap 的 `image`/`file` 改用公共 `Upload` 组件

**Files:**

- Modify: `src/components/Form/index.vue` —— 删除第 132-195 行中**仅服务于 image/file 上传**的 `uploadPreview`/`uploadFileList`/`resolveUploadPreview`/`handleUploadChange`/`onBeforeUnmount` blob 回收；删除模板第 405-428 行 `image`/`file` 的内联 `<NUpload>`；新增 `<Upload>` 渲染。
- Modify: `src/components/Form/index.vue` import 区增加 `import Upload from '@/components/Upload/index.vue';`

**Interfaces:**

- Consumes: `validateUploadFileType`（已内聚在 Task 2 公共组件，FormWrap 无需再引用）。
- Consumes: `FormItemConfig.accept?` / `FormItemConfig.dest?`（Task 3）。
- Produces: FormWrap 的 `image` 类型渲染 `<Upload list-type="image-card" :accept="item.accept ?? 'image/*'">`；`file` 类型渲染 `<Upload list-type="file" :accept="item.accept">`；二者均 `v-model:value="model[item.key]"`，真实上传并回写 URL。

- [ ] **Step 1: 引入公共 Upload 组件**

在 `src/components/Form/index.vue` 顶部（与现有 `import { NColorPicker, NDatePicker, NUpload } from 'naive-ui';` 相邻）增加：

```ts
import Upload from '@/components/Upload/index.vue';
```

> 若 `NUpload` 仅被即将删除的 image/file 分支使用，可一并从 naive-ui import 中移除（删除前先确认全文件无其它 `NUpload` 引用）。

- [ ] **Step 2: 删除仅服务于 image/file 的上传辅助逻辑**

删除以下代码块（当前位于第 132-195 行附近，请按文件实际内容精确删除，避免误删其它控件逻辑）：

- `const uploadPreview = reactive<Record<string, string>>({});`（约 133 行）
- 函数 `uploadFileList(key, isImage)`（约 136-145 行）
- 函数 `resolveUploadPreview(file)`（约 162-168 行）
- 函数 `handleUploadChange(key, options)`（约 171-188 行）
- `onBeforeUnmount(() => { Object.values(uploadPreview).forEach(...) })`（约 191-195 行）

> 删除后确认：这些标识符在全文件中除 image/file 模板分支外不再被引用（`search_content` 搜 `uploadPreview`/`uploadFileList`/`handleUploadChange`/`resolveUploadPreview` 应为 0 命中）。

- [ ] **Step 3: 替换模板中的 image/file 分支**

将模板中（约第 405-428 行）：

```vue
<NUpload
  v-else-if="item.type === 'file'"
  :file-list="uploadFileList(item.key, false)"
  :max="1"
  :default-upload="false"
  :disabled="item.disabled"
  @change="handleUploadChange(item.key, $event)"
>
                <NButton size="small" :disabled="item.disabled">
                  <template #icon>
                    <icon-mdi-upload class="text-icon" />
                  </template>
                  {{ $t('common.chooseFile') }}
                </NButton>
              </NUpload>
<NUpload
  v-else-if="item.type === 'image'"
  :file-list="uploadFileList(item.key, true)"
  list-type="image-card"
  :max="1"
  :default-upload="false"
  :disabled="item.disabled"
  @change="handleUploadChange(item.key, $event)"
/>
```

替换为：

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
<Upload
  v-else-if="item.type === 'image'"
  v-model:value="model[item.key] as string"
  :dest="item.dest ?? 1"
  list-type="image-card"
  :accept="item.accept ?? 'image/*'"
  :max="1"
  :disabled="item.disabled"
/>
```

> `item.dest ?? 1` 的 `1` 对应 `Api.Upload.Dest` 的「用户」目录；调用方可在 `FormItemConfig` 覆盖。

- [ ] **Step 4: 类型检查 + lint 门禁**

Run: `pnpm typecheck && pnpm lint`
Expected: typecheck PASS（注意 `model[item.key] as string` 的类型断言；`Upload` 的 `value` prop 为 `string | string[]`，`as string` 满足）；lint 无 error。

- [ ] **Step 5: 提交**

```bash
pnpm commit:zh
```

提交信息示例：`refactor(form): image/file 表单项复用公共 Upload 组件并统一类型限制`

---

### Task 5: 全量验证 + 手动冒烟

**Files:**

- 无新改动，仅验证。

- [ ] **Step 1: 全量构建前门禁（typecheck + lint + fmt）**

Run:

```bash
pnpm typecheck && pnpm lint && pnpm fmt
```

Expected: 三者均 0 错误；`pnpm fmt` 格式化后 `git diff --exit-code`（pre-commit 同款）应通过（无残留差异）。

- [ ] **Step 2: 构建验证**

Run: `pnpm build:test`
Expected: 构建成功（验证 prod/test 打包不报类型/语法错误）。

- [ ] **Step 3: 手动冒烟（需用户 `pnpm dev` 确认）**

1. 启动 `pnpm dev`（端口 9527）。
2. 进入「系统管理 → 用户」，新增/编辑用户抽屉，找到「微信二维码」(`type:'image'`) 上传框。
3. 选择一个**非图片**文件（如 `.txt`/`.pdf`）→ 预期：被拦截，弹出「文件格式不支持，仅支持 image/\*」提示，不上传。
4. 选择一个**图片**文件（`.png`/`.jpg`）→ 预期：正常上传并卡片回显，`qrCodeUrl` 提交值为后端 URL。
5. （可选）在任一 `type:'file'` 表单项（如用户「附件」用 `custom` 插槽的不受影响；若有 `type:'file'` 项）验证 `accept` 透传生效。

- [ ] **Step 4: 收尾**

确认 `changelog/公共上传组件类型限制.md` 与 `AGENTS_CHANGELOG.md` 索引已含本变更（Task 前已建，无需重复）；若有实现偏差，回到对应 Task 修正后重新跑 Task 5 门禁。

---

## Self-Review

1. **Spec 覆盖**：spec 的 5 点（工具函数 / 公共组件校验 / FormWrap 复用 / 行为变更 URL / i18n / 调用处零改动）均有对应 Task（1/2/3/4/2/4）。✅
2. **占位扫描**：无 TBD/TODO；各代码步骤均给出完整片段。✅
3. **类型一致性**：`validateUploadFileType(file: File, accept?: string)` 在 Task 1 定义、Task 2 以 `validateUploadFileType(file.file, resolvedAccept.value)` 调用（`file.file` 为 `File | undefined`，已用 `file.file &&` 守卫）；`FormItemConfig.accept?/dest?` 在 Task 3 定义、Task 4 以 `item.accept`/`item.dest` 读取；`Api.Upload.Dest` 为既有全局类型。`Upload` 的 `value`/`dest`/`listType`/`accept`/`max`/`disabled`/`showFileList` props 与 `components/Upload/index.vue` 现有 Props 一致。✅
4. **行为变更**：Task 4 明确 `model[item.key]` 由文件名变为 URL（spec 已确认），调用处无需改。✅
