import chalk from 'chalk';

// Spinner message helpers
export function successMessage(message: string): string {
  return chalk.green(`✅ ${message}`);
}

export function failMessage(message: string): string {
  return chalk.red(`❌ ${message}`);
}

export function warningMessage(message: string): string {
  return chalk.yellow(`⚠️ ${message}`);
}

export function infoMessage(message: string): string {
  return chalk.blue(`ℹ️ ${message}`);
}

// Console logging helpers
export function logHeader(message: string): void {
  console.log(chalk.blue(message));
}

export function logSubheader(message: string): void {
  console.log(chalk.gray(message));
}

export function logSuccess(message: string): void {
  console.log(chalk.green(message));
}

export function logError(message: string): void {
  console.error(chalk.red(message));
}

export function logWarning(message: string): void {
  console.log(chalk.yellow(message));
}

export function logInfo(message: string): void {
  console.log(chalk.cyan(message));
}

export function logGray(message: string): void {
  console.log(chalk.gray(message));
}

export function logWhite(message: string): void {
  console.log(chalk.white(message));
}
