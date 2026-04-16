// packages/create-trellis-docs/lib/upgrade.js
// Allow-list based upgrade script for existing Trellis projects.
// Only explicitly listed framework files are updated — user content,
// config, landing page, and design tokens are never touched.
//
// Usage:
//   npx @patriciamcphee/create-trellis-docs@latest upgrade [--dry-run] [--skip-install] [-p npm|yarn|pnpm]

const path = require('path');
const fs = require('fs-extra');
const prompts = require('prompts');
const spawn = require('cross-spawn');

const TEMPLATE_DIR = path.join(__dirname, '..', 'template');

// ── ANSI colors ──────────────────────────────────────────────────
const useColor = process.stdout.isTTY !== false;
const c = {
  yellow: (s) => (useColor ? `\x1b[33m${s}\x1b[0m` : s),
  red:    (s) => (useColor ? `\x1b[31m${s}\x1b[0m` : s),
  green:  (s) => (useColor ? `\x1b[32m${s}\x1b[0m` : s),
  dim:    (s) => (useColor ? `\x1b[2m${s}\x1b[0m` : s),
  bold:   (s) => (useColor ? `\x1b[1m${s}\x1b[0m` : s),
  cyan:   (s) => (useColor ? `\x1b[36m${s}\x1b[0m` : s),
};

// ── Allow-list ───────────────────────────────────────────────────
// Directories: recursively sync all files within these paths.
const ALLOW_DIRS = [
  'app/(docs)',
  'app/blog',
  'app/release-notes',
  'app/feedback-dashboard',
  'components/docs',
  'components/custom',
  'components/blog',
  'components/release-notes',
  'components/shared',
  'lib',
  'scripts',
];

// Files and path prefixes within allowed dirs that should never be
// overwritten (user-customized or user-migrated). Entries that match an
// exact relative path skip that single file; entries ending a directory
// segment skip the entire subtree beneath it. Checked by `isSkipped()`.
const SKIP_FILES = [
  'components/docs/mdx/index.tsx',
  'components/custom/migrated',   // user-migrated Docusaurus components
  'app/globals.css',
  'app/layout.tsx',
];

// True if `rel` is explicitly listed in SKIP_FILES OR lives beneath a
// directory listed there. Prefix matching uses a trailing `/` guard so
// `components/custom/migrated` does NOT match `components/custom/migrate-helper.tsx`.
function isSkipped(rel) {
  for (const entry of SKIP_FILES) {
    if (rel === entry) return true;
    if (rel.startsWith(entry + '/')) return true;
  }
  return false;
}

// Individual files to sync.
const ALLOW_FILES = [
  'app/layout.tsx',
  'app/globals.css',
  'components/theme-provider.tsx',
  'next.config.mjs',
  'postcss.config.mjs',
  'tsconfig.json',
];

// Paths the framework used to ship but no longer does. Surfaced during the
// upgrade preview so the user knows what's safe to delete after upgrading.
// Files only — directories are matched as prefixes (everything beneath the
// path becomes flagged).
const REMOVED_PATHS = [
  // Removed in v1.13: branding moved to data-driven config (logo.navbar /
  // logo.hero in site.ts point at images in public/img/). The components/brand/
  // directory and `useBuiltIn` flag are no longer used.
  'components/brand',
];

// ── Helpers ──────────────────────────────────────────────────────

/** Normalize path separators to forward slashes. */
function normalizePath(p) {
  return p.split(path.sep).join('/');
}

/** Recursively list all files under a directory. */
async function walkDir(dir) {
  const results = [];
  if (!(await fs.pathExists(dir))) return results;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkDir(full)));
    } else {
      results.push(full);
    }
  }
  return results;
}

/** Collect all template files that match the allow-list. */
async function collectAllowedFiles() {
  const files = new Set();

  // Allowed directories — walk each and include all non-.tpl files that
  // aren't skipped. isSkipped() handles both exact paths and directory
  // prefixes, so a SKIP entry like 'components/custom/migrated' excludes
  // every file beneath it without blocking sibling files in the parent.
  for (const dir of ALLOW_DIRS) {
    if (isSkipped(dir)) continue;
    const srcDir = path.join(TEMPLATE_DIR, dir);
    const dirFiles = await walkDir(srcDir);
    for (const absPath of dirFiles) {
      const rel = normalizePath(path.relative(TEMPLATE_DIR, absPath));
      if (!rel.endsWith('.tpl') && !isSkipped(rel)) {
        files.add(rel);
      }
    }
  }

  // Individual allowed files
  for (const file of ALLOW_FILES) {
    const srcPath = path.join(TEMPLATE_DIR, file);
    if ((await fs.pathExists(srcPath)) && !file.endsWith('.tpl') && !isSkipped(file)) {
      files.add(file);
    }
  }

  return [...files].sort();
}

/** Compare template files against the project and categorize. */
async function diffFiles(allowedFiles, projectDir) {
  const stats = { added: [], updated: [], unchanged: [] };

  for (const relPath of allowedFiles) {
    const srcPath = path.join(TEMPLATE_DIR, relPath);
    const destPath = path.join(projectDir, relPath);
    const srcContent = await fs.readFile(srcPath);

    if (await fs.pathExists(destPath)) {
      const destContent = await fs.readFile(destPath);
      if (Buffer.compare(srcContent, destContent) === 0) {
        stats.unchanged.push(relPath);
      } else {
        stats.updated.push(relPath);
      }
    } else {
      stats.added.push(relPath);
    }
  }

  return stats;
}

/** Find project files in allowed dirs that no longer exist in the template.
 * Skips paths under SKIP_FILES entries — the user's migrated/custom files
 * wouldn't exist in the template by design, so flagging them as "stale"
 * would produce a huge false-positive list. */
async function findStaleFiles(projectDir) {
  const stale = [];

  for (const dir of ALLOW_DIRS) {
    if (isSkipped(dir)) continue;
    const destDir = path.join(projectDir, dir);
    const projectFiles = await walkDir(destDir);
    for (const absPath of projectFiles) {
      const rel = normalizePath(path.relative(projectDir, absPath));
      if (isSkipped(rel)) continue;
      const templatePath = path.join(TEMPLATE_DIR, rel);
      if (!(await fs.pathExists(templatePath))) {
        stale.push(rel);
      }
    }
  }

  return stale.sort();
}

/** Find any REMOVED_PATHS entry that still exists in the user's project.
 * Each entry is a single file or a directory prefix. Returns relative paths
 * (file or directory) so the upgrade preview can list them and the user
 * knows what to delete. */
async function findRemovedPaths(projectDir) {
  const found = [];
  for (const entry of REMOVED_PATHS) {
    const abs = path.join(projectDir, entry);
    if (await fs.pathExists(abs)) {
      const stat = await fs.stat(abs);
      found.push(stat.isDirectory() ? `${entry}/` : entry);
    }
  }
  return found.sort();
}

// Parse a semver range into a [major, minor, patch] tuple. Returns null for
// tags (`latest`, `next`), git/http URLs, or anything we can't confidently
// compare. When either side is null, the caller preserves the user's value
// (don't risk downgrading over something we don't understand).
function parseVersion(str) {
  if (typeof str !== 'string') return null;
  const m = str.trim().match(/^[\^~>=<]*\s*(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

// Returns true if version `a` is >= version `b`. Returns null when either
// is unparseable.
function versionGte(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return true;
    if (pa[i] < pb[i]) return false;
  }
  return true; // equal
}

/** Merge dependencies and scripts from template package.json into the project. */
async function mergePackageJson(projectDir, dryRun) {
  const userPkgPath = path.join(projectDir, 'package.json');
  const tplPkgPath = path.join(TEMPLATE_DIR, 'package.json.tpl');

  if (!(await fs.pathExists(userPkgPath)) || !(await fs.pathExists(tplPkgPath))) {
    return { changed: false, details: [] };
  }

  const userPkg = await fs.readJson(userPkgPath);
  const tplContent = await fs.readFile(tplPkgPath, 'utf-8');
  const sanitized = tplContent.replace(/\{\{[^}]+\}\}/g, 'placeholder');
  const tplPkg = JSON.parse(sanitized);

  const details = [];
  let changed = false;

  // Merge dependencies. Rule: never downgrade. If the user already has a
  // version >= the template's, leave it alone. Only upgrade when the
  // template is strictly newer, or when the user is missing the dep
  // entirely. If either version is unparseable (tag, git URL, local path),
  // preserve the user's value to avoid risky overwrites.
  if (tplPkg.dependencies) {
    if (!userPkg.dependencies) userPkg.dependencies = {};
    for (const [dep, tplVer] of Object.entries(tplPkg.dependencies)) {
      const userVer = userPkg.dependencies[dep];
      if (!userVer) {
        details.push(`  ${c.green('+')} ${dep}@${tplVer}`);
        userPkg.dependencies[dep] = tplVer;
        changed = true;
        continue;
      }
      if (userVer === tplVer) continue;

      const userIsNewer = versionGte(userVer, tplVer);
      if (userIsNewer === true) {
        details.push(`  ${c.dim('=')} ${dep}: ${userVer} ${c.dim(`(kept — newer than template ${tplVer})`)}`);
        continue;
      }
      if (userIsNewer === null) {
        details.push(`  ${c.dim('=')} ${dep}: ${userVer} ${c.dim(`(kept — can't compare against template ${tplVer})`)}`);
        continue;
      }
      // userIsNewer === false → template is newer, upgrade.
      details.push(`  ${c.cyan('↑')} ${dep}: ${userVer} → ${tplVer}`);
      userPkg.dependencies[dep] = tplVer;
      changed = true;
    }
  }

  // Merge scripts
  if (tplPkg.scripts) {
    if (!userPkg.scripts) userPkg.scripts = {};
    for (const [name, cmd] of Object.entries(tplPkg.scripts)) {
      if (!userPkg.scripts[name]) {
        details.push(`  ${c.green('+')} script: ${name}`);
        userPkg.scripts[name] = cmd;
        changed = true;
      } else if (userPkg.scripts[name] !== cmd) {
        details.push(`  ${c.cyan('↑')} script: ${name}`);
        userPkg.scripts[name] = cmd;
        changed = true;
      }
    }
  }

  if (changed && !dryRun) {
    await fs.writeJson(userPkgPath, userPkg, { spaces: 2 });
  }

  return { changed, details };
}

/** Install dependencies using the specified package manager. */
function installDeps(projectDir, packageManager) {
  console.log(`\n  Installing dependencies with ${packageManager}...\n`);
  const args = ['install'];
  if (packageManager === 'npm') {
    args.push(`--os=${process.platform}`);
  }
  const result = spawn.sync(packageManager, args, {
    cwd: projectDir,
    stdio: 'inherit',
  });
  return result.status === 0;
}

// ── Main ─────────────────────────────────────────────────────────

async function upgrade(options = {}) {
  const projectDir = process.cwd();
  const dryRun = options.dryRun || false;
  const skipInstall = options.skipInstall || false;
  const pm = options.packageManager || 'npm';

  // 1. Validate
  const siteConfigPath = path.join(projectDir, 'config', 'site.ts');
  if (!(await fs.pathExists(siteConfigPath))) {
    throw new Error(
      'No config/site.ts found. Run this command from the root of a Trellis project.'
    );
  }

  console.log(`\n  ${c.bold('Trellis — Upgrade')}\n`);
  if (dryRun) {
    console.log(`  ${c.yellow('Dry run')} — no files will be changed.\n`);
  }

  // 2. Collect allowed files from the template
  const allowedFiles = await collectAllowedFiles();

  // 3. Compare template vs project
  const stats = await diffFiles(allowedFiles, projectDir);

  // 4. Find stale files (in template-managed dirs but no longer in template)
  //    and removed paths (explicitly dropped by the framework — e.g., the old
  //    components/brand/ directory).
  const staleFiles = await findStaleFiles(projectDir);
  const removedPaths = await findRemovedPaths(projectDir);

  // 5. Merge package.json (preview only in dry run)
  const pkgResult = await mergePackageJson(projectDir, true); // always preview first

  // 6. Print summary
  const totalChanges = stats.added.length + stats.updated.length;

  console.log(`  ${c.bold('Framework files')}`);
  console.log(`    ${c.green(String(stats.added.length))} new · ${c.cyan(String(stats.updated.length))} updated · ${c.dim(String(stats.unchanged.length) + ' unchanged')}`);

  if (stats.added.length > 0) {
    console.log(`\n  ${c.green('New files:')}`);
    for (const f of stats.added) console.log(`    + ${f}`);
  }

  if (stats.updated.length > 0) {
    console.log(`\n  ${c.cyan('Updated files:')}`);
    for (const f of stats.updated) console.log(`    ~ ${f}`);
  }

  if (staleFiles.length > 0) {
    console.log(`\n  ${c.yellow('Stale files')} ${c.dim('(no longer in template — remove manually if unused):')}`);
    for (const f of staleFiles) console.log(`    - ${f}`);
  }

  if (removedPaths.length > 0) {
    console.log(`\n  ${c.yellow('Removed framework paths')} ${c.dim('(safe to delete — no longer used):')}`);
    for (const p of removedPaths) console.log(`    ${c.red('✗')} ${p}`);
    console.log(`    ${c.dim('See https://github.com/pixlngrid/trellis-docs/blob/main/CHANGELOG.md for context.')}`);
  }

  if (pkgResult.details.length > 0) {
    console.log(`\n  ${c.bold('package.json changes:')}`);
    for (const d of pkgResult.details) console.log(`  ${d}`);
  }

  // Nothing to do?
  if (totalChanges === 0 && !pkgResult.changed) {
    console.log(`\n  ${c.green('Your project is already up to date.')}\n`);
    return;
  }

  // 7. Dry run gate
  if (dryRun) {
    console.log(`\n  ${c.yellow('Dry run complete.')} Run without --dry-run to apply changes.\n`);
    return;
  }

  // 8. Confirm
  const { proceed } = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: `Apply ${totalChanges} file change(s)${pkgResult.changed ? ' + package.json updates' : ''}?`,
    initial: true,
  });

  if (!proceed) {
    console.log(`\n  Upgrade cancelled.\n`);
    return;
  }

  // 9. Write framework files
  for (const relPath of [...stats.added, ...stats.updated]) {
    const srcPath = path.join(TEMPLATE_DIR, relPath);
    const destPath = path.join(projectDir, relPath);
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(srcPath, destPath, { overwrite: true });
  }
  console.log(`\n  ${c.green('✓')} ${totalChanges} framework file(s) written.`);

  // 10. Merge package.json (for real this time)
  if (pkgResult.changed) {
    await mergePackageJson(projectDir, false);
    console.log(`  ${c.green('✓')} package.json updated.`);
  }

  // 11. Install deps
  if (pkgResult.changed && !skipInstall) {
    const success = installDeps(projectDir, pm);
    if (!success) {
      console.log(`\n  ${c.yellow('Warning:')} Dependency installation failed. Run "${pm} install" manually.`);
    }
  }

  // 12. Next steps
  console.log(`
  ${c.bold('Next steps:')}
    1. Review changes:     ${c.dim('git diff')}
    2. Restart dev server: ${c.dim('npm run dev')}
    3. Verify the build:   ${c.dim('npm run build')}
`);
}

module.exports = { upgrade };
