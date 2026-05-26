import { spawnSync } from 'node:child_process';
import { existsSync, rmdirSync, readdirSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';

const cwd = resolve('.');

function git(args, opts = {}) {
  const r = spawnSync('git.exe', args, {
    cwd,
    shell: false,
    windowsHide: true,
    encoding: 'utf8',
    stdio: opts.silent ? 'pipe' : 'inherit',
    ...opts,
  });
  if (r.status !== 0 && !opts.allowFail) {
    console.error(`git ${args.join(' ')} failed:`, r.stderr ?? '');
    process.exit(1);
  }
  return r;
}

// Try to clean up the empty temp scaffold folder
const tempDir = join(cwd, 'moneyjimuneko');
if (existsSync(tempDir)) {
  try {
    const remaining = readdirSync(tempDir);
    for (const f of remaining) {
      try { unlinkSync(join(tempDir, f)); } catch {}
    }
    rmdirSync(tempDir);
    console.log('removed empty temp dir: moneyjimuneko/');
  } catch (e) {
    console.log('temp dir still locked, skip:', e.code);
  }
}

// Clean up our helper scripts
for (const helper of ['_move.mjs', '_cleanup.mjs', '_cleanup2.mjs', '_git_init.mjs', '_git_init2.mjs']) {
  if (existsSync(helper)) {
    try { unlinkSync(helper); console.log('cleaned helper:', helper); } catch {}
  }
}

// Stage everything
git(['add', '-A']);

// Show status
console.log('--- staged ---');
git(['status', '--short']);

// Commit
const message = `chore: scaffold Next.js 16 + Tailwind v4 + shadcn/ui project

- Next.js 16.2.6 (App Router, Turbopack, React 19)
- TypeScript strict, src/ layout, @/* path alias
- Runtime: dexie / zustand / zod / clsx / cva / tailwind-merge / lucide-react / recharts
- Tests: Vitest (happy-dom) + Playwright (mobile-chrome/mobile-safari/desktop)
- UI: shadcn/ui (defaults), Tailwind v4
- Lint/format: ESLint (next), Prettier + prettier-plugin-tailwindcss
- Layout/page: ja lang, Noto Sans JP, tabular-nums, mobile-first scaffold

Constraint: スマホ主体 (375px mobile-first)、IndexedDB ローカル完結、金額は整数 (円)
Rejected: Next.js 15 据え置き | 新規 MVP で v16 の破壊的変更は本プロジェクト範囲に影響なしと判断
Confidence: high
Scope-risk: narrow

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
`;

git(['commit', '-m', message]);

console.log('--- log ---');
git(['log', '--oneline', '-n', '5']);
