#!/usr/bin/env node
/**
 * PreToolUse 硬闸门（第四层强制）
 *
 * 作用：拦截对 `src/**`、`packages/**`、`build/**` 的写入，直到「用户已确认 spec」。
 * 判定：`.codebuddy/gate/approved.json` 存在，且其 mtime 不早于 `docs/superpowers/specs` 下最新的 spec。
 *       —— 新写一份 spec 会让闸门自动关闭，所以每个新任务都必须重新等用户确认。
 * 退出码：2 = 阻止工具调用（stdout 消息回传给 AI）；0 = 放行；其它 = 非阻塞错误（放行，保证不锁死用户）。
 * 日志：每次调用追加到 `.codebuddy/tmp/hooks.log`（同时作为「hook 是否生效」的探针证据）。
 */
import fs from 'node:fs';
import path from 'node:path';

/** 受保护目录（出现任一前缀即需闸门放行） */
const LOCKED = ['src/', 'packages/', 'build/'];

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const raw = readStdin();
let payload = {};
try {
  payload = JSON.parse(raw || '{}');
} catch {
  payload = {};
}

const root = process.env.CODEBUDDY_PROJECT_DIR || payload.cwd || process.cwd();
const toolName = String(payload.tool_name || payload.toolName || '');
const input = payload.tool_input || payload.toolInput || {};
const filePath = String(input.file_path || input.filePath || input.path || '');
const normalized = filePath.replace(/\\/g, '/');

function log(line) {
  try {
    const dir = path.join(root, '.codebuddy', 'tmp');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'hooks.log'), `${new Date().toISOString()} ${line}\n`);
  } catch {
    // 日志失败不影响闸门判定
  }
}

const locked = LOCKED.some(prefix => normalized.startsWith(prefix) || normalized.includes(`/${prefix}`));
if (!locked) {
  log(`allow(scope) tool=${toolName} path=${normalized}`);
  process.exit(0);
}

const gateFile = path.join(root, '.codebuddy', 'gate', 'approved.json');
const specsDir = path.join(root, 'docs', 'superpowers', 'specs');

function mtime(file) {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

function newestSpec(dir) {
  let newest = 0;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestSpec(full));
    else if (entry.name.endsWith('.md')) newest = Math.max(newest, mtime(full));
  }
  return newest;
}

const approvedAt = mtime(gateFile);
const specAt = newestSpec(specsDir);
log(`check tool=${toolName} path=${normalized} approved=${approvedAt} spec=${specAt} locked=${locked}`);

if (approvedAt && approvedAt >= specAt) {
  log(`allow(gate-open) tool=${toolName} path=${normalized}`);
  process.exit(0);
}

const reason = approvedAt
  ? '已确认的 spec 早于最新的 spec（说明这是新任务，需重新确认）'
  : '当前没有任何「用户已确认」的 spec';

process.stdout.write(
  [
    `⛔ 硬闸门拦截：禁止写入 ${normalized}`,
    `原因：${reason}`,
    '',
    '必须按 AGENTS.md / .codebuddy/rules/workflow-gate 的顺序执行：',
    '1. 用 using-agent-skills 判定技能链（回复中写明）；',
    '2. 在 docs/superpowers/specs/ 写 spec，状态行固定为「待确认（禁止实现）」；',
    '3. 停下来，把 spec 交给用户审阅，等用户明确确认（口令：确认 spec / spec 已确认 / 设计通过 / 按这个实现 / 开始实现 / 开始）；',
    '4. 确认后把 spec 状态行改为「已确认（用户确认：<原话摘要>）」，然后重试本次工具调用。',
    '',
    '注意：选择题选项被选中 ≠ spec 确认；禁止用 git checkout/restore 绕过或抹掉用户未提交的工作。'
  ].join('\n')
);
process.exit(2);
