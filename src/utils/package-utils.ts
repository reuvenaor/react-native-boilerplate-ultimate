import fs from 'fs-extra';
import * as path from 'path';

export interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export function readPackageJson(projectPath: string): PackageJson {
  const packageJsonPath = path.join(projectPath, 'package.json');
  return fs.readJsonSync(packageJsonPath);
}

export function packageJsonExists(projectPath: string): boolean {
  const packageJsonPath = path.join(projectPath, 'package.json');
  return fs.existsSync(packageJsonPath);
}

export function writePackageJson(
  projectPath: string,
  packageJson: PackageJson
): void {
  const packageJsonPath = path.join(projectPath, 'package.json');
  fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
}

export function isReactNativeProject(packageJson: PackageJson): boolean {
  return !!(
    packageJson.dependencies?.['react-native'] ||
    packageJson.devDependencies?.['react-native']
  );
}
