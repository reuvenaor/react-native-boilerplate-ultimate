import fs from 'fs-extra';
import * as path from 'path';
import { execCommandInteractive } from './index.js';

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
  // Use npx to run react-native-rename (it will download automatically if needed)
  try {
    execCommandInteractive(
      `npx react-native-rename "${newName}" --skipGitStatusCheck --bundleID com.${newName.toLowerCase()}`,
      projectPath
    );
  } catch {
    // Fallback: try without bundleID
    execCommandInteractive(
      `npx react-native-rename "${newName}" --skipGitStatusCheck`,
      projectPath
    );
  }
}
