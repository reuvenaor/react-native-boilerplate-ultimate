import { Command } from 'commander';
import fs from 'fs-extra';
import * as path from 'path';
import ora from 'ora';
import {
  resolveProjectPath,
  ProjectPathOptions,
  getProjectInfo,
  getErrorMessage,
  readPackageJson,
  logSuccess,
  logError,
  logWarning,
  logGray,
  logHeader,
  successMessage,
  failMessage,
} from '../utils/index.js';

// Note: This command requires the 'canvas' package to be installed in the target project
// We'll provide instructions for this dependency

interface IconColors {
  primary: string;
  background: string;
}

interface CanvasModule {
  createCanvas: (width: number, height: number) => CanvasElement;
}

interface CanvasElement {
  getContext: (type: '2d') => CanvasRenderingContext2D;
  toBuffer: (format: string) => Buffer;
}

interface CanvasRenderingContext2D {
  fillStyle: string;
  fillRect: (x: number, y: number, width: number, height: number) => void;
  beginPath: () => void;
  arc: (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => void;
  fill: () => void;
  font: string;
  textAlign: string;
  textBaseline: string;
  fillText: (text: string, x: number, y: number) => void;
}

const DEFAULT_COLORS: IconColors = {
  primary: '#1976D2',
  background: '#FFFFFF',
};

// Android icon sizes
const ANDROID_ICONS = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// iOS icon sizes
const IOS_ICONS = {
  'Icon-20@2x.png': 40,
  'Icon-20@3x.png': 60,
  'Icon-29@2x.png': 58,
  'Icon-29@3x.png': 87,
  'Icon-40@2x.png': 80,
  'Icon-40@3x.png': 120,
  'Icon-60@2x.png': 120,
  'Icon-60@3x.png': 180,
  'Icon-76@2x.png': 152,
  'Icon-83.5@2x.png': 167,
  'Icon-1024.png': 1024,
};

function isCanvasModule(module: unknown): module is CanvasModule {
  if (typeof module !== 'object' || module === null) {
    return false;
  }

  if (!('createCanvas' in module)) {
    return false;
  }

  // Use Record type to safely access properties
  const moduleRecord: Record<string, unknown> = module;
  return typeof moduleRecord.createCanvas === 'function';
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function validateCanvasInstallation(projectRoot: string): boolean {
  try {
    const packageJson = readPackageJson(projectRoot);
    return !!(
      (packageJson.dependencies && packageJson.dependencies['canvas']) ||
      (packageJson.devDependencies && packageJson.devDependencies['canvas'])
    );
  } catch {
    return false;
  }
}

async function generateIcon(
  size: number,
  backgroundColor: string,
  foregroundColor: string
): Promise<Buffer> {
  try {
    // Dynamic import with string to avoid TypeScript resolution at compile time
    const moduleName = 'canvas';
    const canvasModule = await import(moduleName).catch(() => {
      throw new Error('Canvas package not found');
    });

    if (!isCanvasModule(canvasModule)) {
      throw new Error('Canvas module does not have expected interface');
    }

    const canvas = canvasModule.createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);

    // Foreground - simple circle
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.3;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = foregroundColor;
    ctx.fill();

    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${size * 0.15}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('App', centerX, centerY);

    return canvas.toBuffer('image/png');
  } catch {
    throw new Error(
      'Canvas package not found. Please install it in your project: npm install canvas --save-dev --legacy-peer-deps'
    );
  }
}

async function generateSplashLogo(
  size: number,
  colors: IconColors
): Promise<Buffer> {
  try {
    // Dynamic import with string to avoid TypeScript resolution at compile time
    const moduleName = 'canvas';
    const canvasModule = await import(moduleName).catch(() => {
      throw new Error('Canvas package not found');
    });

    if (!isCanvasModule(canvasModule)) {
      throw new Error('Canvas module does not have expected interface');
    }

    const canvas = canvasModule.createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Logo - circle
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = colors.primary;
    ctx.fill();

    // Inner text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${size * 0.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Logo', centerX, centerY);

    return canvas.toBuffer('image/png');
  } catch {
    throw new Error(
      'Canvas package not found. Please install it in your project: npm install canvas --save-dev --legacy-peer-deps'
    );
  }
}

async function generateAndroidIcons(
  projectRoot: string,
  colors: IconColors
): Promise<void> {
  const spinner = ora('Generating Android icons...').start();

  try {
    for (const [folder, size] of Object.entries(ANDROID_ICONS)) {
      const dirPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        folder
      );
      ensureDirectoryExists(dirPath);

      const iconBuffer = await generateIcon(
        size,
        colors.background,
        colors.primary
      );
      const filePath = path.join(dirPath, 'ic_launcher.png');
      fs.writeFileSync(filePath, iconBuffer);

      // Also create round icon
      const roundFilePath = path.join(dirPath, 'ic_launcher_round.png');
      fs.writeFileSync(roundFilePath, iconBuffer);
    }

    spinner.succeed(successMessage('Android icons generated successfully'));
  } catch (error) {
    spinner.fail(
      failMessage(`Failed to generate Android icons: ${getErrorMessage(error)}`)
    );
    throw error;
  }
}

async function generateIOSIcons(
  projectRoot: string,
  colors: IconColors
): Promise<void> {
  const spinner = ora('Generating iOS icons...').start();

  try {
    const projectInfo = getProjectInfo(projectRoot);
    const iosIconPath = path.join(
      projectRoot,
      'ios',
      projectInfo.iosScheme,
      'Images.xcassets',
      'AppIcon.appiconset'
    );
    ensureDirectoryExists(iosIconPath);

    for (const [filename, size] of Object.entries(IOS_ICONS)) {
      const iconBuffer = await generateIcon(
        size,
        colors.background,
        colors.primary
      );
      const filePath = path.join(iosIconPath, filename);
      fs.writeFileSync(filePath, iconBuffer);
    }

    spinner.succeed(successMessage('iOS icons generated successfully'));
  } catch (error) {
    spinner.fail(
      failMessage(`Failed to generate iOS icons: ${getErrorMessage(error)}`)
    );
    throw error;
  }
}

async function generateSplashScreens(
  projectRoot: string,
  colors: IconColors
): Promise<void> {
  const spinner = ora('Generating splash screens...').start();

  try {
    // Android splash screens
    const androidSplashSizes = [48, 72, 96, 144, 192];

    for (const size of androidSplashSizes) {
      const densityFolder = Object.entries(ANDROID_ICONS).find(
        ([, iconSize]) => iconSize === size
      )?.[0];

      if (!densityFolder) continue;

      const dirPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        densityFolder.replace('mipmap', 'drawable')
      );
      ensureDirectoryExists(dirPath);

      const logoBuffer = await generateSplashLogo(size, colors);
      const filePath = path.join(dirPath, 'splashscreen_logo.png');
      fs.writeFileSync(filePath, logoBuffer);
    }

    // iOS splash screen
    const projectInfo = getProjectInfo(projectRoot);
    const iosPath = path.join(
      projectRoot,
      'ios',
      projectInfo.iosScheme,
      'Images.xcassets',
      'SplashScreenLogo.imageset'
    );
    ensureDirectoryExists(iosPath);

    fs.writeFileSync(
      path.join(iosPath, 'splash-logo.png'),
      await generateSplashLogo(100, colors)
    );
    fs.writeFileSync(
      path.join(iosPath, 'splash-logo@2x.png'),
      await generateSplashLogo(200, colors)
    );
    fs.writeFileSync(
      path.join(iosPath, 'splash-logo@3x.png'),
      await generateSplashLogo(300, colors)
    );

    spinner.succeed(successMessage('Splash screens generated successfully'));
  } catch (error) {
    spinner.fail(
      failMessage(
        `Failed to generate splash screens: ${getErrorMessage(error)}`
      )
    );
    throw error;
  }
}

interface IconsOptions extends ProjectPathOptions {
  android?: boolean;
  ios?: boolean;
  splash?: boolean;
  primary?: string;
  background?: string;
}

async function iconsAction(options: IconsOptions): Promise<void> {
  try {
    const projectRoot = resolveProjectPath(options);
    const projectInfo = getProjectInfo(projectRoot);

    const colors: IconColors = {
      primary:
        typeof options.primary === 'string'
          ? options.primary
          : DEFAULT_COLORS.primary,
      background:
        typeof options.background === 'string'
          ? options.background
          : DEFAULT_COLORS.background,
    };

    logHeader(`🎨 Icon Generator for "${projectInfo.displayName}"`);
    logGray(`Primary color: ${colors.primary}`);
    logGray(`Background color: ${colors.background}`);

    // Check if canvas is installed
    if (!validateCanvasInstallation(projectRoot)) {
      logWarning('\n⚠️  Canvas package not found in project dependencies.');
      console.log(
        'Please install it first: npm install canvas --save-dev --legacy-peer-deps'
      );
      logGray('Note: Canvas package is required for icon generation.');
      return;
    }

    const isAndroidOnly = Boolean(options.android);
    const isIOSOnly = Boolean(options.ios);
    const isSplashOnly = Boolean(options.splash);

    if (isSplashOnly) {
      await generateSplashScreens(projectRoot, colors);
    } else if (isAndroidOnly) {
      await generateAndroidIcons(projectRoot, colors);
    } else if (isIOSOnly) {
      await generateIOSIcons(projectRoot, colors);
    } else {
      // Generate all
      await generateAndroidIcons(projectRoot, colors);
      await generateIOSIcons(projectRoot, colors);
      await generateSplashScreens(projectRoot, colors);
    }

    logSuccess('\n🎉 Icon generation completed successfully!');
  } catch (error) {
    logError(`❌ ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

export const iconsCommand = new Command('icons')
  .description('Generate app icons and splash screens')
  .option('--android', 'Generate Android icons only')
  .option('--ios', 'Generate iOS icons only')
  .option('--splash', 'Generate splash screens only')
  .option('--primary <color>', 'Primary color', DEFAULT_COLORS.primary)
  .option('--background <color>', 'Background color', DEFAULT_COLORS.background)
  .option('--destination <path>', 'Project directory path')
  .action(iconsAction);
