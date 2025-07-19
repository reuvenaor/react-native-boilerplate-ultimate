import fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function findProjectRoot(
  startPath: string = process.cwd()
): string | null {
  let currentPath = startPath;

  while (currentPath !== path.dirname(currentPath)) {
    const packageJsonPath = path.join(currentPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = fs.readJsonSync(packageJsonPath);
      // Check if it's a React Native project
      if (
        packageJson.dependencies?.['react-native'] ||
        packageJson.devDependencies?.['react-native']
      ) {
        return currentPath;
      }
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

export function isInProject(): boolean {
  return findProjectRoot() !== null;
}

export function execCommand(command: string, cwd?: string): string {
  try {
    return execSync(command, {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Command failed: ${command}\n${errorMessage}`);
  }
}

export function execCommandInteractive(command: string, cwd?: string): void {
  try {
    execSync(command, {
      cwd: cwd || process.cwd(),
      stdio: 'inherit',
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Command failed: ${command}\n${errorMessage}`);
  }
}

export function validateProjectName(name: string): boolean {
  const validNameRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
  return validNameRegex.test(name);
}

export function getTemplateDirectory(): string {
  // Get the template directory relative to the CLI package
  const cliDir = path.dirname(path.dirname(__dirname));
  const templateDir = path.join(
    cliDir,
    'templates',
    'react-native-template-v1.0.0'
  );
  return templateDir;
}

export const EXCLUDED_PATHS = [
  'node_modules',
  '.git',
  'vendor',
  'cli',
  'ios/build',
  'android/build',
  // We want the lock files
  // 'ios/ExApp.xcworkspace/xcuserdata',
  // 'ios/Podfile.lock',
  // 'package-lock.json',
  '.expo',
  'dist',
  'build',
  'scripts/create-project.ts',
];

export function shouldExcludePath(filePath: string): boolean {
  return EXCLUDED_PATHS.some(
    (excludedPath) =>
      filePath.includes(excludedPath) || filePath.includes(`/${excludedPath}/`)
  );
}

export function isTextFile(filePath: string): boolean {
  const textExtensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
    '.md',
    '.txt',
    '.yml',
    '.yaml',
    '.xml',
    '.gradle',
    '.properties',
    '.swift',
    '.kt',
    '.java',
    '.storyboard',
    '.plist',
    '.xcscheme',
    '.pbxproj',
    '.lockfile',
    '.config',
    '.gitignore',
    '.env',
    '.sh',
    '.bat',
    '.xcprivacy',
  ];

  const ext = path.extname(filePath).toLowerCase();
  return textExtensions.includes(ext) || !path.extname(filePath);
}

export function replaceTemplateVariables(
  content: string,
  projectName: string
): string {
  let result = content;
  const projectNameLower = projectName.toLowerCase();
  const projectNameKebab = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  result = result.replace(/ExApp/g, projectName);
  result = result.replace(/exapp/g, projectNameLower);
  result = result.replace(
    /com\.anonymous\.exapp/g,
    `com.anonymous.${projectNameLower}`
  );
  result = result.replace(/react-native-template-er/g, projectNameKebab);

  return result;
}

// Common interface for commands that accept project path
export interface ProjectPathOptions {
  destination?: string;
}

// Common function to resolve and validate project path
export function resolveProjectPath(options: ProjectPathOptions): string {
  let projectPath: string;

  if (options.destination) {
    // If destination is provided, resolve it to absolute path
    projectPath = path.resolve(options.destination);
    
    // Validate that the destination is a React Native project
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`No package.json found at: ${projectPath}`);
    }

    try {
      const packageJson = fs.readJsonSync(packageJsonPath);
      if (
        !packageJson.dependencies?.['react-native'] &&
        !packageJson.devDependencies?.['react-native']
      ) {
        throw new Error(`Not a React Native project: ${projectPath}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to read package.json at: ${projectPath}`);
    }
  } else {
    // If no destination provided, find project root from current directory
    const foundRoot = findProjectRoot();
    if (!foundRoot) {
      throw new Error('Not in a React Native project directory. Use --destination to specify project path.');
    }
    projectPath = foundRoot;
  }

  return projectPath;
}
