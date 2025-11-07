# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

@gesslar/toolkit is a comprehensive Node.js ES6 utility library providing consistent patterns and abstractions across projects. This is a personal project emphasizing functional, proven utilities with strong opinions on code style.

## Development Commands

### Testing

```bash
# Run all unit tests
npm test

# Run a single test file
node --test tests/unit/Cache.test.js
node --test tests/unit/FileObject.test.js
```

### Linting & Type Generation

```bash
# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Generate TypeScript definitions from JSDoc
npm run types:build
```

### Publishing & Updates

```bash
# Publish to npm
npm run submit

# Update dependencies
npm run update

# Create PR with Graphite (requires gt CLI)
npm run pr
```

## Architecture

### Core Utilities (`src/lib/`)

The toolkit provides three categories of utilities:

**File System Abstractions:**

- `FileObject` - Immutable file representation with metadata (path, parent, stats)
- `DirectoryObject` - Immutable directory representation with metadata
- `FS` - Static methods for file operations (glob, read/write JSON5/YAML/text)

**Error Handling:**

- `Sass` - Enhanced Error with trace management (stackable error contexts)
- `Tantrum` - AggregateError that auto-wraps errors in Sass instances

**Data & Validation:**

- `Data` - Type checking (`typeOf`, `isPlainObject`), deep operations (clone, merge, get/set nested paths)
- `TypeSpec` - Parse and validate complex type specifications (unions, arrays, custom types)
- `Valid` - Assertion utilities that throw Sass errors on validation failure
- `Collection` - Array/Object/Map/Set evaluation and transformation utilities

**Schemas & Contracts:**

- `Schemer` - JSON Schema validation using AJV with enhanced error reporting
- `Terms` - Interface definitions (what an action provides/accepts), supports file refs
- `Contract` - Negotiates compatibility between Terms with schema validation

**Utilities:**

- `Cache` - File system cache with mtime-based invalidation
- `Glog` - Enhanced logging (debug levels, colors, stack traces, VSCode integration)
- `Term` - Terminal output formatting
- `Util` - String manipulation, timing, hashing, promise utilities

### Key Design Patterns

**Immutability:** FileObject and DirectoryObject use sealed/frozen private metadata

**Error Context:** Sass errors support `.addTrace()` for building error context chains

**Factory Methods:** Most classes provide static `.new()` methods for fluent instantiation

**Type Safety:** Comprehensive TypeScript definitions generated from JSDoc via `types:build`

**Async-First:** File operations return Promises; Collection provides `asyncMap` for sequential processing

## Code Standards

### ESLint Configuration (eslint.config.js)

This project has **extremely specific** and **non-negotiable** style preferences:

- **No Prettier:** Code formatting is intentional and enforced by ESLint only
- **No spaces after control keywords:** `if(condition)` not `if (condition)`
- **No semicolons:** ASI (automatic semicolon insertion) is embraced
- **Arrow parens as-needed:** `c =>` not `(c) =>`
- **No internal object spacing:** `{key: value}` not `{ key: value }`
- **Mandatory blank lines:** After all control statements (`if`, `for`, `while`, etc.)
- **Brace style:** `1tbs` with `allowSingleLine: false` (braces always on separate lines)

### JSDoc Requirements

- All public functions **must** have descriptions
- `@param` and `@returns` required for function documentation
- Private methods marked with `@private`

### Important Developer Notes

**DO NOT suggest style changes.** ESLint handles all formatting. See `CODE_FORMATTING_RULES.md` and `.github/copilot-instructions.md` for context on why style suggestions are unwelcome.

Focus reviews on:

- Functional correctness and logic errors
- Security vulnerabilities
- Performance issues
- Modern JavaScript opportunities (`??`, `?.`, destructuring)

## Module System

- **Type:** ES6 modules (`"type": "module"`)
- **Node Version:** `>=22` (package.json specifies this)
- **Import Extensions:** Always use `.js` extensions, even for type definitions

## Testing

Tests use Node.js built-in test runner (`node:test`):

```javascript
import {describe, it, before, after, beforeEach} from 'node:test'
import assert from 'node:assert/strict'
```

**Test Structure:**

- Unit tests: `tests/unit/*.test.js`
- Fixtures: `tests/fixtures/` (JSON5, YAML files for testing)
- Helpers: `tests/helpers/` (shared test utilities)

**Fixture Files Include:**

- `settings.json` - Valid JSON for Cache/FileObject tests
- `palette.yaml` - Valid YAML for parsing tests
- `broken.json5` / `broken.yaml` - Invalid files for error handling tests

## Key Implementation Details

### FileObject & DirectoryObject

- Both accept either absolute paths or (path, parentDirectory) for relative resolution
- Metadata is computed once and frozen (immutable)
- File operations (read/write) support JSON5, YAML, and text
- `FileObject.loadData()` automatically detects format from extension

### Cache

- Uses modification time (mtime) to invalidate cached file data
- Eliminates redundant file reads during parallel processing
- Automatically cleans up stale entries when files change

### Contract System

- `Terms` defines interfaces (provider outputs / consumer inputs)
- `Contract.fromTerms()` creates single-party contracts with schema validation
- `new Contract(providerTerms, consumerTerms)` negotiates compatibility
- Validates that provider offers all required consumer capabilities with matching types

### Glog (Logger)

- Supports both static (global) and instance configurations
- Fluent API: `Glog.create().withName("App").withColors()`
- Color system using `@gesslar/colours` with tag-based formatting
- Debug levels 0-4 with distinct colors
- Optional stack trace extraction

### Sass & Tantrum Errors

- `Sass` wraps errors with trace context via `.addTrace(message)`
- `Tantrum` (AggregateError) auto-wraps plain errors in Sass
- Both provide `.report(nerdMode)` for formatted terminal output
- Traces are stored as arrays and prepended (LIFO)

## Dependencies

**Runtime:**

- `@gesslar/colours` - Color formatting for terminal output
- `ajv` - JSON Schema validation
- `globby` - File globbing
- `json5` - JSON5 parsing
- `yaml` - YAML parsing

**DevDependencies:**

- `@stylistic/eslint-plugin` - Style rules enforcement
- `eslint-plugin-jsdoc` - JSDoc validation
- `@typescript-eslint/*` - TypeScript ESLint support
- `@types/node` - Node.js type definitions

## Publishing

Package publishes to npm as `@gesslar/toolkit` with public access. Exports are configured in package.json:

```json
"exports": {
  ".": {
    "types": "./src/types/index.d.ts",
    "default": "./src/index.js"
  }
}
```

All utilities are re-exported from `src/index.js` for convenience.
