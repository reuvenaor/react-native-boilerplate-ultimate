# API Reference

## CLI Commands

### Global Options

All commands support these global options:

- `--help, -h` - Show help information
- `--version, -V` - Show version number

### `init` Command

Create a new React Native project.

```bash
@reuvenorg/react-native-boilerplate-ultimate init <project-name> [options]
```

**Arguments:**

- `project-name` - Name of the project to create

**Options:**

- `-d, --destination <path>` - Destination directory (default: current directory)
- `--skip-git` - Skip git repository initialization
- `--skip-install` - Skip npm install
- `-t, --template <name>` - Template variant to use (default: main)

### `modules` Command

Manage project modules.

```bash
@reuvenorg/react-native-boilerplate-ultimate modules [options]
```

**Options:**

- `-s, --status` - Show module status
- `-e, --enable <module>` - Enable a specific module or "all"
- `-d, --disable <module>` - Disable a specific module or "all"

**Available Modules:**

- `md-chat-ai-screen`
- `md-redux-screen`
- `md-skia-accelerometer-screen`

### `icons` Command

Generate app icons and splash screens.

```bash
@reuvenorg/react-native-boilerplate-ultimate icons [options]
```

**Options:**

- `--android` - Generate Android icons only
- `--ios` - Generate iOS icons only
- `--splash` - Generate splash screens only
- `--primary <color>` - Primary color (default: #1976D2)
- `--background <color>` - Background color (default: #FFFFFF)

### `devices` Command

List connected devices.

```bash
@reuvenorg/react-native-boilerplate-ultimate devices [options]
```

**Options:**

- `-d, --details` - Show detailed device information
- `-a, --android` - Show Android devices only
- `-i, --ios` - Show iOS devices only

### `refresh` Command

Refresh React Native project.

```bash
@reuvenorg/react-native-boilerplate-ultimate refresh [options]
```

**Options:**

- `-w, --watchman` - Clear watchman watches only
- `-m, --modules` - Clean and reinstall node modules only
- `-s, --start` - Start with cache reset only

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Command line usage error
