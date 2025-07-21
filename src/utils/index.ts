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
    if (packageJsonExists(currentPath)) {
      try {
        const packageJson = readPackageJson(currentPath);
        if (isReactNativeProject(packageJson)) {
          return currentPath;
        }
      } catch {
        // Continue searching if package.json is malformed
      }
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
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

export function transformPackageJsonName(projectName: string): string {
  return projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
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
    if (!packageJsonExists(projectPath)) {
      throw new Error(`No package.json found at: ${projectPath}`);
    }

    try {
      const packageJson = readPackageJson(projectPath);
      if (!isReactNativeProject(packageJson)) {
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
      throw new Error(
        'Not in a React Native project directory. Use --destination to specify project path.'
      );
    }
    projectPath = foundRoot;
  }

  return projectPath;
}

export { getProjectName, renameReactNativeApp } from './project-name.js';
export { getProjectInfo, ProjectInfo } from './project-info.js';
export { getErrorMessage } from './error-handling.js';
export {
  readPackageJson,
  packageJsonExists,
  writePackageJson,
  isReactNativeProject,
  PackageJson,
} from './package-utils.js';
export * from './logging.js';

import {
  readPackageJson,
  packageJsonExists,
  isReactNativeProject,
} from './package-utils.js';
