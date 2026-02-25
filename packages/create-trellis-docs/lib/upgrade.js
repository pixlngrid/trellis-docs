const path = require('path');
const fs = require('fs-extra');

const TEMPLATE_DIR = path.join(__dirname, '..', 'template');

// Top-level paths that belong to the user and should never be overwritten
const SKIP_TOP_LEVEL = new Set([
  'content',
  'public',
  '_gitignore',
  'README.md.tpl',
  'package.json.tpl',
]);

// Directories inside components/ that are user territory
const SKIP_COMPONENT_DIRS = new Set(['brand']);

// Config files that are user territory (we never overwrite these)
const SKIP_CONFIG_FILES = new Set(['site.ts.tpl', 'variables.ts']);

async function upgrade(options = {}) {
  const projectDir = process.cwd();

  // Verify this is a Trellis project
  const siteConfigPath = path.join(projectDir, 'config', 'site.ts');
  if (!(await fs.pathExists(siteConfigPath))) {
    throw new Error(
      'No config/site.ts found. Run this command from the root of a Trellis project.'
    );
  }

  console.log('\n  Trellis — Upgrade existing project\n');

  const dryRun = options.dryRun || false;
  if (dryRun) {
    console.log('  (Dry run — no files will be changed)\n');
  }

  const stats = { updated: [], added: [], skipped: [], depChanges: [] };

  // 1. Copy framework files from template
  await copyFrameworkFiles(TEMPLATE_DIR, projectDir, '', stats, dryRun);

  // 2. Merge package.json dependencies
  await mergePackageJson(projectDir, stats, dryRun);

  // 3. Print summary
  printSummary(stats, dryRun);
}

async function copyFrameworkFiles(templateDir, projectDir, relativePath, stats, dryRun) {
  const entries = await fs.readdir(templateDir, { withFileTypes: true });

  for (const entry of entries) {
    const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
    const srcPath = path.join(templateDir, entry.name);
    const destName = entry.name === '_gitignore' ? '.gitignore' : entry.name;
    const destPath = path.join(projectDir, destName);

    // Skip node_modules, .next, out
    if (['node_modules', '.next', 'out'].includes(entry.name)) continue;

    // Skip user-owned top-level paths
    if (!relativePath && SKIP_TOP_LEVEL.has(entry.name)) {
      stats.skipped.push(relPath);
      continue;
    }

    // Skip user-owned component directories
    if (relativePath === 'components' && SKIP_COMPONENT_DIRS.has(entry.name)) {
      stats.skipped.push(relPath + '/');
      continue;
    }

    // Skip user-owned config files
    if (relativePath === 'config' && SKIP_CONFIG_FILES.has(entry.name)) {
      stats.skipped.push(relPath);
      continue;
    }

    // Skip .tpl files (they contain {{placeholders}} for scaffolding only)
    if (entry.name.endsWith('.tpl')) {
      stats.skipped.push(relPath);
      continue;
    }

    if (entry.isDirectory()) {
      if (!dryRun) await fs.ensureDir(destPath);
      await copyFrameworkFiles(srcPath, destPath, relPath, stats, dryRun);
    } else {
      const exists = await fs.pathExists(destPath);

      // Compare content to avoid reporting unchanged files
      if (exists) {
        const srcContent = await fs.readFile(srcPath);
        const destContent = await fs.readFile(destPath);
        if (srcContent.equals(destContent)) continue; // identical — skip
      }

      if (!dryRun) {
        await fs.copy(srcPath, destPath, { overwrite: true });
      }

      if (exists) {
        stats.updated.push(relPath);
      } else {
        stats.added.push(relPath);
      }
    }
  }
}

async function mergePackageJson(projectDir, stats, dryRun) {
  const templatePkgPath = path.join(TEMPLATE_DIR, 'package.json.tpl');
  const projectPkgPath = path.join(projectDir, 'package.json');

  if (!(await fs.pathExists(projectPkgPath))) return;

  const templateContent = await fs.readFile(templatePkgPath, 'utf-8');
  // Replace template placeholders so JSON.parse works
  const cleanedContent = templateContent.replace(/\{\{projectSlug\}\}/g, 'placeholder');
  const templatePkg = JSON.parse(cleanedContent);
  const projectPkg = await fs.readJson(projectPkgPath);

  let changed = false;

  // Merge dependencies
  if (!projectPkg.dependencies) projectPkg.dependencies = {};
  for (const [dep, version] of Object.entries(templatePkg.dependencies || {})) {
    if (!projectPkg.dependencies[dep]) {
      projectPkg.dependencies[dep] = version;
      stats.depChanges.push(`  + ${dep}@${version}`);
      changed = true;
    } else if (projectPkg.dependencies[dep] !== version) {
      const oldVersion = projectPkg.dependencies[dep];
      projectPkg.dependencies[dep] = version;
      stats.depChanges.push(`  \u2191 ${dep}: ${oldVersion} \u2192 ${version}`);
      changed = true;
    }
  }

  // Merge scripts
  if (!projectPkg.scripts) projectPkg.scripts = {};
  for (const [script, cmd] of Object.entries(templatePkg.scripts || {})) {
    if (projectPkg.scripts[script] !== cmd) {
      projectPkg.scripts[script] = cmd;
      changed = true;
    }
  }

  if (changed) {
    if (!dryRun) {
      await fs.writeJson(projectPkgPath, projectPkg, { spaces: 2 });
    }
    stats.updated.push('package.json');
  }
}

function printSummary(stats, dryRun) {
  const prefix = dryRun ? 'Would be' : '';

  if (stats.added.length) {
    console.log(`  ${dryRun ? 'New files (would add)' : 'Added'} (${stats.added.length}):`);
    for (const f of stats.added) console.log(`    + ${f}`);
    console.log();
  }

  if (stats.updated.length) {
    console.log(`  ${dryRun ? 'Changed files (would update)' : 'Updated'} (${stats.updated.length}):`);
    for (const f of stats.updated) console.log(`    \u2191 ${f}`);
    console.log();
  }

  if (stats.depChanges.length) {
    console.log('  Dependency changes:');
    for (const c of stats.depChanges) console.log(`  ${c}`);
    console.log();
  }

  if (stats.skipped.length) {
    console.log(`  Skipped (user files): ${stats.skipped.filter(f => !f.endsWith('.tpl')).join(', ')}`);
    console.log();
  }

  if (!stats.added.length && !stats.updated.length && !stats.depChanges.length) {
    console.log('  Already up to date — no changes needed.\n');
    return;
  }

  if (dryRun) {
    console.log('  Run without --dry-run to apply these changes.\n');
  } else {
    console.log('  Next steps:\n');
    console.log('    1. Review changes with: git diff');
    console.log('    2. Install dependencies:  npm install');
    console.log('    3. Verify the build:      npm run build');
    console.log('    4. Check config/site.ts for any new options (see upgrade guide)\n');
  }
}

module.exports = { upgrade };
