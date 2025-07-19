#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { modulesCommand } from './commands/modules.js';
import { iconsCommand } from './commands/icons.js';
import { refreshCommand } from './commands/refresh.js';
import { devicesCommand } from './commands/devices.js';

const program = new Command();

program
  .name('@reuvenorg/react-native-boilerplate-ultimate')
  .description(
    'CLI tool for React Native Template ER - Create projects and manage modules'
  )
  .version('1.0.0');

// Add subcommands
program.addCommand(initCommand);
program.addCommand(modulesCommand);
program.addCommand(iconsCommand);
program.addCommand(refreshCommand);
program.addCommand(devicesCommand);

// Parse arguments
program.parse();
