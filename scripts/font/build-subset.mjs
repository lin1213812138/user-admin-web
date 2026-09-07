/**
 * 依据字符表重新生成阿里巴巴普惠体子集（woff2）
 *
 * 前置条件：
 * - Python 已安装 fonttools 与 brotli：`pip install fonttools brotli`
 * - 源字体存在：`src/assets/fonts/source/Alibaba-PuHuiTi.otf`（已被 .gitignore 排除，需自行准备）
 *
 * 用法：`pnpm font:build`（会先自动重新提取字符表，再生成字体）
 */
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const SOURCE_FONT = resolve(ROOT, 'src/assets/fonts/source/Alibaba-PuHuiTi.otf');
const CHARSET_FILE = resolve(ROOT, 'src/assets/fonts/zh-web-charset.txt');
const OUTPUT_FILE = resolve(ROOT, 'src/assets/fonts/AlibabaPuHuiTi-subset.woff2');

/** 校验必需文件，缺失时给出可操作的提示 */
function assertFile(file, hint) {
  if (existsSync(file)) return;

  console.error(`[font] 缺少文件: ${file}`);
  console.error(`[font] ${hint}`);
  process.exit(1);
}

/** 探测可用的 python 命令（Windows 用 python，类 Unix 常为 python3） */
function resolvePython() {
  for (const cmd of ['python', 'python3']) {
    const probe = spawnSync(cmd, ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' });
    if (!probe.error) return cmd;
  }

  return null;
}

assertFile(SOURCE_FONT, '请把普惠体源字体放到该路径（仓库已忽略此目录，需自行准备）');
assertFile(CHARSET_FILE, '请先执行 pnpm font:charset 生成字符表');

const python = resolvePython();
if (!python) {
  console.error('[font] 未找到 python，请先安装 Python 并执行: pip install fonttools brotli');
  process.exit(1);
}

const result = spawnSync(
  python,
  [
    '-m',
    'fontTools.subset',
    SOURCE_FONT,
    `--text-file=${CHARSET_FILE}`,
    '--flavor=woff2',
    `--output-file=${OUTPUT_FILE}`
  ],
  { stdio: 'inherit', shell: process.platform === 'win32' }
);

if (result.status !== 0) {
  console.error('[font] 子集化失败，请确认已安装: pip install fonttools brotli');
  process.exit(result.status ?? 1);
}

const size = statSync(OUTPUT_FILE).size;
console.log(`[font] 已生成: ${OUTPUT_FILE}（${size} 字节，约 ${(size / 1024).toFixed(1)} KB）`);
