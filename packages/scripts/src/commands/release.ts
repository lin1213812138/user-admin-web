import { versionBump } from 'bumpp';
import { execCommand } from '../shared';

/**
 * Release: bump version, generate changelog, then format the repo.
 *
 * `pnpm fmt` runs after changelog generation so the regenerated CHANGELOG.md
 * is already fmt-clean before bumpp stages it. Otherwise the pre-commit hook's
 * `git diff --exit-code` detects the unstaged formatting change (oxfmt strips a
 * blank line in the changelog contributors section) and aborts the commit.
 */
export async function release(execute = 'pnpm sa changelog', push = true) {
  await versionBump({
    files: ['**/package.json', '!**/node_modules'],
    execute: async () => {
      const [command, ...args] = execute.split(/\s+/);
      await execCommand(command, args, { stdio: 'inherit' });
      // format regenerated changelog so the pre-commit `git diff --exit-code` passes
      await execCommand('pnpm', ['fmt'], { stdio: 'inherit' });
    },
    all: true,
    tag: true,
    commit: 'chore(projects): release v%s',
    push
  });
}
