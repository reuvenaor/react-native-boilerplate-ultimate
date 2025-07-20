import fs from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execCommandInteractive } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getProjectName(projectPath: string): string {
  try {
    const appJsonPath = path.join(projectPath, 'app.json');
    const appJson = fs.readJsonSync(appJsonPath);
    return appJson.displayName || appJson.name || 'ExApp';
  } catch {
    // Fallback to package.json if app.json doesn't exist
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = fs.readJsonSync(packageJsonPath);
      return packageJson.name || 'ExApp';
    } catch {
      return 'ExApp'; // Ultimate fallback
    }
  }
}

export async function renameReactNativeApp(
  projectPath: string,
  newName: string
): Promise<void> {
  // Get the path to CLI's react-native-rename binary
  const cliRootPath = path.resolve(__dirname, '../../');
  const reactNativeRenamePath = path.join(
    cliRootPath,
    'node_modules/.bin/react-native-rename'
  );

  // Use react-native-rename from CLI dependencies
  try {
    execCommandInteractive(
      `"${reactNativeRenamePath}" "${newName}" --skipGitStatusCheck --bundleID com.${newName.toLowerCase()}`,
      projectPath
    );
  } catch {
    // Fallback: try without bundleID
    execCommandInteractive(
      `"${reactNativeRenamePath}" "${newName}" --skipGitStatusCheck`,
      projectPath
    );
  }
}
