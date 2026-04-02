const path = require('path');
const fs = require('fs-extra');
const prompts = require('prompts');
const spawn = require('cross-spawn');

const TEMPLATE_DIR = path.join(__dirname, '..', 'template');
const WORKFLOWS_DIR = path.join(__dirname, '..', 'workflows');

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function promptForMissing(projectName) {
  const questions = [];

  if (!projectName) {
    questions.push({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-docs',
      validate: (val) =>
        /^[a-z0-9][a-z0-9-]*$/.test(val) || 'Use lowercase letters, numbers, and hyphens',
    });
  }

  questions.push(
    {
      type: 'text',
      name: 'title',
      message: 'Site title:',
      initial: 'My Docs',
    },
    {
      type: 'text',
      name: 'tagline',
      message: 'Tagline:',
      initial: 'Documentation powered by Trellis',
    },
    {
      type: 'text',
      name: 'siteUrl',
      message: 'Site URL:',
      initial: 'https://example.com',
    },
    {
      type: 'text',
      name: 'repoUrl',
      message: 'GitHub repo URL (optional):',
      initial: '',
    },
    {
      type: 'select',
      name: 'deployTarget',
      message: 'Deployment target:',
      choices: [
        { title: 'None (I\'ll set it up later)', value: 'none' },
        { title: 'GitHub Pages', value: 'github-pages' },
        { title: 'Netlify', value: 'netlify' },
        { title: 'Vercel', value: 'vercel' },
      ],
      initial: 0,
    }
  );

  const answers = await prompts(questions, {
    onCancel: () => {
      console.log('\nScaffolding cancelled.');
      process.exit(0);
    },
  });

  return {
    projectName: projectName || answers.projectName,
    title: answers.title,
    tagline: answers.tagline,
    siteUrl: answers.siteUrl,
    repoUrl: answers.repoUrl,
    deployTarget: answers.deployTarget || 'none',
  };
}

function processTemplate(content, vars) {
  return content
    .replace(/\{\{projectName\}\}/g, vars.title)
    .replace(/\{\{projectSlug\}\}/g, vars.projectSlug)
    .replace(/\{\{tagline\}\}/g, vars.tagline)
    .replace(/\{\{siteUrl\}\}/g, vars.siteUrl)
    .replace(/\{\{repoUrl\}\}/g, vars.repoUrl);
}

async function copyTemplate(destDir, vars) {
  const SKIP = new Set(['node_modules', '.next', 'out']);

  async function copyDir(src, dest) {
    await fs.ensureDir(dest);
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      if (SKIP.has(entry.name)) continue;

      const srcPath = path.join(src, entry.name);
      const destName = entry.name === '_gitignore' ? '.gitignore' : entry.name;

      if (entry.isDirectory()) {
        await copyDir(srcPath, path.join(dest, destName));
      } else if (entry.name.endsWith('.tpl')) {
        // Template file — process placeholders and strip .tpl extension
        const content = await fs.readFile(srcPath, 'utf-8');
        const processed = processTemplate(content, vars);
        const finalName = destName.replace(/\.tpl$/, '');
        await fs.writeFile(path.join(dest, finalName), processed);
      } else {
        await fs.copy(srcPath, path.join(dest, destName));
      }
    }
  }

  await copyDir(TEMPLATE_DIR, destDir);
}

async function installWorkflow(destDir, vars) {
  if (!vars.deployTarget || vars.deployTarget === 'none') return;

  const workflowFile = `${vars.deployTarget}.yml.tpl`;
  const srcPath = path.join(WORKFLOWS_DIR, workflowFile);

  if (!await fs.pathExists(srcPath)) return;

  const ghDir = path.join(destDir, '.github', 'workflows');
  await fs.ensureDir(ghDir);

  let content = await fs.readFile(srcPath, 'utf-8');

  // Process template variables
  content = processTemplate(content, vars);

  // For GitHub Pages, compute basePath from the repo URL or project name
  if (vars.deployTarget === 'github-pages') {
    let basePath = '';
    if (vars.repoUrl) {
      const match = vars.repoUrl.match(/github\.com\/[\w.-]+\/([\w.-]+?)(?:\.git)?$/);
      if (match && !match[1].endsWith('.github.io')) {
        basePath = `/${match[1]}`;
      }
    }
    if (!basePath && vars.projectSlug) {
      basePath = `/${vars.projectSlug}`;
    }
    content = content.replace(/\{\{basePath\}\}/g, basePath);
  }

  const destName = `deploy.yml`;
  await fs.writeFile(path.join(ghDir, destName), content);
  console.log(`  Added .github/workflows/${destName} for ${vars.deployTarget}`);
}

function installDeps(projectDir, packageManager) {
  console.log(`\nInstalling dependencies with ${packageManager}...\n`);

  // Pass the real OS to npm via CLI flag so platform-specific optional deps
  // (e.g. lightningcss native binaries) install correctly even when the
  // user's .npmrc overrides `os` to a different value.  CLI flags have the
  // highest precedence and cannot be overridden by any .npmrc file.
  const args = ['install'];
  if (packageManager === 'npm') {
    args.push(`--os=${process.platform}`);
  }

  const result = spawn.sync(packageManager, args, {
    cwd: projectDir,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error(
      `\nDependency installation failed. Run "${packageManager} install" manually in the project directory.`
    );
    return false;
  }

  return true;
}

async function init(projectName, options = {}) {
  console.log('\n  Trellis — Create a new documentation site\n');

  const vars = await promptForMissing(projectName);
  vars.projectSlug = toSlug(vars.projectName);

  const destDir = path.resolve(process.cwd(), vars.projectName);

  if (await fs.pathExists(destDir)) {
    const contents = await fs.readdir(destDir);
    if (contents.length > 0) {
      throw new Error(`Directory "${vars.projectName}" already exists and is not empty.`);
    }
  }

  console.log(`\nScaffolding project in ${destDir}...\n`);

  await copyTemplate(destDir, vars);
  await installWorkflow(destDir, vars);

  // Generate a platform-specific .npmrc so native optional dependencies
  // (lightningcss, @tailwindcss/oxide) install correctly even when the
  // user's global .npmrc overrides `os` to a different value.
  const npmrcContent = [
    '# Auto-generated by create-trellis-docs for this platform.',
    '# Ensures native dependencies (lightningcss, @tailwindcss/oxide) install correctly.',
    '# Regenerate with: node -e "require(\'fs\').writeFileSync(\'.npmrc\', \'os = \' + process.platform + \'\\n\')"',
    `os = ${process.platform}`,
    '',
  ].join('\n');
  await fs.writeFile(path.join(destDir, '.npmrc'), npmrcContent);

  console.log('Project files created.');

  // Initialize git repo
  console.log('Initializing git repository...');
  spawn.sync('git', ['init'], { cwd: destDir, stdio: 'ignore' });
  spawn.sync('git', ['add', '-A'], { cwd: destDir, stdio: 'ignore' });
  spawn.sync('git', ['commit', '-m', 'Initial commit from create-trellis-docs'], {
    cwd: destDir,
    stdio: 'ignore',
  });
  console.log('Git repository initialized.');

  if (!options.skipInstall) {
    const pm = options.packageManager || 'npm';
    installDeps(destDir, pm);
  }

  const pm = options.packageManager || 'npm';
  const runCmd = pm === 'npm' ? 'npm run' : pm;

  const deployHint =
    vars.deployTarget === 'github-pages'
      ? `\n  Deploy to GitHub Pages:\n\n    ${runCmd} deploy\n`
      : vars.deployTarget === 'netlify'
        ? `\n  Deploy: Push to main — the GitHub Actions workflow handles Netlify deployment.\n  Set NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID in your repo secrets.\n`
        : vars.deployTarget === 'vercel'
          ? `\n  Deploy: Push to main — the GitHub Actions workflow handles Vercel deployment.\n  Set VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID in your repo secrets.\n`
          : '';

  console.log(`
  Done! Your Trellis docs site is ready.

  Next steps:

    cd ${vars.projectName}
    ${pm} install
    ${runCmd} dev

  Your site will be available at http://localhost:3000
${deployHint}`);
}

module.exports = { init };
