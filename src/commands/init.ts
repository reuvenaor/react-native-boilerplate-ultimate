import { Command } from 'commander';
import fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import ora from 'ora';
import {
  validateProjectName,
  getTemplateDirectory,
  transformPackageJsonName,
  renameReactNativeApp,
  getProjectInfo,
  getErrorMessage,
  readPackageJson,
  packageJsonExists,
  writePackageJson,
  logSuccess,
  logError,
  logWarning,
  logGray,
  logHeader,
  logWhite,
  successMessage,
  warningMessage,
} from '../utils/index.js';

interface InitOptions {
  destination?: string;
  skipInstall?: boolean;
  template?: string;
}

function copyDirectory(
  source: string,
  destination: string,
  projectName: string
): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const items = fs.readdirSync(source);

  for (const item of items) {
    // Skip git-related files and directories
    if (item === '.git' || item === '.gitmodules') {
      continue;
    }

    const sourcePath = path.join(source, item);
    const destinationPath = path.join(destination, item);

    const stats = fs.statSync(sourcePath);

    if (stats.isDirectory()) {
      copyDirectory(sourcePath, destinationPath, projectName);
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

function installDependencies(projectPath: string): void {
  try {
    execSync('npm install --legacy-peer-deps', {
      cwd: projectPath,
      stdio: 'inherit',
    });
  } catch {
    throw new Error('Failed to install dependencies');
  }
}

async function createProject(
  projectName: string,
  options: InitOptions
): Promise<void> {
  const { destination = process.cwd(), skipInstall } = options;
  const projectPath = path.join(destination, projectName);
  const templatePath = getTemplateDirectory();

  // Validate project name
  if (!validateProjectName(projectName)) {
    logError(`❌ Invalid project name: ${projectName}`);
    logWarning(
      'Project name should start with a letter and contain only letters, numbers, underscores, and hyphens.'
    );
    process.exit(1);
  }

  // Check if project directory already exists
  if (fs.existsSync(projectPath)) {
    logError(`❌ Project directory already exists: ${projectPath}`);
    process.exit(1);
  }

  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    logError(`❌ Template directory not found: ${templatePath}`);
    process.exit(1);
  }

  logHeader(`🚀 Creating project "${projectName}" at ${projectPath}`);
  logGray(`📁 Template source: ${templatePath}`);

  try {
    // Copy template files
    const copySpinner = ora('Copying template files...').start();
    copyDirectory(templatePath, projectPath, projectName);
    copySpinner.succeed(successMessage('Template files copied successfully'));

    // Update package.json name
    if (packageJsonExists(projectPath)) {
      const packageJson = readPackageJson(projectPath);
      packageJson.name = transformPackageJsonName(projectName);
      writePackageJson(projectPath, packageJson);
    }

    // Install dependencies first (needed for react-native-rename)
    if (!skipInstall) {
      const installSpinner = ora('Installing dependencies...').start();
      try {
        installDependencies(projectPath);
        installSpinner.succeed(successMessage('Dependencies installed'));
      } catch {
        installSpinner.fail(warningMessage('Dependency installation failed'));
      }
    }

    // Get current project info to check if rename is needed
    const currentProjectInfo = getProjectInfo(projectPath);
    logGray(
      `Current project name: "${currentProjectInfo.name}", Target: "${projectName}"`
    );

    // Rename app if the current name doesn't match desired project name
    if (currentProjectInfo.name !== projectName) {
      const renameSpinner = ora(
        `Renaming app from ${currentProjectInfo.name} to ${projectName}...`
      ).start();
      try {
        // Initialize git first (required by react-native-rename)
        execSync('git init', { cwd: projectPath, stdio: 'pipe' });

        await renameReactNativeApp(projectPath, projectName);

        // Verify the rename worked by reading project info again
        const updatedProjectInfo = getProjectInfo(projectPath);
        if (updatedProjectInfo.name === projectName) {
          renameSpinner.succeed(successMessage('App renamed successfully'));
        } else {
          renameSpinner.warn(
            warningMessage('App renamed but verification failed')
          );
        }
      } catch (error) {
        renameSpinner.fail(
          warningMessage(`App renaming failed: ${getErrorMessage(error)}`)
        );
        logGray(
          `Project created but still uses "${currentProjectInfo.name}" name`
        );
      }
    }

    // Success message
    logSuccess(`\n🎉 Project "${projectName}" created successfully!`);
    logGray(`📁 Location: ${projectPath}`);
    logHeader(`\nNext steps:`);
    logWhite(`  cd ${projectName}`);
    if (skipInstall) {
      logWhite(`  npm install --legacy-peer-deps`);
    }
    logWhite(`  npm run ios     # Run on iOS`);
    logWhite(`  npm run android # Run on Android`);
    logGray(
      '\nTo manage modules, use: @reuvenorg/react-native-boilerplate-ultimate modules --help'
    );
  } catch (error) {
    if (error instanceof Error)
      logError(`❌ Failed to create project: ${error.message}`);
    process.exit(1);
  }
}

export const initCommand = new Command('init')
  .description('Initialize a new React Native project from the template')
  .argument('<project-name>', 'Name of the project to create')
  .option(
    '-d, --destination <path>',
    'Destination directory (default: current directory)'
  )
  .option('--skip-install', 'Skip npm install')
  .option('-t, --template <name>', 'Template variant to use (default: main)')
  .action(createProject);
