#!/usr/bin/env node

const { Command } = require('commander');
const { init } = require('../lib/index');
const { upgrade } = require('../lib/upgrade');

const pkg = require('../package.json');

const program = new Command();

program
  .name('create-trellis-docs')
  .version(pkg.version)
  .description('Create a new Trellis documentation site');

// Default command: scaffold a new project
program
  .argument('[project-name]', 'Name of the project directory')
  .option('-s, --skip-install', 'Skip dependency installation')
  .option(
    '-p, --package-manager <pm>',
    'Package manager to use (npm, yarn, pnpm)',
    'npm'
  )
  .action(async (projectName, options) => {
    try {
      await init(projectName, options);
    } catch (err) {
      console.error('\nError:', err.message);
      process.exit(1);
    }
  });

// Upgrade command: update framework files in an existing project
program
  .command('upgrade')
  .description('Upgrade framework files in an existing Trellis project')
  .option('--dry-run', 'Preview changes without writing files')
  .option('-s, --skip-install', 'Skip dependency installation after upgrade')
  .option(
    '-p, --package-manager <pm>',
    'Package manager to use (npm, yarn, pnpm)',
    'npm'
  )
  .action(async (options) => {
    try {
      await upgrade(options);
    } catch (err) {
      console.error('\nError:', err.message);
      process.exit(1);
    }
  });

program.parse();
