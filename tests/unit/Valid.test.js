import assert from "node:assert/strict"
import {describe,it} from "node:test"

import {Sass,Valid} from "../../src/index.js"

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

  describe("type", () => {
    it("passes for valid basic types", () => {
      // These should not throw
      Valid.type("hello", "String")
      Valid.type(123, "Number")
      Valid.type(true, "Boolean")
      Valid.type([], "Array")
      Valid.type({}, "Object")
      Valid.type(() => {}, "Function")
    })

    it("throws Sass error for invalid types", () => {
      assert.throws(() => {
        Valid.type(123, "String")
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("Invalid type") &&
               error.message.includes("Expected String")
      })

      assert.throws(() => {
        Valid.type("hello", "Number")
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("Invalid type") &&
               error.message.includes("Expected Number")
      })
    })

    it("works with type specifications", () => {
      // Array types
      Valid.type([1, 2, 3], "Number[]") // Should not throw
      Valid.type(["a", "b"], "String[]") // Should not throw

      assert.throws(() => {
        Valid.type([1, "mixed"], "Number[]")
      }, Sass)
    })

    it("works with union types", () => {
      Valid.type("hello", "String|Number") // Should not throw
      Valid.type(123, "String|Number") // Should not throw

      assert.throws(() => {
        Valid.type(true, "String|Number")
      }, Sass)
    })

    it("passes options to underlying type checking", () => {
      // Test with allowEmpty option
      Valid.type("", "String", { allowEmpty: true }) // Should not throw

      assert.throws(() => {
        Valid.type("", "String", { allowEmpty: false })
      }, Sass)
    })

    it("provides detailed error messages", () => {
      assert.throws(() => {
        Valid.type([1, "mixed"], "Number[]")
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("Invalid type") &&
               error.message.includes("Expected Number[]")
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

      Valid.type(complexObject, "Object") // Should not throw
      Valid.type(complexObject.values, "Number[]") // Should not throw
      Valid.type(complexObject.nested.flag, "Boolean") // Should not throw
    })
  })
})
