# ACTUAL_TESTING.md

## The Real Deal: How to Actually Test This Toolkit

*Unlike TESTING.txt (which is fucking gold and stays), this is your practical guide for adding new stuff without breaking everything.*

---

## 🎯 **When Adding New Methods/Classes**

### **Step 1: Validate the Logic Thoroughly**

Before you write a single test, **audit your implementation**:

- ✅ **Edge Cases**: What happens with `null`, `undefined`, empty arrays, zero values?
- ✅ **Type Coercion**: Does your method handle non-expected types gracefully?
- ✅ **Error Boundaries**: Where can this blow up? Handle it or document it.
- ✅ **Performance**: Any obvious bottlenecks or inefficiencies?
- ✅ **API Consistency**: Does it match the existing toolkit's patterns and voice?

**🚨 CRITICAL**: Look for patterns like:

- Destructuring from `null` (use `[]` instead)
- Silent type failures (decide: throw or coerce?)
- Missing validation on user inputs
- Async operations without proper error handling

### **Step 2: Wire Up the Class to `index.js`**

#### **Individual Export (Required)**

Add your new class to the individual exports section:

```javascript
// src/index.js
export { default as YourNewClass } from "./lib/YourNewClass.js"
```

#### **Semantic Bundle Export (Recommended)**

Add your class to the appropriate semantic bundle in `/src/bundles/`:

```javascript
// src/bundles/YourDomainSystem.js
export {default as YourNewClass} from "../lib/YourNewClass.js"
```

**Available Semantic Bundles:**

- 📁 **`FileSystem`** - File and directory operations (FileObject, DirectoryObject, FS)
- ⚡ **`ActionSystem`** - Action orchestration framework (Action, ActionBuilder, ActionRunner, Hooks, Piper)
- 📊 **`DataSystem`** - Data manipulation and validation (Data, Valid, Collection, Cache, Type)
- 🚨 **`ErrorSystem`** - Error handling and reporting (Sass, Tantrum)
- 📋 **`ContractSystem`** - Contract negotiation and schema validation (Contract, Terms, Schemer)
- 🖥️ **`LoggingSystem`** - Logging and terminal utilities (Glog, Term, Util)

**Create New Bundle if Needed:**

If your class doesn't fit existing bundles, create a new semantic bundle:

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

Then add to main index.js:

```javascript
// Export the new bundle alongside others
export * as YourNewDomainSystem from "./bundles/YourNewDomainSystem.js"
```

**Naming Convention**:

- Classes: `PascalCase` (FileObject, Sass, Glog)
- Utilities: `PascalCase` (Util, Data, FS)
- Bundles: `PascalCase` + "System" (ActionSystem, FileSystem)
- Keep it consistent with existing patterns

### **Step 3: Create/Update TypeScript Definitions**

#### **If `.d.ts` doesn't exist for your class:**

Create `src/types/YourNewClass.d.ts`:

```typescript
// Implementation: ../lib/YourNewClass.js

/**
 * Brief description of what this class does.
 * Include usage examples and key behaviors.
 */
declare class YourNewClass {
  /**
   * Document every public method thoroughly.
   *
   * @param param - Describe what this accepts
   * @returns What this returns and when
   *
   * @example
   * ```typescript
   * const result = YourNewClass.method("input")
   * console.log(result) // "Expected output"
   * ```
   */
  static method(param: string): string
}

export default YourNewClass
```

#### **If `.d.ts` already exists:**

Add your new methods with **full documentation**:

- Parameter types and descriptions
- Return types and behaviors
- Usage examples
- Edge case behaviors

### **Step 4: Wire Up Re-export in `index.d.ts`**

Add to the main type definitions:

```typescript
// src/types/index.d.ts
export { default as YourNewClass } from './YourNewClass'
```

### **Step 5: Write Comprehensive Tests**

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

## 🎨 **Toolkit-Specific Testing Patterns**

### **For Classes with Sass Integration:**

```javascript
// Test that Sass errors preserve context
try {
  await YourClass.method("bad input")
  assert.fail("Should have thrown")
} catch (error) {
  assert.ok(error instanceof Sass)
  assert.equal(error.message, "original error")
  assert.match(error.trace[0], /your context/)
}
```

### **For Async Methods:**

```javascript
// Test timing if performance matters
const {result, cost} = await Util.time(async () => {
  return await YourClass.slowMethod()
})
assert.ok(cost < 100) // Or whatever makes sense
```

### **For File System Operations:**

```javascript
// Use test fixtures, not real files
const fixturePath = TestUtils.getFixturePath("test.json")
// Test with copies if you modify files
```

---

## 🏃‍♂️ **Testing Workflow**

1. **Write the failing test first** (TDD if you're into that)
2. **Implement to make it pass**
3. **Run your specific test**: `node tests/unit/YourClass.test.js`
4. **Run all tests**: Check you didn't break anything
5. **Run the linter**: `npm run lint` (fix issues)
6. **Update documentation** if needed

---

## 🚨 **Red Flags to Test For**

Based on issues found in this toolkit:

- **Destructuring from `null`** → Use `[]` instead
- **Silent type coercion** → Document or validate
- **Missing error context** → Ensure Sass traces are meaningful
- **Regex edge cases** → Test malformed inputs
- **Async error wrapping** → Test double-wrapping scenarios
- **File path resolution** → Test relative/absolute path edge cases

---

## 🎯 **Quality Standards**

Your tests should:

- ✅ **Cover edge cases** that real users will hit
- ✅ **Validate error scenarios** thoroughly
- ✅ **Match the toolkit's personality** (use the same patterns)
- ✅ **Be readable** by future humans and robots
- ✅ **Actually catch bugs** (not just test happy paths)

Remember: **Good tests are like good sass - they catch problems early and give you attitude when something's wrong.** 😏

---

---

## 🎨 **Semantic Bundle Usage Examples**

### **Import Patterns Available to Users:**

```javascript
// ==========================================
// SEMANTIC BUNDLES - Clean domain imports
// ==========================================

// Get everything for file operations
import {FileSystem} from "@gesslar/toolkit"
const file = new FileSystem.FileObject("data.json")
const dir = new FileSystem.DirectoryObject("./src")
const files = await FileSystem.FS.getFiles("*.js")

// Get complete action system
import {ActionSystem} from "@gesslar/toolkit"
class MyAction extends ActionSystem.Action { /* ... */ }
const builder = new ActionSystem.ActionBuilder(action)
const piper = new ActionSystem.Piper()

// Get data manipulation tools
import {DataSystem} from "@gesslar/toolkit"
DataSystem.Valid.assert(condition, "message")
const type = DataSystem.Data.typeOf(value)
const results = DataSystem.Collection.asyncMap(items, processor)

// ==========================================
// GRANULAR IMPORTS - Individual classes
// ==========================================

// Traditional approach still works
import {FileObject, Action, Data, Sass} from "@gesslar/toolkit"

// ==========================================
// MIX AND MATCH - Best of both worlds
// ==========================================

// Use bundles for groups, individuals for specifics
import {ActionSystem, Sass} from "@gesslar/toolkit"
```

### **When to Use Which Import Style:**

- 📦 **Semantic Bundles**: When you need multiple related classes from the same domain
- 🎯 **Individual Imports**: When you only need one or two specific classes
- 🔀 **Mixed**: When you need a bundle plus some individual classes from other domains

---

*Now go forth and test with confidence! And remember - TESTING.txt is still fucking gold.* ✨
