/**
 * dev 启动前自动把 .env.test 中 VITE_SERVICE_BASE_URL 的主机段同步为本机局域网 IPv4。
 *
 * 背景：后端 tms-user 跑在本机，局域网 IP 随 DHCP 变化，手动改 .env.test 容易忘。
 * 行为：
 * - 只替换主机段，端口与路径（如 :15001/tms/api/v1/web）原样保留；
 * - IP 未变化时不重写文件，避免 git/mtime 无谓抖动；
 * - 找不到目标行只警告不阻断启动（exit 0）。
 *
 * 手动执行：node scripts/update-env-ip.mjs
 */

import { networkInterfaces } from 'node:os';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../.env.test');
const ENV_KEY = 'VITE_SERVICE_BASE_URL';

/** 虚拟网卡名黑名单：WSL / VMware / Hyper-V / VirtualBox / 回环等，避免取到 172.27.0.1 之类地址 */
const VIRTUAL_ADAPTER_PATTERN = /WSL|vEthernet|VMware|VirtualBox|Hyper-V|Loopback|TAP|TUN|Virtual/i;

/** 私网段优先级：192.168.* > 10.* > 172.16-31.*，数字越小优先级越高 */
function privateSegmentPriority(ip) {
  if (ip.startsWith('192.168.')) return 0;
  if (ip.startsWith('10.')) return 1;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 2;
  return 3;
}

/** 收集本机局域网 IPv4 候选（过滤回环、链路本地、虚拟网卡），按优先级排序 */
function collectLanIps() {
  const candidates = [];
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    if (VIRTUAL_ADAPTER_PATTERN.test(name)) continue;
    for (const addr of addrs ?? []) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      if (addr.address.startsWith('127.') || addr.address.startsWith('169.254.')) continue;
      candidates.push({ name, ip: addr.address });
    }
  }
  return candidates.sort((a, b) => privateSegmentPriority(a.ip) - privateSegmentPriority(b.ip));
}

function detectLanIp() {
  const candidates = collectLanIps();
  if (candidates.length === 0) return null;
  const chosen = candidates[0];
  if (candidates.length > 1) {
    const list = candidates.map(c => `  - ${c.ip}（${c.name}）`).join('\n');
    console.warn(`[update-env-ip] 检测到多个候选 IP，已选用第一个：\n${list}`);
  }
  return chosen.ip;
}

function main() {
  const ip = detectLanIp();
  if (!ip) {
    console.warn('[update-env-ip] 未检测到本机局域网 IPv4，跳过更新，.env.test 保持原样。');
    return;
  }

  let content;
  try {
    content = readFileSync(ENV_FILE, 'utf-8');
  } catch {
    console.warn(`[update-env-ip] 读取 ${ENV_FILE} 失败，跳过更新。`);
    return;
  }

  // 只替换主机段：保留 scheme、端口与路径；m 标志按行匹配
  const linePattern = new RegExp(`^(\\s*${ENV_KEY}\\s*=\\s*)(https?:\\/\\/)([^/:\\s]+)(.*)$`, 'm');
  const match = content.match(linePattern);

  if (!match) {
    console.warn(`[update-env-ip] .env.test 中未找到 ${ENV_KEY}=http://<host>... 行，未做任何修改。`);
    return;
  }

  const [, _prefix, scheme, host, suffix] = match;
  if (host === ip) {
    console.log(`[update-env-ip] ${ENV_KEY} 的 IP 已是 ${ip}，无需更新。`);
    return;
  }

  writeFileSync(ENV_FILE, content.replace(linePattern, `$1$2${ip}$4`), 'utf-8');
  console.log(`[update-env-ip] ${ENV_KEY}: ${scheme}${host}${suffix} -> ${scheme}${ip}${suffix}`);
}

main();
