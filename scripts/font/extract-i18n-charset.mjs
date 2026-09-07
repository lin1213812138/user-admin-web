/**
 * 自动提取国际化文案与业务源码中的文字，生成字体子集化用的字符表。
 *
 * 说明：
 * - 扫描范围：views / components / layouts / locales / constants / typings / router / store；
 *   覆盖 i18n 文案 + 页面/组件模板中的硬编码中文。
 * - 跳过 src/service 目录（内含 DEV mock 假数据，避免污染字符表）。
 * - 提取范围：CJK 汉字 + CJK/全角标点 + 中文常用符号；
 * - 叠加基础 ASCII 可打印字符（0x20~0x7E），保证英数字母/半角标点同字体显示；
 * - 输出为单行、无分隔字符表，可直接作为 fontmin / cn-font-split 的 text 输入。
 *
 * 用法：node scripts/font/extract-i18n-charset.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const OUT_FILE = resolve(ROOT, 'src/assets/fonts/zh-web-charset.txt');

/** 待扫描目录（相对 src）：i18n + 界面业务源码 */
const SCAN_DIRS = ['views', 'components', 'layouts', 'locales/langs', 'constants', 'typings', 'router', 'store'];

// 汉字、CJK 标点/全角符号、中文常用标点（含间隔号 ·）
const CJK_PATTERN = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\u2014\u2018\u2019\u201c\u201d\u2026\u00b7]/g;
const HAN_PATTERN = /[\u4e00-\u9fff]/g;

/** 递归收集目录下全部文件 */
function collectFiles(dir) {
  const result = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      result.push(...collectFiles(full));
    } else {
      result.push(full);
    }
  }
  return result;
}

const srcRoot = resolve(ROOT, 'src');
const scanRoots = SCAN_DIRS.map(dir => resolve(srcRoot, dir));

/** 跳过 DEV mock 假数据所在目录 */
function shouldSkip(file) {
  const rel = relative(srcRoot, file);
  return rel.includes(`${sep}service${sep}`);
}

const files = scanRoots
  .flatMap(root => (statSync(root).isDirectory() ? collectFiles(root) : []))
  .filter(file => /\.(ts|vue)$/.test(file) && !shouldSkip(file));

if (files.length === 0) {
  console.error('[extract] 未扫描到任何 .ts/.vue 文件');
  process.exit(1);
}

const text = files.map(file => readFileSync(file, 'utf8')).join('\n');

const matched = text.match(CJK_PATTERN) ?? [];
const hanChars = [...new Set(text.match(HAN_PATTERN) ?? [])];
const charset = new Set(matched);

// 基础 ASCII 可打印字符：英文字母 / 数字 / 半角标点
for (let cp = 0x20; cp <= 0x7e; cp += 1) {
  charset.add(String.fromCodePoint(cp));
}

const sorted = [...charset].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));

mkdirSync(join(OUT_FILE, '..'), { recursive: true });
writeFileSync(OUT_FILE, sorted.join(''), 'utf8');

const countByRoot = scanRoots.map(root => {
  const count = files.filter(file => file.startsWith(root)).length;
  return `  - src/${relative(srcRoot, root)}: ${count} 个文件`;
});

console.log('[extract] 扫描范围(src/service 除外):');
console.log(countByRoot.join('\n'));
console.log('[extract] 统计:');
console.log(`  - 唯一汉字数: ${hanChars.length}`);
console.log(`  - 汉字+CJK/全角标点命中: ${matched.length} 次`);
console.log(`  - 字符表总数(含 ASCII): ${sorted.length}`);
console.log(`[extract] 已输出: ${relative(ROOT, OUT_FILE)}`);
