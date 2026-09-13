#!/usr/bin/env node
/**
 * CLI entry point.
 *
 * Plain JS on purpose: `node_modules/.bin/sa` must work no matter how the shim was
 * generated. npm / some IDE dependency tools only recognise a `node` shebang, so they
 * used to turn `bin.ts` + `#!/usr/bin/env tsx` into `node bin.ts`, which fails with
 * ERR_UNKNOWN_FILE_EXTENSION on Windows. This file can be executed by plain node and
 * delegates to the tsx CLI, so TypeScript sources run exactly as `tsx bin.ts` did.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const tsxCli = require.resolve('tsx/cli');

const { status } = spawnSync(process.execPath, [tsxCli, join(here, 'src', 'index.ts'), ...process.argv.slice(2)], {
  stdio: 'inherit'
});

process.exit(status ?? 1);
