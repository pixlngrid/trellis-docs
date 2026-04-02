// scripts/deploy-gh-pages.js
// One-command deployment to GitHub Pages via a gh-pages branch.
//
// Usage:
//   npm run deploy                       # build + push to gh-pages
//   npm run deploy -- --skip-build       # push existing out/ without rebuilding
//   npm run deploy -- --branch docs      # use a custom branch name
//   npm run deploy -- --remote upstream  # push to a different remote
//
// Environment variables:
//   PAGES_BASE_PATH  — subpath prefix (e.g. /repo-name) passed through to next.config.mjs

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'out');

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    skipBuild: false,
    branch: 'gh-pages',
    remote: 'origin',
    message: 'Deploy to GitHub Pages',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--skip-build') flags.skipBuild = true;
    else if (args[i] === '--branch' && args[i + 1]) flags.branch = args[++i];
    else if (args[i] === '--remote' && args[i + 1]) flags.remote = args[++i];
    else if (args[i] === '--message' && args[i + 1]) flags.message = args[++i];
  }

  return flags;
}

function detectBasePath(remote) {
  // If PAGES_BASE_PATH is already set, respect it
  if (process.env.PAGES_BASE_PATH) return process.env.PAGES_BASE_PATH;

  // Try to infer from remote URL: https://github.com/org/repo or git@github.com:org/repo
  try {
    const url = runCapture(`git remote get-url ${remote}`);
    const match = url.match(/github\.com[/:][\w.-]+\/([\w.-]+?)(?:\.git)?$/);
    if (match) {
      const repoName = match[1];
      // If repo looks like a user/org site (username.github.io), no basePath needed
      if (repoName.endsWith('.github.io')) return '';
      return `/${repoName}`;
    }
  } catch {
    // No remote configured — skip auto-detection
  }

  return '';
}

function main() {
  const flags = parseArgs();

  console.log('Trellis — Deploy to GitHub Pages');
  console.log('================================\n');

  // ── Step 1: Build ──────────────────────────────────────────
  if (!flags.skipBuild) {
    const basePath = detectBasePath(flags.remote);
    if (basePath) {
      console.log(`Detected basePath: ${basePath}`);
      console.log('  (override with PAGES_BASE_PATH env var)\n');
      process.env.PAGES_BASE_PATH = basePath;
    }

    console.log('Step 1: Building site...\n');
    run('npm run build');
    console.log('');
  } else {
    console.log('Step 1: Skipping build (--skip-build)\n');
  }

  // Verify out/ exists
  if (!fs.existsSync(OUT_DIR)) {
    console.error('Error: out/ directory not found. Run the build first.');
    process.exit(1);
  }

  // ── Step 2: Push to gh-pages branch ────────────────────────
  console.log(`Step 2: Deploying to ${flags.remote}/${flags.branch}...\n`);

  // Work in a temp directory to avoid touching the working tree
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trellis-deploy-'));

  try {
    // Get the remote URL to clone/init
    const remoteUrl = runCapture(`git remote get-url ${flags.remote}`);

    // Initialize a fresh repo in the temp dir
    execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
    execSync(`git remote add origin "${remoteUrl}"`, { cwd: tmpDir, stdio: 'ignore' });

    // Try to fetch the existing gh-pages branch (may not exist yet)
    try {
      execSync(`git fetch origin ${flags.branch} --depth=1`, { cwd: tmpDir, stdio: 'ignore' });
      execSync(`git checkout ${flags.branch}`, { cwd: tmpDir, stdio: 'ignore' });
      // Clear existing content
      execSync('git rm -rf .', { cwd: tmpDir, stdio: 'ignore' });
    } catch {
      // Branch doesn't exist yet — create orphan
      execSync(`git checkout --orphan ${flags.branch}`, { cwd: tmpDir, stdio: 'ignore' });
    }

    // Copy out/ contents to the temp repo
    const outEntries = fs.readdirSync(OUT_DIR);
    for (const entry of outEntries) {
      const src = path.join(OUT_DIR, entry);
      const dest = path.join(tmpDir, entry);
      fs.cpSync(src, dest, { recursive: true });
    }

    // Add .nojekyll to bypass Jekyll processing on GitHub Pages
    fs.writeFileSync(path.join(tmpDir, '.nojekyll'), '');

    // Commit and push
    execSync('git add -A', { cwd: tmpDir, stdio: 'ignore' });

    // Check if there are changes to commit
    try {
      execSync('git diff --cached --quiet', { cwd: tmpDir, stdio: 'ignore' });
      console.log('No changes to deploy — site is already up to date.\n');
      return;
    } catch {
      // There are staged changes — proceed with commit
    }

    // Configure git user for the deploy commit
    try {
      runCapture('git config user.name');
    } catch {
      execSync('git config user.name "trellis-deploy"', { cwd: tmpDir, stdio: 'ignore' });
      execSync('git config user.email "trellis-deploy@users.noreply.github.com"', { cwd: tmpDir, stdio: 'ignore' });
    }
    // Use the parent repo's git config for the commit
    try {
      const name = runCapture('git config user.name');
      const email = runCapture('git config user.email');
      execSync(`git config user.name "${name}"`, { cwd: tmpDir, stdio: 'ignore' });
      execSync(`git config user.email "${email}"`, { cwd: tmpDir, stdio: 'ignore' });
    } catch {
      // Fallback already set above
    }

    execSync(`git commit -m "${flags.message}"`, { cwd: tmpDir, stdio: 'ignore' });
    execSync(`git push origin ${flags.branch} --force`, { cwd: tmpDir, stdio: 'pipe' });

    console.log(`\nDeployed to ${flags.remote}/${flags.branch}`);
    console.log('\nNext steps:');
    console.log('  1. Go to your repo Settings → Pages');
    console.log(`  2. Set Source to "Deploy from a branch" and select "${flags.branch}"`);
    console.log('  3. Your site will be live in a few minutes\n');
  } finally {
    // Clean up temp directory
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main();
