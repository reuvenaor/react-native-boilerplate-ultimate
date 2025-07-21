import fs from 'fs-extra';
import * as path from 'path';
import { getProjectName } from './project-name.js';

export interface ProjectInfo {
  name: string; // From getProjectName() (DRY)
  displayName: string; // From app.json displayName
  iosScheme: string; // For iOS folder paths
}

export function getProjectInfo(projectPath: string): ProjectInfo {
  // DRY: Reuse existing getProjectName utility
  const name = getProjectName(projectPath);

  // Simple app.json read for displayName
  let displayName = name;
  try {
    const appJsonPath = path.join(projectPath, 'app.json');
    const appJson = fs.readJsonSync(appJsonPath);
    displayName = appJson.displayName || appJson.name || name;
  } catch {
    // Fallback to name if app.json read fails
    displayName = name;
  }

  // Simple iOS scheme detection
  let iosScheme = name;
  try {
    const iosDir = path.join(projectPath, 'ios');
    if (fs.existsSync(iosDir)) {
      const items = fs.readdirSync(iosDir);
      // Find first valid folder that's not system folders
      const validFolder = items.find(item => {
        if (['Pods', 'build', 'DerivedData'].includes(item)) return false;
        try {
          return fs.statSync(path.join(iosDir, item)).isDirectory();
        } catch {
          return false;
        }
      });
      iosScheme = validFolder || name;
    }
  } catch {
    // Fallback to name if iOS detection fails
    iosScheme = name;
  }

  return {
    name,
    displayName,
    iosScheme,
  };
}
