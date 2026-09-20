#!/usr/bin/env node
/**
 * UserPromptSubmit 闸门（第四层强制之二）
 *
 * 1) 每次用户消息提交时，向上下文注入一段极短的「硬闸门提醒」——用户不需要再重复叮嘱；
 * 2) 用户消息命中放行口令时，写 `.codebuddy/gate/approved.json` 开闸（PreToolUse 据此放行 src/** 写入）。
 *
 * 说明：该事件下 stdout 会进入模型上下文；退出码始终为 0（不阻断用户消息）。
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * 放行口令（用户说出任一句即视为 spec 已确认；按「更精确者优先」排序，find 命中即记录）
 * 注意：`开始` 为宽泛口令，任何包含该词的消息都会开闸（用户明确要求加入）。
 */
const PHRASES = ['确认 spec', 'spec 已确认', '设计通过', '按这个实现', '开始实现', '开始'];

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

let payload = {};
try {
  payload = JSON.parse(readStdin() || '{}');
} catch {
  payload = {};
}

const root = process.env.CODEBUDDY_PROJECT_DIR || payload.cwd || process.cwd();
const prompt = String(payload.prompt || payload.user_prompt || '');
const hit = PHRASES.find(phrase => prompt.includes(phrase));

const gateFile = path.join(root, '.codebuddy', 'gate', 'approved.json');

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

let gateState = '关闭（无已确认 spec）';

if (hit) {
  try {
    fs.mkdirSync(path.dirname(gateFile), { recursive: true });
    fs.writeFileSync(
      gateFile,
      `${JSON.stringify(
        {
          phrase: hit,
          confirmedAt: new Date().toISOString(),
          promptExcerpt: prompt.slice(0, 200)
        },
        null,
        2
      )}\n`
    );
    gateState = `已开启（口令：${hit}）`;
  } catch {
    gateState = '写入失败（请检查 .codebuddy/gate 目录权限）';
  }
} else {
  const approvedAt = mtime(gateFile);
  const specAt = newestSpec(path.join(root, 'docs', 'superpowers', 'specs'));
  if (approvedAt && approvedAt >= specAt) gateState = '已开启（存在晚于最新 spec 的确认）';
}

process.stdout.write(
  [
    '【硬闸门】开发类任务：① using-agent-skills 判定技能链 → ② spec 落 docs/superpowers/specs/（状态=待确认（禁止实现））→',
    `③ 停下等用户对 spec 明确确认（口令：确认 spec / spec 已确认 / 设计通过 / 按这个实现 / 开始实现 / 开始）→ ④ 改状态为「已确认」后才可改 src/**。当前闸门：${gateState}。`,
    '禁止用选择题代替 spec 确认；禁止先写码后补 spec；回滚禁止 git checkout/restore。'
  ].join('\n')
);
process.exit(0);
