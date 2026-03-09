# GitHub Copilot Instructions

This file provides guidance to GitHub Copilot when working with code in this repository.

## Project Overview

`@gesslar/toolkit` is a comprehensive utility library for Node.js and browser environments. It provides consistent patterns and abstractions across projects. This is a personal project with strong opinions on code style, all enforced through ESLint.

### Dual-Target Architecture

The library ships two separate entry points:

- **Node.js** (`src/node/`): Full toolkit including file system, logging, and terminal utilities
- **Browser** (`src/browser/`): Browser-safe utilities only (no `fs`, `path`, or `process`)

Package exports:

- `@gesslar/toolkit` / `@gesslar/toolkit/node` → `src/node/index.js`
- `@gesslar/toolkit/browser` → `src/browser/index.js`

## Development Commands

```bash
# Run all tests
npm test

# Run only Node.js tests
npm run test:node

# Run only browser tests
npm run test:browser

# Lint source code
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Regenerate TypeScript definitions
npm run types
```

## Architecture

### Node.js Utilities (`src/node/lib/`)

**File System:**

- `FileObject` — Immutable file representation with metadata (path, parent, stats)
- `DirectoryObject` — Immutable directory representation
- `FileSystem` — Static methods for file operations (glob, read/write JSON5/YAML/text)

**Error Handling:**

- `Sass` — Enhanced Error with stackable trace context via `.addTrace(message)`
- `Tantrum` — AggregateError that auto-wraps plain errors in Sass instances

**Data & Validation:**

- `Data` — Type checking (`typeOf`, `isPlainObject`), deep operations (clone, merge, nested get/set)
- `TypeSpec` — Parse and validate complex type specifications (unions, arrays, custom types)
- `Valid` — Assertion utilities that throw Sass errors on validation failure
- `Collection` — Array/Object/Map/Set evaluation and transformation utilities

**Utilities:**

- `Cache` — File system cache with mtime-based invalidation
- `Glog` / `Logger` — Enhanced logging with debug levels, colors, and VSCode integration
- `Term` — Terminal output formatting
- `Util` — String manipulation, timing, hashing, and promise utilities

### Browser Utilities (`src/browser/lib/`)

Shared with Node.js: `Collection`, `Data`, `Sass`, `Tantrum`, `TypeSpec`, `Util`, `Valid`

Browser-only: `HTML`, `Notify`, `OObject`, `Promised`, `Time`, `Disposer`

### Key Design Patterns

- **Immutability** — `FileObject` and `DirectoryObject` use sealed/frozen metadata
- **Error context** — `Sass` supports `.addTrace()` for building error context chains
- **Factory methods** — Most classes provide static `.new()` for fluent instantiation
- **Async-first** — File operations return Promises; `Collection` provides `asyncMap`

## Code Standards

### ESLint Configuration

This project has **extremely specific and non-negotiable** style preferences. **Do NOT suggest style changes — ESLint enforces everything.**

- **No Prettier** — ESLint handles all formatting
- **No semicolons** — ASI is embraced
- **No spaces after control keywords** — `if(condition)` not `if (condition)`
- **Arrow parens as-needed** — `c =>` not `(c) =>`
- **No internal object spacing** — `{key: value}` not `{ key: value }`
- **Mandatory blank lines** after all control statements (`if`, `for`, `while`, etc.)
- **Brace style** — `1tbs` with `allowSingleLine: false` (braces always on separate lines)

### JSDoc Requirements

- All public functions **must** have descriptions
- `@param` and `@returns` required for public APIs
- Private methods marked with `@private`
- Use `object`, `unknown`, `Array<Type>` — avoid `Object`, `Function`, or `any`

### Module System

- ES6 modules (`"type": "module"`)
- Node.js `>=24.13.0` required
- Always use `.js` extensions in imports

## Testing

Tests use Node.js built-in `node:test` runner:

```javascript
import assert from "node:assert/strict"
import {before, after, describe, it} from "node:test"

// Use package-style imports to verify export wiring
import {YourClass} from "@gesslar/toolkit"

describe("YourClass", () => {
  describe("methodName", () => {
    it("handles the happy path", () => {
      assert.equal(YourClass.methodName("input"), "expected")
    })

    it("guards against bad input", () => {
      assert.throws(() => YourClass.methodName(123), /expected/i)
    })
  })
})
```

**Test locations:**

- `tests/node/*.test.js` — Node.js-specific tests
- `tests/browser/*.test.js` — Browser utility tests (use happy-dom)
- `tests/helpers/` — Shared utilities and browser environment setup

**Browser tests** require happy-dom setup:

```javascript
import {setupBrowserEnvironment, cleanupBrowserEnvironment} from "../helpers/browser-env.js"

describe("BrowserClass", () => {
  let cleanup
  before(() => { cleanup = setupBrowserEnvironment() })
  after(() => { cleanupBrowserEnvironment(cleanup) })
  // ...
})
```

Only add browser environment setup to tests that actually use DOM or browser globals.

## Adding New Utilities

### Step 1: Implement the module

- **Browser-safe** (pure JS, no Node.js APIs): Add to `src/browser/lib/` and export from `src/browser/index.js`. Also export from `src/node/index.js` so Node users get the same API.
- **Node-only** (uses `fs`, `path`, `process`, etc.): Add to `src/node/lib/` and export from `src/node/index.js` only.

### Step 2: Wire up exports

```javascript
// In the appropriate index.js:
export {default as Foo} from "./lib/Foo.js"
```

### Step 3: Update TypeScript definitions

```bash
npm run types
```

Check that `types/node/index.d.ts` and `types/browser/index.d.ts` picked up the new exports.

### Step 4: Verify

```bash
npm run lint
npm test
```

### Step 5: Update README.md

Add the new class to the appropriate table (Browser or Node.js) with a description based on its JSDoc.

## Common Pitfalls to Avoid

- **Destructuring from `null`** — use `[]` or `{}` as fallback
- **Silent type failures** — decide explicitly: throw or coerce
- **Missing input validation** on user-facing APIs
- **Async operations** without proper error handling
- **File path construction** — use `path.join()` for cross-platform compatibility

## Code Review Focus

### ✅ Review For

- **Actual bugs and logic errors** that could cause runtime failures
- **Security vulnerabilities** and potential exploits
- **Performance issues** that could impact application behavior
- **Modern JavaScript opportunities** where verbose patterns can be simplified using `??`, `?.`, destructuring
- **Missing error handling** that could cause actual problems

### ❌ Do Not Review

- **Code style and formatting** — ESLint handles this completely
- **JSDoc completeness** — intentionally managed by the developer
- **Theoretical edge cases** — focus on realistic scenarios
- **Enterprise-style suggestions** about comment tone or verbosity

### Context Awareness

Before flagging issues:

1. **Trace the call chain** — check if validation/guards exist elsewhere in the pipeline
2. **Consider the broader codebase** — look at how similar patterns are handled
3. **Verify actual risk** — avoid "this could result in..." warnings for well-guarded code

### Modern JavaScript Patterns

Prefer:

- `value?.property` over `value && value.property`
- `value ?? defaultValue` over null-check ternaries
- Destructuring over repeated property access
- Template literals over string concatenation
- Array methods over manual loops where appropriate

## Key Rule

**Trust the existing tooling and focus on code that could actually break or be improved functionally.** If ESLint allows it and tests pass, style is not a concern.
