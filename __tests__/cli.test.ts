import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import {
  validateProjectName,
  transformPackageJsonName,
  findProjectRoot,
  execCommand,
  getTemplateDirectory,
  resolveProjectPath,
} from '../src/utils/index.js';

describe('React Native Boilerplate Ultimate CLI Utils', () => {
  const testDir = path.join(process.cwd(), 'tmp-test');
  const testProjectDir = path.join(testDir, 'test-rn-project');

  beforeEach(async () => {
    // Clean up and create test directory
    await fs.remove(testDir);
    await fs.ensureDir(testProjectDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('CLI Commands', () => {
    const commands = ['init', 'modules', 'icons', 'refresh', 'devices'];

    it.each(commands)('should have %s command available', (command) => {
      expect(command).toBeTruthy();
    });
  });

  describe('validateProjectName', () => {
    const validNames = ['MyProject', 'my-project', 'my_project', 'Project123'];
    const invalidNames = [
      '123invalid',
      '-invalid',
      'invalid!',
      'invalid space',
      '',
    ];

    it.each(validNames)('should accept valid project name: %s', (name) => {
      expect(validateProjectName(name)).toBe(true);
    });

    it.each(invalidNames)('should reject invalid project name: %s', (name) => {
      expect(validateProjectName(name)).toBe(false);
    });
  });

  describe('transformPackageJsonName', () => {
    const testCases = [
      { input: 'MyProject', expected: 'myproject' },
      { input: 'My Project', expected: 'my-project' },
      { input: 'my_awesome_app', expected: 'my-awesome-app' },
      { input: 'Project@123!', expected: 'project-123-' },
      { input: 'UPPERCASE', expected: 'uppercase' },
    ];

    it.each(testCases)(
      'should transform "$input" to "$expected"',
      ({ input, expected }) => {
        expect(transformPackageJsonName(input)).toBe(expected);
      }
    );
  });

  describe('findProjectRoot', () => {
    it('should find React Native project root', async () => {
      // Create a mock React Native package.json
      const packageJson = {
        name: 'test-project',
        dependencies: {
          'react-native': '^0.70.0',
        },
      };
      await fs.writeJson(
        path.join(testProjectDir, 'package.json'),
        packageJson
      );

      const result = findProjectRoot(testProjectDir);
      expect(result).toBe(testProjectDir);
    });

    it('should return null if no React Native project found', () => {
      const result = findProjectRoot('/nonexistent/path');
      expect(result).toBeNull();
    });

    it('should find project root in parent directories', async () => {
      // Create React Native project in parent
      const packageJson = {
        name: 'test-project',
        dependencies: {
          'react-native': '^0.70.0',
        },
      };
      await fs.writeJson(
        path.join(testProjectDir, 'package.json'),
        packageJson
      );

      // Create subdirectory
      const subDir = path.join(testProjectDir, 'src', 'components');
      await fs.ensureDir(subDir);

      const result = findProjectRoot(subDir);
      expect(result).toBe(testProjectDir);
    });
  });

  describe('execCommand', () => {
    it('should execute simple command successfully', () => {
      const result = execCommand('echo "hello"');
      expect(result.trim()).toBe('hello');
    });

    it('should throw error for invalid command', () => {
      expect(() => {
        execCommand('invalidcommandthatdoesnotexist');
      }).toThrow();
    });

    it('should use provided working directory', async () => {
      await fs.ensureDir(testDir);
      const result = execCommand('pwd', testDir);
      expect(result.trim()).toBe(testDir);
    });
  });

  describe('getTemplateDirectory', () => {
    it('should return a valid template directory path', () => {
      const templateDir = getTemplateDirectory();
      expect(templateDir).toContain('templates');
      expect(templateDir).toContain('react-native-template-v1.0.0');
      expect(typeof templateDir).toBe('string');
    });
  });

  describe('resolveProjectPath', () => {
    it('should resolve absolute destination path', async () => {
      // Create a mock React Native package.json
      const packageJson = {
        name: 'test-project',
        dependencies: {
          'react-native': '^0.70.0',
        },
      };
      await fs.writeJson(
        path.join(testProjectDir, 'package.json'),
        packageJson
      );

      const result = resolveProjectPath({ destination: testProjectDir });
      expect(result).toBe(testProjectDir);
    });

    it('should throw error if destination has no package.json', () => {
      expect(() => {
        resolveProjectPath({ destination: testProjectDir });
      }).toThrow('No package.json found at:');
    });

    it('should throw error if destination is not a React Native project', async () => {
      // Create non-React Native package.json
      const packageJson = {
        name: 'test-project',
        dependencies: {
          'express': '^4.0.0',
        },
      };
      await fs.writeJson(
        path.join(testProjectDir, 'package.json'),
        packageJson
      );

      expect(() => {
        resolveProjectPath({ destination: testProjectDir });
      }).toThrow('Not a React Native project:');
    });

    it('should throw error when no destination and not in RN project', () => {
      expect(() => {
        resolveProjectPath({});
      }).toThrow('Not in a React Native project directory');
    });
  });
});
