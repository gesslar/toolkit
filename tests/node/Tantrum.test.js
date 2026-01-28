import assert from "node:assert/strict"
import {describe, it} from "node:test"
import {stripVTControlCharacters} from "node:util"

import {Sass, Tantrum} from "../../src/node/index.js"

// Helper for intercepting console output
/**
 * Captures console output for testing purposes
 * @param {string|string[]} methods - Console method(s) to capture
 * @param {() => void} fn - Function to execute while capturing
 * @returns {string} Captured console output
 */
function captureConsole(methods, fn) {
  const methodList = Array.isArray(methods) ? methods : [methods]
  const originals = {}
  const calls = []

  methodList.forEach(method => {
    originals[method] = console[method]
    console[method] = (...args) => {
      if(args.length > 0)
        calls.push(args.join(" "))
    }
  })

  try {
    fn()
  } finally {
    methodList.forEach(method => {
      console[method] = originals[method]
    })
  }

  return stripVTControlCharacters(calls.join("\n"))
}

describe("Tantrum", () => {
  describe("constructor", () => {
    it("creates a Tantrum with message and empty errors array", () => {
      const tantrum = new Tantrum("Multiple failures")

      assert.ok(tantrum instanceof AggregateError)
      assert.ok(tantrum instanceof Tantrum)
      assert.equal(tantrum.message, "Multiple failures")
      assert.equal(tantrum.name, "Tantrum")
      assert.deepEqual(tantrum.errors, [])
    })

    it("auto-wraps plain Error objects in Sass instances", () => {
      const plainError1 = new Error("Plain error 1")
      const plainError2 = new Error("Plain error 2")
      const tantrum = new Tantrum("Batch failed", [plainError1, plainError2])

      assert.equal(tantrum.errors.length, 2)
      assert.ok(tantrum.errors[0] instanceof Sass)
      assert.ok(tantrum.errors[1] instanceof Sass)
      assert.equal(tantrum.errors[0].message, "Plain error 1")
      assert.equal(tantrum.errors[1].message, "Plain error 2")
      assert.equal(tantrum.errors[0].cause, plainError1)
      assert.equal(tantrum.errors[1].cause, plainError2)
    })

    it("preserves existing Sass instances without rewrapping", () => {
      const sassError = Sass.new("Already sassy").addTrace("Some context")
      const plainError = new Error("Plain jane")
      const tantrum = new Tantrum("Mixed bag", [sassError, plainError])

      assert.equal(tantrum.errors.length, 2)
      assert.strictEqual(tantrum.errors[0], sassError) // Same instance
      assert.ok(tantrum.errors[1] instanceof Sass) // Wrapped
      assert.notStrictEqual(tantrum.errors[1], plainError) // Different instance
      assert.equal(tantrum.errors[1].cause, plainError) // But preserves cause
    })

    it("handles empty errors array", () => {
      const tantrum = new Tantrum("No errors yet", [])

      assert.deepEqual(tantrum.errors, [])
      assert.equal(tantrum.message, "No errors yet")
    })

    it("handles undefined errors parameter", () => {
      const tantrum = new Tantrum("No errors parameter")

      assert.deepEqual(tantrum.errors, [])
      assert.equal(tantrum.message, "No errors parameter")
    })
  })

  describe("new() factory method", () => {
    it("creates a new Tantrum instance", () => {
      const error1 = new Error("First")
      const error2 = Sass.new("Second")
      const tantrum = Tantrum.new("Factory created", [error1, error2])

      assert.ok(tantrum instanceof Tantrum)
      assert.equal(tantrum.message, "Factory created")
      assert.equal(tantrum.errors.length, 2)
      assert.ok(tantrum.errors[0] instanceof Sass) // Wrapped
      assert.strictEqual(tantrum.errors[1], error2) // Preserved
    })

    it("works with empty errors array", () => {
      const tantrum = Tantrum.new("Empty factory", [])

      assert.ok(tantrum instanceof Tantrum)
      assert.deepEqual(tantrum.errors, [])
    })
    it("works with no errors parameter", () => {
      const tantrum = Tantrum.new("No errors")

      assert.ok(tantrum instanceof Tantrum)
      assert.deepEqual(tantrum.errors, [])
      })
    })

  describe("report()", () => {
    it("reports header with error count and delegates to individual Sass instances", () => {
      const error1 = new Error("Thing 1 broke")
      const error2 = new Error("Thing 2 exploded")
      const tantrum = Tantrum.new("Multiple things went wrong", [error1, error2])

      const output = captureConsole(["error", "group", "groupEnd"], () => {
        tantrum.report()
      })

      // Should include the tantrum header
      assert.match(output, /\[Tantrum Incoming\]/)
      assert.match(output, /x2/)
      assert.match(output, /Multiple things went wrong/)

      // Should include output from individual Sass reports
      assert.match(output, /\[Something Went Wrong\]/)
      assert.match(output, /Thing 1 broke/)
      assert.match(output, /Thing 2 exploded/)
    })

    it("reports with nerd mode enabled", () => {
      const plainError = new Error("Plain error with stack")
      const tantrum = Tantrum.new("Nerd mode test", [plainError])

      const output = captureConsole(["error", "group", "groupEnd"], () => {
        tantrum.report(true)
      })

      // Should include tantrum header
      assert.match(output, /\[Tantrum Incoming\]/)

      // Should include nerd mode output from Sass
      assert.match(output, /\[Nerd Victuals\]/)
    })

    it("handles empty errors array gracefully", () => {
      const tantrum = Tantrum.new("No errors to report")

      const output = captureConsole(["error", "group", "groupEnd"], () => {
        tantrum.report()
      })

      assert.match(output, /\[Tantrum Incoming\]/)
      assert.match(output, /x0/)
      assert.match(output, /No errors to report/)
    })

    it("preserves Sass trace information in reports", () => {
      const sassError = Sass.new("Deep error").addTrace("Middle layer").addTrace("Top layer")
      const tantrum = Tantrum.new("Trace preservation test", [sassError])

      const output = captureConsole(["error", "group", "groupEnd"], () => {
        tantrum.report()
      })

      // Should include all trace levels
      assert.match(output, /Top layer/)
      assert.match(output, /Middle layer/)
      assert.match(output, /Deep error/)
    })
  })

  describe("error handling edge cases", () => {
    it("throws TypeError for null errors", () => {
      assert.throws(() => {
        new Tantrum("Test", [null])
      }, TypeError, /All items in errors array must be Error instances/)
    })

    it("throws TypeError for undefined errors", () => {
      assert.throws(() => {
        new Tantrum("Test", [undefined])
      }, TypeError, /All items in errors array must be Error instances/)
    })

    it("throws TypeError for non-Error objects", () => {
      assert.throws(() => {
        new Tantrum("Test", ["not an error"])
      }, TypeError, /All items in errors array must be Error instances/)
    })
  })

  describe("real-world usage scenarios", () => {
    it("supports typical validation failure scenario", () => {
      const validationErrors = [
        new Error("Name is required"),
        new Error("Email is invalid"),
        Sass.new("Age must be positive").addTrace("User input validation")
      ]

      const tantrum = Tantrum.new("User input validation failed", validationErrors)

      assert.equal(tantrum.errors.length, 3)
      assert.ok(tantrum.errors.every(err => err instanceof Sass))

      const output = captureConsole(["error", "group", "groupEnd"], () => {
        tantrum.report()
      })

      assert.match(output, /User input validation failed/)
      assert.match(output, /Name is required/)
      assert.match(output, /Email is invalid/)
      assert.match(output, /Age must be positive/)
    })

    it("supports the Runts box scenario from docs", () => {
      const emptyRuntsBoxError = new Error("Runts box is empty")
      const tantrum = Tantrum.new("Someone ate all my Runts!", [
        emptyRuntsBoxError,
        emptyRuntsBoxError,
        emptyRuntsBoxError
      ])

      assert.equal(tantrum.errors.length, 3)
      assert.equal(tantrum.message, "Someone ate all my Runts!")

      const output = captureConsole(["error", "group", "groupEnd"], () => {
        tantrum.report()
      })

      assert.match(output, /Someone ate all my Runts!/)
      assert.match(output, /x3/)
      assert.match(output, /Runts box is empty/)
    })

    it("integrates well with existing error handling patterns", () => {
      try {
        throw Tantrum.new("Batch processing failed", [
          new Error("File 1 corrupted"),
          Sass.new("File 2 missing").addTrace("During file scan")
        ])
      } catch (error) {
        assert.ok(error instanceof Tantrum)
        assert.ok(error instanceof AggregateError)
        assert.equal(error.errors.length, 2)

        // Should be able to report
        const output = captureConsole(["error", "group", "groupEnd"], () => {
          error.report()
        })
        assert.match(output, /Batch processing failed/)
      }
    })

  })
})
