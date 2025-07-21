import { Command } from 'commander';
import ora from 'ora';
import {
  execCommandInteractive,
  resolveProjectPath,
  ProjectPathOptions,
  getProjectInfo,
  getErrorMessage,
  logSuccess,
  logError,
  logHeader,
  successMessage,
  failMessage,
  infoMessage,
} from '../utils/index.js';

interface RefreshOptions extends ProjectPathOptions {
  watchman?: boolean;
  modules?: boolean;
  start?: boolean;
}

async function refreshWatchman(): Promise<void> {
  const spinner = ora('Clearing watchman watches...').start();

  try {
    execCommandInteractive('watchman watch-del-all');
    spinner.succeed(successMessage('Watchman watches cleared'));
  } catch (error) {
    spinner.fail(
      failMessage(`Failed to clear watchman watches: ${getErrorMessage(error)}`)
    );
    throw error;
  }
}

async function refreshModules(projectRoot: string): Promise<void> {
  const spinner = ora('Cleaning and reinstalling node modules...').start();

  try {
    execCommandInteractive('rm -rf node_modules/', projectRoot);
    execCommandInteractive('npm install --legacy-peer-dep', projectRoot);
    spinner.succeed(successMessage('Node modules refreshed'));
  } catch (error) {
    spinner.fail(
      failMessage(`Failed to refresh node modules: ${getErrorMessage(error)}`)
    );
    throw error;
  }
}

async function refreshStart(projectRoot: string): Promise<void> {
  const spinner = ora('Starting with cache reset...').start();

  try {
    spinner.info(infoMessage('Starting React Native with cache reset...'));
    spinner.stop();
    execCommandInteractive('npm run start -- --reset-cache', projectRoot);
  } catch (error) {
    logError(`❌ Failed to start with cache reset: ${getErrorMessage(error)}`);
    throw error;
  }
}

async function refreshAll(projectRoot: string): Promise<void> {
  const projectInfo = getProjectInfo(projectRoot);
  logHeader(
    `🔄 Full refresh for "${projectInfo.displayName}" - this may take a while...`
  );

  await refreshWatchman();
  await refreshModules(projectRoot);
  await refreshStart(projectRoot);
}

async function refreshAction(options: RefreshOptions): Promise<void> {
  try {
    const projectRoot = resolveProjectPath(options);

    if (options.watchman) {
      await refreshWatchman();
    } else if (options.modules) {
      await refreshModules(projectRoot);
    } else if (options.start) {
      await refreshStart(projectRoot);
    } else {
      // Default to all
      await refreshAll(projectRoot);
    }

    if (!options.start) {
      logSuccess('\n🎉 Refresh completed successfully!');
    }
  } catch (error) {
    logError(`❌ ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

export const refreshCommand = new Command('refresh')
  .description('Refresh React Native project (watchman, modules, cache)')
  .option('-w, --watchman', 'Clear watchman watches only')
  .option('-m, --modules', 'Clean and reinstall node modules only')
  .option('-s, --start', 'Start with cache reset only')
  .option('--destination <path>', 'Project directory path')
  .action(refreshAction);
