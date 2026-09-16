# dev 启动自动同步 .env.test 的 VITE_SERVICE_BASE_URL IP

> 2026-09-16 · 用户提示词：写个脚本每次启动项目都自动更新.env.test中的VITE_SERVICE_BASE_URL的ip

## 背景与问题定位

- 后端 tms-user 跑在用户本机，`VITE_SERVICE_BASE_URL=http://192.168.2.28:15001/tms/api/v1/web`（`.env.test`）中的 IP 就是本机局域网 IPv4（ipconfig 实测吻合），随 DHCP / 网络环境变化，每次换网手动改容易忘。
- 本机存在多块网卡：物理网卡 `192.168.2.28` + WSL 虚拟网卡 `172.27.0.1`，脚本必须排除虚拟网卡，否则写错 IP。
- `VITE_SERVICE_BASE_URL` 是 git 跟踪文件 `.env.test` 的一行，value 含端口与路径，不能整体覆写。

## 方案对比与决策

| 方案          | 说明                                                        | 结论                                                   |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| **A（采纳）** | 独立 Node 脚本 `scripts/update-env-ip.mjs` + `dev` 命令串联 | 零依赖、改动最小、可单独手动执行                       |
| B             | 写成 Vite 插件在 config 阶段改 env                          | 与构建链耦合、`build:test` 也会被牵连，否决            |
| C             | `predev` 生命周期钩子                                       | pnpm 默认 `enable-pre-post-scripts=false` 不执行，否决 |

用户确认方案 A 及假设：IP 来源=本机局域网 IPv4（排除 WSL/VMware 等虚拟网卡）、只挂 `pnpm dev`（不动 `build:test` / `dev:prod`）。

## 实现要点

- 新建 `scripts/update-env-ip.mjs`（零依赖，Node `os.networkInterfaces()`）：
  - 网卡名黑名单 `WSL|vEthernet|VMware|VirtualBox|Hyper-V|Loopback|TAP|TUN|Virtual`，过滤 internal / `127.*` / `169.254.*`；
  - 多候选按私网段优先级 `192.168.* > 10.* > 172.16-31.*` 取第一个，多于一候选时打印全部候选列表；
  - 正则 `^(\s*VITE_SERVICE_BASE_URL\s*=\s*)(https?:\/\/)([^/:\s]+)(.*)$` 按行只替换主机段，**scheme/端口/路径原样保留**；
  - IP 未变化时不重写文件（避免 git/mtime 抖动）；找不到行或读文件失败只警告、exit 0，不阻断 dev 启动。
- `package.json`：`"dev": "node scripts/update-env-ip.mjs && vite --mode test"`。
- 不改 `.env.prod`、`build:test`、`dev:prod`。

## 验证

- 当前 host 已等于本机 IP → 输出「无需更新」；
- 临时把 host 改为假值 `10.255.255.1` 再跑 → 正确写回 `192.168.2.28`，端口路径不变。
