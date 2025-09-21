# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

@gesslar/toolkit is a comprehensive Node.js ES6 utility library providing consistent patterns and abstractions for use across projects. The toolkit serves as a foundational layer with proven, functional utilities. Currently includes **FileObject** and **DirectoryObject** for file system operations, along with supporting utility classes for data validation, type checking, and error handling. Additional utilities will be added over time as they prove their worth.

## Architecture

### Core Structure

- **Main Export**: `src/index.js` - Re-exports all toolkit utilities
- **Current Utilities**: Located in `src/lib/` (proven functional components):
  - `FileObject.js` - File representation with metadata and operations
  - `DirectoryObject.js` - Directory representation with metadata and operations
  - `File.js` - Static utility methods for file operations, globbing, reading/writing
  - `Data.js` - Type checking, object manipulation, array operations
  - `Sass.js` - Custom error class with trace management
  - `Term.js` - Terminal output utilities
  - `Type.js` - Type specification parsing and validation
  - `Valid.js` - Value validation and assertion utilities
- **TypeScript Definitions**: `src/types/` provides comprehensive type definitions
- **Multiple Export Strategies**: Main library, individual classes, and utility groups

### Implementation Status

All current utilities are fully functional and production-ready. The toolkit provides a consistent abstraction layer that can be extended with additional proven utilities over time.

## Development Commands

### Core Commands

```bash
# Run the test/example
npm test

# Lint code
npx eslint src/ examples/

# Check lint with auto-fix
npx eslint --fix src/ examples/
```

### Package Management

```bash
# Install dependencies
npm install

# Install examples dependencies
cd examples/FileSystem && npm install
```

## Code Standards

### ESLint Configuration

The project uses a comprehensive ESLint setup with:

- **Style**: @stylistic/eslint-plugin-js with 2-space indentation
- **Documentation**: JSDoc requirements (descriptions mandatory)
- **Line Length**: 80 characters (warning)
- **Quotes**: Double quotes, no semicolons
- **Keyword Spacing**: Custom rules for control statements (`if(`, `while(`, etc.)

### Key Style Rules

- No trailing spaces or tabs
- Arrow functions use parens only as needed
- Object curly spacing: `{key: value}` (no internal spaces)
- Control statements must have braces on separate lines (no single-line if/for/while)
- Mandatory blank lines after control statements

### JSDoc Requirements

- All functions must have descriptions
- Use `@param` and `@returns` for function documentation
- Private methods marked with `@private`

## Testing & Examples

### Current Test Setup

- Tests run via the FileSystem example: `examples/FileSystem/index.js`
- Example demonstrates file system operations, data utilities, and object creation
- Uses real file system to test FileObject and DirectoryObject functionality

### Running Single Tests

```bash
# Run the FileSystem example (current test)
node examples/FileSystem/index.js

# Run with different Node versions (requires Node.js >=20)
node --version  # ensure >=20
```

## Module System Details

- **Type**: ES6 modules (`"type": "module"`)
- **Node Version**: Requires Node.js >=20
- **Import Style**: Use `.js` extensions in import paths even for `.ts` definition files
- **Binding Context**: Functions maintain their context appropriately for their use cases

## Development Notes

### Working with FileObject and DirectoryObject

- Both classes use private metadata objects that are sealed and frozen for immutability
- Path resolution handles both absolute and relative paths automatically
- File existence checks are async and return promises
- Directory objects can be created from strings or other directory objects

### File System Operations

- File utilities support JSON5, YAML, and plain text files
- Globbing support via the globby library for pattern matching
- Directory listing returns both files and directories as separate arrays
- Path utilities handle cross-platform path normalization

### Data Utilities

- Type checking system supports complex type specifications (unions, arrays)
- Object manipulation includes deep cloning, merging, and nested path operations
- Array utilities provide intersection, uniqueness, and async filtering
- Validation system integrates with type checking for comprehensive assertions

## File Paths and Structure

```text
src/
├── index.js              # Main export
├── lib/
│   ├── FileObject.js     # File abstraction with metadata
│   ├── DirectoryObject.js # Directory abstraction with metadata
│   ├── File.js           # Static file system utilities
│   ├── Data.js           # Data manipulation and type checking
│   ├── Sass.js           # Custom error handling
│   ├── Term.js           # Terminal output utilities
│   ├── Type.js           # Type specification and validation
│   └── Valid.js          # Assertion and validation utilities
└── types/
    ├── index.d.ts        # Main type exports
    ├── FileObject.d.ts   # FileObject type definitions
    ├── DirectoryObject.d.ts # DirectoryObject type definitions
    ├── File.d.ts         # File utilities type definitions
    └── *.d.ts            # Other utility type definitions

examples/
└── FileSystem/           # Example usage and current test
```

## License

Unlicensed (public domain equivalent)
