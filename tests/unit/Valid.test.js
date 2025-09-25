import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { Valid, Sass } from "../../src/index.js"

describe("Valid", () => {
  describe("assert", () => {
    it("passes when condition is true", () => {
      // Should not throw
      Valid.assert(true, "This should pass")
      Valid.assert(1 === 1, "Math works")
      Valid.assert("hello".length > 0, "String has length")
    })

    it("throws Sass error when condition is false", () => {
      assert.throws(() => {
        Valid.assert(false, "Test failure")
      }, (error) => {
        return error instanceof Sass && error.message === "Test failure"
      })
    })

    it("includes arg in error message when provided", () => {
      assert.throws(() => {
        Valid.assert(false, "Failed with code", 404)
      }, (error) => {
        return error instanceof Sass && error.message === "Failed with code: 404"
      })
    })

    it("works without arg parameter", () => {
      assert.throws(() => {
        Valid.assert(false, "Simple failure")
      }, (error) => {
        return error instanceof Sass && error.message === "Simple failure"
      })
    })

    it("validates condition parameter type", () => {
      assert.throws(() => {
        Valid.assert("not boolean", "message")
      }, /Condition must be a boolean/)

      assert.throws(() => {
        Valid.assert(123, "message") 
      }, /Condition must be a boolean/)

      assert.throws(() => {
        Valid.assert(null, "message")
      }, /Condition must be a boolean/)
    })

    it("validates message parameter type", () => {
      assert.throws(() => {
        Valid.assert(true, 123)
      }, /Message must be a string/)

      assert.throws(() => {
        Valid.assert(true, null)
      }, /Message must be a string/)

      assert.throws(() => {
        Valid.assert(true, {})
      }, /Message must be a string/)
    })

    it("validates arg parameter type when provided", () => {
      assert.throws(() => {
        Valid.assert(true, "message", "not a number")
      }, /Arg must be a number/)

      assert.throws(() => {
        Valid.assert(true, "message", {})
      }, /Arg must be a number/)

      // null and undefined should be allowed
      Valid.assert(true, "message", null) // Should not throw
      Valid.assert(true, "message", undefined) // Should not throw
    })
  })

  describe("validType", () => {
    it("passes for valid basic types", () => {
      // These should not throw
      Valid.validType("hello", "string")
      Valid.validType(123, "number")
      Valid.validType(true, "boolean")
      Valid.validType([], "array")
      Valid.validType({}, "object")
      Valid.validType(() => {}, "function")
    })

    it("throws Sass error for invalid types", () => {
      assert.throws(() => {
        Valid.validType(123, "string")
      }, (error) => {
        return error instanceof Sass && 
               error.message.includes("Invalid type") &&
               error.message.includes("Expected string")
      })

      assert.throws(() => {
        Valid.validType("hello", "number") 
      }, (error) => {
        return error instanceof Sass && 
               error.message.includes("Invalid type") &&
               error.message.includes("Expected number")
      })
    })

    it("works with type specifications", () => {
      // Array types
      Valid.validType([1, 2, 3], "number[]") // Should not throw
      Valid.validType(["a", "b"], "string[]") // Should not throw

      assert.throws(() => {
        Valid.validType([1, "mixed"], "number[]")
      }, Sass)
    })

    it("works with union types", () => {
      Valid.validType("hello", "string|number") // Should not throw
      Valid.validType(123, "string|number") // Should not throw

      assert.throws(() => {
        Valid.validType(true, "string|number")
      }, Sass)
    })

    it("passes options to underlying type checking", () => {
      // Test with allowEmpty option
      Valid.validType("", "string", { allowEmpty: true }) // Should not throw
      
      assert.throws(() => {
        Valid.validType("", "string", { allowEmpty: false })
      }, Sass)
    })

    it("provides detailed error messages", () => {
      assert.throws(() => {
        Valid.validType([1, "mixed"], "number[]")
      }, (error) => {
        return error instanceof Sass && 
               error.message.includes("Invalid type") &&
               error.message.includes("Expected number[]")
      })
    })
  })

  describe("edge cases", () => {
    it("handles null and undefined in assert", () => {
      Valid.assert(true, "message", null)
      Valid.assert(true, "message", undefined)
      
      assert.throws(() => {
        Valid.assert(false, "message", null)
      }, (error) => {
        return error instanceof Sass && error.message === "message"
      })
    })

    it("handles complex validation scenarios", () => {
      const complexObject = {
        name: "test",
        values: [1, 2, 3],
        nested: {
          flag: true
        }
      }

      Valid.validType(complexObject, "object") // Should not throw
      Valid.validType(complexObject.values, "number[]") // Should not throw
      Valid.validType(complexObject.nested.flag, "boolean") // Should not throw
    })
  })
})