import { Command } from 'commander';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import {
  execCommandInteractive,
  resolveProjectPath,
  ProjectPathOptions,
  getProjectInfo,
  getErrorMessage,
  readPackageJson,
  logInfo,
  logSuccess,
  logError,
  logWarning,
  logGray,
  logHeader,
  successMessage,
  failMessage,
  warningMessage,
} from '../utils/index.js';

interface ModuleConfig {
  path: string;
  dependencies: string[];
}

interface ModulesConfig {
  [key: string]: ModuleConfig;
}

interface ModulesOptions extends ProjectPathOptions {
  status?: boolean;
  enable?: string;
  disable?: string;
}

function getModulesConfig(projectRoot: string): ModulesConfig {
  const modulesDir = path.join(projectRoot, 'modules');

  return {
    'md-chat-ai-screen': {
      path: path.join(modulesDir, 'chat-ai-screen'),
      dependencies: ['react-native-executorch@0.4.6'],
    },
    'md-redux-screen': {
      path: path.join(modulesDir, 'redux-screen'),
      dependencies: [],
    },
    'md-skia-accelerometer-screen': {
      path: path.join(modulesDir, 'skia-accelerometer-screen'),
      dependencies: [],
    },
  };
}

function isModuleLinked(moduleName: string, projectRoot: string): boolean {
  try {
    const packageJson = readPackageJson(projectRoot);
    return !!(packageJson.dependencies && packageJson.dependencies[moduleName]);
  } catch {
    return false;
  }
}

function linkModule(
  moduleName: string,
  moduleConfig: ModuleConfig,
  projectRoot: string
): void {
  try {
    logInfo(`Linking module: ${moduleName}...`);
    execCommandInteractive(
      `npm install ${moduleConfig.path} --save --legacy-peer-deps`,
      projectRoot
    );
    logSuccess(`Module ${moduleName} linked successfully.`);
  } catch (error) {
    throw new Error(
      `Error linking module ${moduleName}: ${getErrorMessage(error)}`
    );
  }
}

function unlinkModule(moduleName: string, projectRoot: string): void {
  try {
    logInfo(`Unlinking module: ${moduleName}...`);
    execCommandInteractive(
      `npm uninstall ${moduleName} --save --legacy-peer-deps`,
      projectRoot
    );
    logSuccess(`Module ${moduleName} unlinked successfully.`);
  } catch (error) {
    throw new Error(
      `Error unlinking module ${moduleName}: ${getErrorMessage(error)}`
    );
  }
}

function installDependencies(
  moduleName: string,
  moduleConfig: ModuleConfig,
  projectRoot: string
): void {
  if (!moduleConfig.dependencies.length) {
    return;
  }

  try {
    logInfo(`Installing dependencies for ${moduleName}...`);
    for (const dep of moduleConfig.dependencies) {
      logGray(`Installing ${dep}...`);
      execCommandInteractive(
        `npm install ${dep} --save --legacy-peer-deps`,
        projectRoot
      );
    }
    logSuccess(`Dependencies for ${moduleName} installed successfully.`);

    // Run iOS pod install automatically when dependencies are installed
    runIosPodInstall(projectRoot);
  } catch (error) {
    throw new Error(
      `Error installing dependencies for ${moduleName}: ${getErrorMessage(error)}`
    );
  }
}

function runIosPodInstall(projectRoot: string): void {
  try {
    logInfo('\n🍎 Running iOS pod install...');
    execCommandInteractive('npm run ios:pod-install', projectRoot);
    logSuccess('iOS pod install completed successfully.\n');
  } catch (error) {
    logWarning(`Error running iOS pod install: ${getErrorMessage(error)}`);
    logGray('You may need to run it manually: npm run ios:pod-install\n');
  }
}

async function uninstallDependencies(
  moduleName: string,
  moduleConfig: ModuleConfig,
  projectRoot: string
): Promise<void> {
  if (!moduleConfig.dependencies.length) {
    return;
  }

  const { shouldUninstall } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldUninstall',
      message: `Do you want to uninstall dependencies for ${moduleName}?`,
      default: false,
    },
  ]);

  if (!shouldUninstall) {
    return;
  }

  try {
    logInfo(`Uninstalling dependencies for ${moduleName}...`);
    for (const dep of moduleConfig.dependencies) {
      const depName = dep.split('@')[0]; // Remove version specifier
      logGray(`Uninstalling ${depName}...`);
      execCommandInteractive(
        `npm uninstall ${depName} --save --legacy-peer-deps`,
        projectRoot
      );
    }
    logSuccess(`Dependencies for ${moduleName} uninstalled successfully.`);

    // Run iOS pod install automatically when dependencies are uninstalled
    runIosPodInstall(projectRoot);
  } catch (error) {
    throw new Error(
      `Error uninstalling dependencies for ${moduleName}: ${getErrorMessage(error)}`
    );
  }
}

async function enableModules(
  moduleNames: string[],
  projectRoot: string
): Promise<void> {
  const modulesConfig = getModulesConfig(projectRoot);
  const spinner = ora('Enabling modules...').start();

  try {
    for (const moduleName of moduleNames) {
      if (!modulesConfig[moduleName]) {
        spinner.fail(failMessage(`Unknown module: ${moduleName}`));
        continue;
      }

      if (isModuleLinked(moduleName, projectRoot)) {
        spinner.info(warningMessage(`Module ${moduleName} is already linked.`));
      } else {
        spinner.stop();
        linkModule(moduleName, modulesConfig[moduleName], projectRoot);
        spinner.start();
      }

      spinner.stop();
      installDependencies(moduleName, modulesConfig[moduleName], projectRoot);
      spinner.start();
    }

    spinner.succeed(successMessage('Modules enabled successfully!'));
  } catch (error) {
    spinner.fail(
      failMessage(`Error enabling modules: ${getErrorMessage(error)}`)
    );
    throw error;
  }
}

async function disableModules(
  moduleNames: string[],
  projectRoot: string
): Promise<void> {
  const modulesConfig = getModulesConfig(projectRoot);
  const spinner = ora('Disabling modules...').start();

  try {
    for (const moduleName of moduleNames) {
      if (!modulesConfig[moduleName]) {
        spinner.fail(failMessage(`Unknown module: ${moduleName}`));
        continue;
      }

      if (!isModuleLinked(moduleName, projectRoot)) {
        spinner.info(
          warningMessage(`Module ${moduleName} is already unlinked.`)
        );
      } else {
        spinner.stop();
        unlinkModule(moduleName, projectRoot);
        spinner.start();
      }

      spinner.stop();
      await uninstallDependencies(
        moduleName,
        modulesConfig[moduleName],
        projectRoot
      );
      spinner.start();
    }

    spinner.succeed(successMessage('Modules disabled successfully!'));
  } catch (error) {
    spinner.fail(
      failMessage(`Error disabling modules: ${getErrorMessage(error)}`)
    );
    throw error;
  }
}

function showModuleStatus(projectRoot: string): void {
  const modulesConfig = getModulesConfig(projectRoot);

  logHeader('\nModule Status:');
  logHeader('==============');

  for (const [moduleName, config] of Object.entries(modulesConfig)) {
    const isLinked = isModuleLinked(moduleName, projectRoot);
    const status = isLinked
      ? chalk.green('✅ LINKED')
      : chalk.red('❌ UNLINKED');
    logInfo(`${moduleName}: ${status}`);

    if (config.dependencies.length > 0) {
      logGray(`  Dependencies: ${config.dependencies.join(', ')}`);
    }
  }
  logGray('');
}

async function interactiveMode(projectRoot: string): Promise<void> {
  const modulesConfig = getModulesConfig(projectRoot);
  const projectInfo = getProjectInfo(projectRoot);

  logHeader(`\n🔧 Module Setup Tool for "${projectInfo.displayName}"`);
  logHeader('===========================================');
  showModuleStatus(projectRoot);

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Enable specific module(s)', value: 'enable' },
        { name: 'Disable specific module(s)', value: 'disable' },
        { name: 'Enable all modules', value: 'enableAll' },
        { name: 'Disable all modules', value: 'disableAll' },
        { name: 'Show status', value: 'status' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);

  switch (action) {
    case 'enable': {
      const { enableModules: selectedEnableModules } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'enableModules',
          message: 'Select modules to enable:',
          choices: Object.keys(modulesConfig).map(name => ({
            name: `${name} ${
              isModuleLinked(name, projectRoot) ? '(already linked)' : ''
            }`,
            value: name,
          })),
        },
      ]);
      if (selectedEnableModules.length > 0) {
        await enableModules(selectedEnableModules, projectRoot);
      }
      break;
    }

    case 'disable': {
      const { disableModules: selectedDisableModules } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'disableModules',
          message: 'Select modules to disable:',
          choices: Object.keys(modulesConfig).map(name => ({
            name: `${name} ${
              !isModuleLinked(name, projectRoot) ? '(already unlinked)' : ''
            }`,
            value: name,
          })),
        },
      ]);
      if (selectedDisableModules.length > 0) {
        await disableModules(selectedDisableModules, projectRoot);
      }
      break;
    }

    case 'enableAll':
      await enableModules(Object.keys(modulesConfig), projectRoot);
      break;

    case 'disableAll':
      await disableModules(Object.keys(modulesConfig), projectRoot);
      break;

    case 'status':
      showModuleStatus(projectRoot);
      break;

    case 'exit':
      logGray('Exiting...');
      break;
  }
}

async function modulesAction(options: ModulesOptions): Promise<void> {
  try {
    const projectRoot = resolveProjectPath(options);
    const modulesConfig = getModulesConfig(projectRoot);

    if (options.status) {
      showModuleStatus(projectRoot);
      return;
    }

    if (options.enable) {
      const modules =
        options.enable === 'all'
          ? Object.keys(modulesConfig)
          : [options.enable];
      await enableModules(modules, projectRoot);
      return;
    }

    if (options.disable) {
      const modules =
        options.disable === 'all'
          ? Object.keys(modulesConfig)
          : [options.disable];
      await disableModules(modules, projectRoot);
      return;
    }

    // Interactive mode
    await interactiveMode(projectRoot);
  } catch (error) {
    logError(`❌ ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

export const modulesCommand = new Command('modules')
  .description('Manage project modules (enable/disable/status)')
  .option('-s, --status', 'Show module status')
  .option('-e, --enable <module>', 'Enable a specific module or "all"')
  .option('-d, --disable <module>', 'Disable a specific module or "all"')
  .option('--destination <path>', 'Project directory path')
  .action(modulesAction);
