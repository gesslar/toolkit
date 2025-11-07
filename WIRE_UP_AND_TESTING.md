## 🎯 **When Adding New Methods/Classes**

### **Step 0: Project Baseline Checklist**

Before anyone (human or otherwise) starts wiring in features, verify the repo baseline:

1. **Verify ESLint is configured**:
   - This developer ALWAYS includes `eslint.config.js` in projects
   - If modifying code, run `npm run lint` before committing
   - Use `npm run lint:fix` to auto-fix style issues when available

2. **Check for type generation** (library projects only):
   - **If `tsconfig.types.json` exists**: The project generates TypeScript declarations
   - **If it exists**, ensure `package.json` has a `types:build` script
   - Run `npm run types:build` after modifying exports

3. **Identify the project structure**:
   - Look for main entry point (usually `src/index.js` or similar)
   - Check if there's a `src/lib/**` directory structure
   - Understand the export pattern (individual exports, bundles, both)

4. **Sanity check the available commands**:

   ```bash
   npm run lint          # ALWAYS present
   npm run lint:fix      # Usually present
   npm test              # Only if tests exist (not common)
   npm run types:build   # Only if generating declarations
   ```

**Note**: This developer does NOT prioritize testing. Only a couple projects (libraries) have test suites. Don't assume tests exist or need to be written.

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

### **Step 2: Wire Up Exports (If Library Project)**

**Skip this step if**: The project is an application or tool (not a library). Only library projects with a main entry point (like `src/index.js`) need export management.

#### **For Library Projects:**

**Check the export pattern** by examining the main entry point:

- **Individual exports only**: Simple list of exports
- **Semantic bundles**: Grouped exports under namespace objects (e.g., `FileSystem`, `ActionSystem`)
- **Both**: Mix of individual exports and semantic bundles

#### **Individual Export Pattern**

Add your new class to the exports:

```javascript
// src/index.js or main entry point
export { default as YourNewClass } from "./lib/YourNewClass.js"
// OR
export { YourNewClass } from "./lib/YourNewClass.js"
```

#### **Semantic Bundle Pattern** (If Project Uses This)

If the project uses semantic bundles (check for a `src/bundles/` directory):

1. **Add to existing bundle**:

```javascript
// src/bundles/YourDomainSystem.js
export {default as YourNewClass} from "../lib/YourNewClass.js"
```

2. **Or create new bundle** if it doesn't fit existing categories:

```javascript
// src/bundles/YourNewDomainSystem.js
/**
 * Your New Domain System Bundle
 *
 * Provides [domain description] including:
 * - YourClass: Brief description of what it does
 */

export {default as YourClass} from "../lib/YourClass.js"
```

Then add to main index:

```javascript
// Export the new bundle alongside others
export * as YourNewDomainSystem from "./bundles/YourNewDomainSystem.js"
```

**Naming Conventions** (adapt to project patterns):

- Match the existing style (PascalCase, camelCase, etc.)
- Stay consistent with surrounding code

### **Step 3: Update Type Definitions (If Generated)**

**Skip this step if**: Project doesn't have `tsconfig.types.json` or a `src/types/` directory.

**If the project generates TypeScript declarations** from JSDoc:

1. **Update JSDoc in your JS sources** whenever you add or modify classes, methods, or exports. Tighter annotations = better emitted `.d.ts`.

2. **Regenerate after changes**:

   ```bash
   npm run types:build
   ```

   This typically runs `tsc -p tsconfig.types.json` then `eslint --fix "src/types/**/*.d.ts"`

3. **Verify output** in `src/types/` - you should see `.d.ts` and `.d.ts.map` files

#### **JSDoc Best Practices** (Always Follow, Even Without Type Generation)

- ✅ **Always document public APIs** with JSDoc (enforced by eslint)
- ❌ Never use `Object` (capital O) → use `object` (enforced by eslint)
- ❌ Never use `Function` (capital F) → describe the function signature (enforced by eslint)
- ❌ Never use `any` or `*` → use `unknown` (developer preference, strongly enforced)
- ❌ Never use `[]` or `[]string` or `string[]` → use `Array<Type>` (developer hates antiquated syntax, strongly enforced)
  - **Note**: Gemini loves to use `[]string` syntax (Go-style). Don't. Use `Array<string>` instead.

```javascript
// ❌ BAD - will get rejected in code review
/** @param {any} data @param {Function} callback @returns {[]} */

// ✅ GOOD - follows all conventions
/** @param {unknown} data @param {(result: string) => void} callback @returns {Array<string>} */

// ❌ BAD - eslint WILL fail on these
/** @param {Object} config @param {Function} handler */

// ✅ GOOD - eslint will pass
/** @param {object} config @param {(data: unknown) => void} handler */
```

**Why these rules?**

1. Some enforced by eslint (`Object`, `Function` capitalized = error)
2. Others are developer's strong preferences (`any`, `*`, `[]` = code review rejection)
3. Keeps code self-documenting and helps IDEs
4. Makes type generation work better (if project uses it)

### **Step 4: Verify Integration**

After making changes:

1. **Run the linter** (ALWAYS):

   ```bash
   npm run lint
   ```

2. **If library project with exports**: Verify exports are accessible from the main entry point

3. **If type generation exists**: Confirm `.d.ts` files were regenerated correctly

4. **Test manually** if it's user-facing functionality

### **Step 5: Write Tests (If Project Has Tests)**

**Reality Check**: Most projects DON'T have tests. Check for:

- `tests/` or `test/` directory
- `npm test` script in package.json
- If neither exists, **skip testing** - this developer doesn't prioritize tests for most projects

**Testing Philosophy**: No fancy frameworks. No Jest, Mocha, Jasmine, or "Material Jaboogly Testing Frameworkbot 2005 XXL". This developer runs a **tight dependency ship with no cruft**.

**If tests exist** (library projects mainly), they use **Node's built-in test runner** (`node:test` module). That's it. No extra dependencies.

Create `tests/unit/YourNewClass.test.js`:

#### **Test Structure Template:**

```javascript
#!/usr/bin/env node

import { describe, it } from "node:test"
import assert from "node:assert/strict"

// Test both import styles
import { YourNewClass } from "../../src/index.js"
import { YourDomainSystem } from "../../src/index.js"

describe("YourNewClass", () => {
  describe("import compatibility", () => {
    it("works with individual import", () => {
      // Test individual class import
      const result = YourNewClass.methodName("input")
      assert.equal(result, "expected")
    })

    it("works with semantic bundle import", () => {
      // Test semantic bundle import
      const {YourNewClass: BundledClass} = YourDomainSystem
      const result = BundledClass.methodName("input")
      assert.equal(result, "expected")
    })

    it("both import styles reference same class", () => {
      // Verify they're the same constructor
      assert.equal(YourNewClass, YourDomainSystem.YourNewClass)
    })
  })

  describe("methodName()", () => {
    it("handles normal cases", () => {
      // Test the happy path
      const result = YourNewClass.methodName("input")
      assert.equal(result, "expected")
    })

    it("handles edge cases", () => {
      // Test the weird stuff
      assert.equal(YourNewClass.methodName(""), "")
      assert.equal(YourNewClass.methodName(null), null)
      // etc.
    })

    it("validates input types", () => {
      // Test type handling
      assert.throws(() => YourNewClass.methodName(123))
      // OR test graceful coercion
      assert.equal(YourNewClass.methodName(123), "123")
    })

    it("throws appropriate errors", () => {
      // Test error conditions
      await assert.rejects(
        () => YourNewClass.asyncMethod("bad input"),
        /expected error message/
      )
    })
  })

  describe("error scenarios", () => {
    // Test failure modes, async rejections, etc.
  })

  describe("performance and edge cases", () => {
    // Test boundary conditions, large inputs, etc.
  })
})
```

#### **Testing Best Practices:**

1. **🎯 Test the Implementation, Not Just the Interface**
   - Don't just test that it works, test that it **handles edge cases**
   - Look for the "what if" scenarios that will break in production

2. **🚨 Edge Cases Are Your Friend**

   ```javascript
   // Test ALL of these:
   YourMethod(null)
   YourMethod(undefined)
   YourMethod("")
   YourMethod([])
   YourMethod({})
   YourMethod(0)
   YourMethod(-1)
   YourMethod("   ")  // whitespace
   ```

3. **🔄 Test Error Handling**

   ```javascript
   // If it can throw, test the throw
   await assert.rejects(() => method("bad"), ExpectedErrorType)

   // If it uses Sass, test the trace
   assert.equal(error.trace.length, 2)
   assert.match(error.trace[0], /expected context/)
   ```

4. **📊 Test Real-World Usage**

   ```javascript
   it("supports typical use cases", () => {
     // Test how people will actually use it
   })
   ```

5. **🧪 Use Descriptive Test Names**

   ```javascript
   // ❌ Bad
   it("works", () => {})

   // ✅ Good
   it("returns empty string when input is null", () => {})
   ```

---

## 🏃‍♂️ **Testing Workflow (If Tests Exist)**

1. **Implement your feature** (TDD optional, not enforced)
2. **Run your specific test**: `node tests/unit/YourClass.test.js`
3. **Run all tests**: `npm test` - check you didn't break anything
4. **Run the linter**: `npm run lint` (ALWAYS required)
5. **Fix any lint issues**: `npm run lint:fix`

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

**Note**: Only relevant if the project uses semantic bundles (check for `src/bundles/` directory)

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
