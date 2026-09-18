/**
 * 解析 accept 字符串，返回允许的后缀名集合（含点，小写）与允许的 MIME 前缀集合。
 * accept 支持三种写法：
 *   - 带通配：image/*  video/*            → MIME 前缀 image/ / video/
 *   - 完整 MIME：image/png               → 当作前缀 image/png/ 匹配
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

  if (mimePrefixes.size > 0 && type) {
    for (const prefix of mimePrefixes) {
      if (type.startsWith(prefix)) return true;
    }
  }

  if (suffix && suffixes.has(suffix)) return true;

  return false;
}
