## 🎯 **When Adding New Methods/Classes**

### **Step 0: Project Snapshot (current state)**

- Library shipped as ESM with dual entry points:
  - `src/index.js` (default/Node build, also exports browser-safe utilities)
  - `src/browser/index.js` (browser/Tauri-safe utilities only)
- `package.json` exports map already publishes `@gesslar/toolkit`, `@gesslar/toolkit/browser`, and `@gesslar/toolkit/node`
- Tooling commands (run these whenever you touch code):

  ```bash
  npm run lint            # ESLint + JSDoc rules
  npm run lint:fix        # Auto-fix style issues
  npm test                # node:test suite in tests/browser + tests/node
  npm run types:build     # Regenerates src/types/*
  ```

- Node >= 20 required; repo is `type: "module"`

### **Step 1: Validate the Logic Thoroughly**

Before you write a single test, **audit your implementation**:

- ✅ **Edge Cases**: What happens with `null`, `undefined`, empty arrays, zero values?
- ✅ **Type Coercion**: Does your method handle non-expected types gracefully?
- ✅ **Error Boundaries**: Where can this blow up? Handle it or document it.
- ✅ **Performance**: Any obvious bottlenecks or inefficiencies?
- ✅ **Pattern Consistency**: Does it match the existing codebase's patterns, naming conventions, and style?

**🚨 CRITICAL**: Look for patterns like:

- Destructuring from `null` (use `[]` instead)
- Silent type failures (decide: throw or coerce?)
- Missing validation on user inputs
- Async operations without proper error handling

### **Step 2: Wire Up Exports**

This repo is a library—every new module/class must be exported correctly.

- **Browser-safe utilities** (pure JS, no `fs/path/process` access):
  - Export from `src/browser/lib/Foo.js`
  - Add to `src/browser/index.js`
  - Also export from `src/index.js` so Node users get the same API

- **Node-only utilities** (use filesystem, terminal, crypto, etc.):
  - Implement in `src/lib/Foo.js`
  - Export from `src/index.js` **only** (do NOT add to the browser index)

- **Keep exports map coherent**: default export pattern is `export {default as Foo} from "./lib/Foo.js"`. Make sure the class/file name matches the rest of the tree.

- **Update README.md**: Add the new class to the appropriate table (Browser or Node.js) with an accurate description based on the class's JSDoc.

### **Step 3: Update Type Definitions**

Type declarations are generated from the JSDoc in `src/**`:

1. Add/adjust JSDoc on any public API you touch.
2. Regenerate: `npm run types:build`
3. Check `src/types/index.d.ts` and `src/types/lib/*.d.ts` picked up new exports.

JSDoc expectations:

- Use `object`, `unknown`, `Array<Type>` (avoid `Object`, `Function`, or `any`)
- Prefer explicit function signatures in params/returns
- Keep docstrings concise but present on public APIs (eslint enforces)

### **Step 4: Verify Integration**

After code changes:

1. `npm run lint`
2. `npm run types:build` (when exports or JSDoc change)
3. `npm test` (runs both browser and node suites)
4. Verify README.md lists the class with accurate description
5. For browser-safe additions, sanity check both `@gesslar/toolkit` and `@gesslar/toolkit/browser` imports resolve to the same implementation.

### **Step 5: Tests (required for this repo)**

There is a real test suite. It uses the built-in `node:test` runner and lives in `tests/browser` (browser-safe API) and `tests/node` (Node-only API).

- **Run everything**: `npm test`
- **Targeted runs**: `npm test -- tests/browser/Valid.test.js`
- **Helpers**: `tests/helpers/test-utils.js` provides fixture helpers and cleanup.

#### **Test Template**

```javascript
#!/usr/bin/env node

import assert from "node:assert/strict"
import {before,after,describe,it} from "node:test"

// Prefer package-style imports to verify exports wiring
import {YourClass} from "@gesslar/toolkit" // or "@gesslar/toolkit/browser"

describe("YourClass", () => {
  before(() => {
    // setup if needed
  })

  after(() => {
    // cleanup
  })

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

Focus tests on:

- Edge cases (`null`, `undefined`, empty strings/arrays/objects, negatives)
- Error surfaces (message + error type)
- Import compatibility (`@gesslar/toolkit` vs `/browser` where relevant)
- Real-world usage paths

---

## 🚨 **Common Code Issues to Avoid**

Regardless of whether you write tests, watch for:

- **Destructuring from `null`** → Use `[]` or `{}` as fallback
- **Silent type failures** → Decide: throw or coerce? Be explicit
- **Missing validation** on user inputs
- **Regex edge cases** → Handle malformed inputs
- **Async operations** without proper error handling
- **File path issues** → Use `path.join()` for cross-platform compatibility

---

## 🎯 **Code Quality Standards**

Every change should:

- ✅ **Pass eslint** (ALWAYS enforced)
- ✅ **Handle edge cases** (null, undefined, empty arrays, etc.)
- ✅ **Include JSDoc** for public APIs
- ✅ **Match existing patterns** in the codebase
- ✅ **Be readable** by future contributors

---

## 📦 **For Library Projects: Semantic Bundle Pattern**

*The toolkit does not use bundles today; this is here only if we ever add a `src/bundles/` directory.*

Semantic bundles group related exports under namespace objects:

```javascript
// Individual imports
import {ClassA, ClassB, ClassC} from "@username/library"

// VS semantic bundle
import {DomainSystem} from "@username/library"
const instanceA = new DomainSystem.ClassA()
const instanceB = new DomainSystem.ClassB()
```

**When to use bundles:**

- 📦 Multiple related classes from same domain
- 🎯 One or two specific classes? Use individual imports
- 🔀 Mix both styles as needed

---

*Remember: Lint always, test if the project has them, document with JSDoc, and match existing patterns.* ✨
