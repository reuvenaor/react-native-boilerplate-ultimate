import { Command } from 'commander';
import chalk from 'chalk';
import {
  execCommand,
  ProjectPathOptions,
  logError,
  logWarning,
  logGray,
  logHeader,
} from '../utils/index.js';

interface DeviceInfo {
  id: string;
  status: string;
  details?: {
    [key: string]: string;
  };
}

function checkAdbInstalled(): boolean {
  try {
    execCommand('which adb');
    return true;
  } catch {
    return false;
  }
}

function checkXcrunInstalled(): boolean {
  try {
    execCommand('which xcrun');
    return true;
  } catch {
    return false;
  }
}

function checkLibimobiledeviceInstalled(): boolean {
  try {
    execCommand('which ideviceinfo');
    return true;
  } catch {
    return false;
  }
}

function listAndroidDevices(showDetails: boolean): DeviceInfo[] {
  if (!checkAdbInstalled()) {
    logError('❌ ADB is not installed or not in PATH');
    logWarning('Please install Android SDK platform tools');
    return [];
  }

  try {
    // Start ADB server if not running
    execCommand('adb start-server');

    // Get devices
    const output = execCommand('adb devices');
    const lines = output
      .split('\n')
      .filter(line => line.trim() && !line.includes('List of devices'));

    const devices: DeviceInfo[] = [];

    for (const line of lines) {
      const parts = line.trim().split('\t');
      if (parts.length >= 2) {
        const device: DeviceInfo = {
          id: parts[0],
          status: parts[1],
        };

        if (showDetails && parts[1] === 'device') {
          try {
            device.details = {
              model: execCommand(
                `adb -s ${parts[0]} shell getprop ro.product.model`
              ).trim(),
              android: execCommand(
                `adb -s ${parts[0]} shell getprop ro.build.version.release`
              ).trim(),
              apiLevel: execCommand(
                `adb -s ${parts[0]} shell getprop ro.build.version.sdk`
              ).trim(),
              brand: execCommand(
                `adb -s ${parts[0]} shell getprop ro.product.brand`
              ).trim(),
              device: execCommand(
                `adb -s ${parts[0]} shell getprop ro.product.device`
              ).trim(),
            };
          } catch {
            // Ignore errors when getting device details
          }
        }

        devices.push(device);
      }
    }

    return devices;
  } catch {
    logError('❌ Failed to list Android devices');
    return [];
  }
}

function listIOSDevices(showDetails: boolean): {
  physical: DeviceInfo[];
  simulators: DeviceInfo[];
} {
  if (!checkXcrunInstalled()) {
    logError('❌ xcrun is not installed or not in PATH');
    logWarning('Please install Xcode Command Line Tools');
    return { physical: [], simulators: [] };
  }

  try {
    // Get real devices
    const physicalDevices: DeviceInfo[] = [];
    try {
      const realDevicesOutput = execCommand(
        'xcrun xctrace list devices 2>/dev/null'
      );
      const realDeviceLines = realDevicesOutput
        .split('\n')
        .filter(
          line =>
            line.trim() &&
            !line.includes('Devices') &&
            !line.includes('==') &&
            !line.includes('macOS') &&
            !line.includes('Simulator')
        );

      for (const line of realDeviceLines) {
        const cleanLine = line.replace(/\s*\(.*\)\s*/g, '').trim();
        if (cleanLine) {
          physicalDevices.push({
            id: cleanLine,
            status: 'connected',
          });
        }
      }
    } catch {
      // Ignore errors when getting physical devices
    }

    // Get simulators
    const simulators: DeviceInfo[] = [];
    try {
      const simulatorsOutput = execCommand('xcrun simctl list devices');
      const simulatorLines = simulatorsOutput
        .split('\n')
        .filter(line => line.includes('Booted'));

      for (const line of simulatorLines) {
        const cleanLine = line.replace(/\s*\(.*\)\s*/g, '').trim();
        if (cleanLine) {
          simulators.push({
            id: cleanLine,
            status: 'booted',
          });
        }
      }
    } catch {
      // Ignore errors when getting simulators
    }

    // Add details for physical devices if requested
    if (
      showDetails &&
      physicalDevices.length > 0 &&
      checkLibimobiledeviceInstalled()
    ) {
      try {
        const deviceIds = execCommand('idevice_id -l')
          .trim()
          .split('\n')
          .filter(id => id.trim());

        for (const deviceId of deviceIds) {
          const device = physicalDevices.find(d => d.id.includes(deviceId));
          if (device) {
            try {
              device.details = {
                productName: execCommand(
                  `ideviceinfo -u ${deviceId} -k ProductName`
                ).trim(),
                iosVersion: execCommand(
                  `ideviceinfo -u ${deviceId} -k ProductVersion`
                ).trim(),
                deviceName: execCommand(
                  `ideviceinfo -u ${deviceId} -k DeviceName`
                ).trim(),
                model: execCommand(
                  `ideviceinfo -u ${deviceId} -k DeviceClass`
                ).trim(),
                hardware: execCommand(
                  `ideviceinfo -u ${deviceId} -k HardwareModel`
                ).trim(),
              };
            } catch {
              // Ignore errors when getting device details
            }
          }
        }
      } catch {
        // Ignore errors when getting device details
      }
    }

    return { physical: physicalDevices, simulators };
  } catch {
    logError('❌ Failed to list iOS devices');
    return { physical: [], simulators: [] };
  }
}

function printAndroidDevices(
  devices: DeviceInfo[],
  showDetails: boolean
): void {
  logHeader('========================================');
  logHeader('      CONNECTED ANDROID DEVICES');
  logHeader('========================================');

  if (devices.length === 0) {
    logWarning('No Android devices connected.');
    return;
  }

  console.log('DEVICE ID                       STATUS');
  logGray('--------------------------------------');

  for (const device of devices) {
    const statusColor = device.status === 'device' ? chalk.green : chalk.yellow;
    console.log(
      `${chalk.cyan(device.id.padEnd(30))} ${statusColor(device.status)}`
    );

    if (showDetails && device.details) {
      logGray(`  • Model:     ${device.details.model}`);
      logGray(`  • Android:   ${device.details.android}`);
      logGray(`  • API Level: ${device.details.apiLevel}`);
      logGray(`  • Brand:     ${device.details.brand}`);
      logGray(`  • Device:    ${device.details.device}`);
      console.log('');
    }
  }
}

function printIOSDevices(
  devices: { physical: DeviceInfo[]; simulators: DeviceInfo[] },
  showDetails: boolean
): void {
  logHeader('========================================');
  logHeader('        CONNECTED IOS DEVICES');
  logHeader('========================================');

  if (devices.physical.length === 0 && devices.simulators.length === 0) {
    logWarning('No iOS devices or simulators detected.');
    return;
  }

  if (devices.physical.length > 0) {
    console.log('PHYSICAL DEVICES');
    logGray('--------------------------------------');

    for (const device of devices.physical) {
      console.log(chalk.cyan(device.id));

      if (showDetails && device.details) {
        logGray(`  • Product Name:  ${device.details.productName}`);
        logGray(`  • iOS Version:   ${device.details.iosVersion}`);
        logGray(`  • Device Name:   ${device.details.deviceName}`);
        logGray(`  • Model:         ${device.details.model}`);
        logGray(`  • Hardware:      ${device.details.hardware}`);
        console.log('');
      }
    }
  }

  if (devices.simulators.length > 0) {
    console.log('RUNNING SIMULATORS');
    logGray('--------------------------------------');

    for (const device of devices.simulators) {
      console.log(chalk.cyan(device.id));
    }
  }

  if (
    showDetails &&
    devices.physical.length > 0 &&
    !checkLibimobiledeviceInstalled()
  ) {
    logWarning('\nFor detailed device information, install libimobiledevice:');
    console.log('  brew install libimobiledevice');
  }
}

interface DevicesOptions extends ProjectPathOptions {
  details?: boolean;
  android?: boolean;
  ios?: boolean;
}

async function devicesAction(options: DevicesOptions): Promise<void> {
  const showDetails = options.details || false;

  logHeader('📱 Device Manager\n');

  if (options.android) {
    const androidDevices = listAndroidDevices(showDetails);
    printAndroidDevices(androidDevices, showDetails);
  } else if (options.ios) {
    const iosDevices = listIOSDevices(showDetails);
    printIOSDevices(iosDevices, showDetails);
  } else {
    // Show both
    const androidDevices = listAndroidDevices(showDetails);
    const iosDevices = listIOSDevices(showDetails);

    printAndroidDevices(androidDevices, showDetails);
    console.log('');
    printIOSDevices(iosDevices, showDetails);
  }

  if (showDetails) {
    logGray('\n💡 Tip: Run without --details flag for a quick overview');
  } else {
    logGray('\n💡 Tip: Use --details flag for more information');
  }
}

export const devicesCommand = new Command('devices')
  .description('List connected Android and iOS devices')
  .option('-d, --details', 'Show detailed device information')
  .option('-a, --android', 'Show Android devices only')
  .option('-i, --ios', 'Show iOS devices only')
  .option(
    '--destination <path>',
    'Project directory path (optional for devices command)'
  )
  .action(devicesAction);
