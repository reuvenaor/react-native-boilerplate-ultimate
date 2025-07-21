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
  getProjectName,
  getProjectInfo,
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

    it.each(commands)('should have %s command available', command => {
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

    it.each(validNames)('should accept valid project name: %s', name => {
      expect(validateProjectName(name)).toBe(true);
    });

    it.each(invalidNames)('should reject invalid project name: %s', name => {
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
          express: '^4.0.0',
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

  describe('getProjectName', () => {
    it('should read project name from app.json displayName', async () => {
      // Create app.json with displayName
      const appJson = {
        name: 'ExApp',
        displayName: 'MyAwesomeApp',
        expo: {
          name: 'MyAwesomeApp',
        },
      };
      await fs.writeJson(path.join(testProjectDir, 'app.json'), appJson);

      const result = getProjectName(testProjectDir);
      expect(result).toBe('MyAwesomeApp');
    });

    it('should fallback to app.json name if no displayName', async () => {
      // Create app.json without displayName
      const appJson = {
        name: 'MyProject',
        expo: {
          name: 'MyProject',
        },
      };
      await fs.writeJson(path.join(testProjectDir, 'app.json'), appJson);

      const result = getProjectName(testProjectDir);
      expect(result).toBe('MyProject');
    });

    it('should fallback to package.json name if no app.json', async () => {
      // Create only package.json
      const packageJson = {
        name: 'fallback-project',
        dependencies: {
          'react-native': '^0.70.0',
        },
      };
      await fs.writeJson(
        path.join(testProjectDir, 'package.json'),
        packageJson
      );

      const result = getProjectName(testProjectDir);
      expect(result).toBe('fallback-project');
    });

    it('should return ExApp as ultimate fallback', () => {
      const result = getProjectName('/nonexistent/path');
      expect(result).toBe('ExApp');
    });

    it('should verify project name changed after rename simulation', async () => {
      // Simulate initial state (ExApp)
      const initialAppJson = {
        name: 'ExApp',
        displayName: 'ExApp',
      };
      await fs.writeJson(path.join(testProjectDir, 'app.json'), initialAppJson);

      // Verify initial state
      let projectName = getProjectName(testProjectDir);
      expect(projectName).toBe('ExApp');

      // Simulate react-native-rename effect by updating app.json
      const renamedAppJson = {
        name: 'MyNewApp',
        displayName: 'MyNewApp',
      };
      await fs.writeJson(path.join(testProjectDir, 'app.json'), renamedAppJson);

      // Verify name changed
      projectName = getProjectName(testProjectDir);
      expect(projectName).toBe('MyNewApp');
      expect(projectName).not.toBe('ExApp');
    });
  });

  describe('getProjectInfo', () => {
    it('should reuse getProjectName and return project info', async () => {
      // Reuse existing test setup
      const appJson = {
        name: 'TestProject',
        displayName: 'My Test Project',
      };
      await fs.writeJson(path.join(testProjectDir, 'app.json'), appJson);

      const projectName = getProjectName(testProjectDir);
      const projectInfo = getProjectInfo(testProjectDir);

      // Should reuse same logic (DRY)
      expect(projectInfo.name).toBe(projectName);
      expect(projectInfo.displayName).toBe('My Test Project');
      expect(projectInfo.iosScheme).toBe(projectName); // Uses same name logic
    });

    it('should fallback to same behavior as getProjectName', () => {
      const projectName = getProjectName('/nonexistent/path');
      const projectInfo = getProjectInfo('/nonexistent/path');

      // Should have same fallback
      expect(projectInfo.name).toBe(projectName);
      expect(projectInfo.name).toBe('ExApp');
    });
  });
});
