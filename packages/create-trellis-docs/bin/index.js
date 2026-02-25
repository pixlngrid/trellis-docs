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

// Upgrade command: update an existing project
program
  .command('upgrade')
  .description('Upgrade an existing Trellis project to the latest template')
  .option('-d, --dry-run', 'Preview changes without modifying files')
  .action(async (options) => {
    try {
      await upgrade(options);
    } catch (err) {
      console.error('\nError:', err.message);
      process.exit(1);
    }
  });

program.parse();
