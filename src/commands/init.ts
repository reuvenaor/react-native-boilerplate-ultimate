import { Command } from 'commander';
import fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import { validateProjectName, getTemplateDirectory } from '../utils/index.js';

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

function createProject(projectName: string, options: InitOptions): void {
  const { destination = process.cwd(), skipInstall } = options;
  const projectPath = path.join(destination, projectName);
  const templatePath = getTemplateDirectory();

  // Validate project name
  if (!validateProjectName(projectName)) {
    console.error(chalk.red(`❌ Invalid project name: ${projectName}`));
    console.error(
      chalk.yellow(
        'Project name should start with a letter and contain only letters, numbers, underscores, and hyphens.'
      )
    );
    process.exit(1);
  }

  // Check if project directory already exists
  if (fs.existsSync(projectPath)) {
    console.error(
      chalk.red(`❌ Project directory already exists: ${projectPath}`)
    );
    process.exit(1);
  }

  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    console.error(
      chalk.red(`❌ Template directory not found: ${templatePath}`)
    );
    process.exit(1);
  }

  console.log(
    chalk.blue(`🚀 Creating project "${projectName}" at ${projectPath}`)
  );
  console.log(chalk.gray(`📁 Template source: ${templatePath}`));

  try {
    // Copy template files
    const copySpinner = ora('Copying template files...').start();
    copyDirectory(templatePath, projectPath, projectName);
    copySpinner.succeed(chalk.green('✅ Template files copied successfully'));

    // Update package.json name
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.name = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
    }

    // Install dependencies
    if (!skipInstall) {
      const installSpinner = ora('Installing dependencies...').start();
      try {
        installDependencies(projectPath);
        installSpinner.succeed(chalk.green('✅ Dependencies installed'));
      } catch {
        installSpinner.fail(chalk.yellow('⚠️  Dependency installation failed'));
      }
    }

    // Success message
    console.log(
      chalk.green(`\n🎉 Project "${projectName}" created successfully!`)
    );
    console.log(chalk.gray(`📁 Location: ${projectPath}`));
    console.log(chalk.blue(`\nNext steps:`));
    console.log(chalk.white(`  cd ${projectName}`));
    if (skipInstall) {
      console.log(chalk.white(`  npm install`));
    }
    console.log(chalk.white(`  npm run ios     # Run on iOS`));
    console.log(chalk.white(`  npm run android # Run on Android`));
    console.log(
      chalk.gray(
        `\nTo manage modules, use: ${chalk.cyan(
          '@reuvenorg/react-native-boilerplate-ultimate modules --help'
        )}`
      )
    );
  } catch (error) {
    if (error instanceof Error)
      console.error(chalk.red('❌ Failed to create project:'), error?.message);
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
