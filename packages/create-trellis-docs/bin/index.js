#!/usr/bin/env node

const { Command } = require('commander');
const { init } = require('../lib/index');
const pkg = require('../package.json');

const program = new Command();

program
  .name('create-trellis-docs')
  .version(pkg.version)
  .description('Create a new Trellis documentation site')
  .argument('[project-name]', 'Name of the project directory')
  .option('-s, --skip-install', 'Skip dependency installation')
  .option(
    '-p, --package-manager <pm>',
    'Package manager to use (npm, yarn, pnpm)',
    'yarn'
  )
  .action(async (projectName, options) => {
    try {
      await init(projectName, options);
    } catch (err) {
      console.error('\nError:', err.message);
      process.exit(1);
    }
  });

program.parse();
