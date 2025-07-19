# Contributing to React Native Boilerplate Ultimate

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Link for local testing: `npm link`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Build the project: `npm run build`
6. Test the CLI locally: `@reuvenorg/react-native-boilerplate-ultimate --help`
7. Commit and push your changes
8. Create a Pull Request

## Code Style

- Use TypeScript for all source code
- Follow existing code style and patterns
- Run `npm run format` to format code with Prettier
- Ensure `npm run lint` passes without errors

## Testing

- Write tests for new features
- Ensure all existing tests pass
- Test the CLI commands manually in a test directory

## Documentation

- Update README.md for new features
- Add entries to CHANGELOG.md
- Document new CLI options and commands

## Commit Messages

Use conventional commit format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for testing changes

## Pull Request Process

1. Ensure your PR description clearly describes the changes
2. Link any related issues
3. Make sure CI passes
4. Request review from maintainers
