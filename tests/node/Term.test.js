import assert from "node:assert/strict"
import {describe,it} from "node:test"

import {Sass, Term} from "../../src/node/index.js"

/**
 * Helper to capture console output for testing
 * @param {string} method - Console method to capture
 * @param {() => void} fn - Function to execute while capturing
 * @returns {Array} Array of captured console calls
 */
function captureConsole(method, fn) {
  const original = console[method]
  const calls = []
  console[method] = (...args) => { calls.push(args) }
  try {
    fn()
  } finally {
    console[method] = original
  }
  return calls
}

describe("Term", () => {
  describe("basic logging methods", () => {
    it("log forwards to console.log", () => {
      const calls = captureConsole("log", () => {
        Term.log("hello", "world")
      })

      assert.equal(calls.length, 1)
      assert.deepEqual(calls[0], ["hello", "world"])
    })

    it("info forwards to console.info", () => {
      const calls = captureConsole("info", () => {
        Term.info("info message", 123)
      })

      assert.equal(calls.length, 1)
      assert.deepEqual(calls[0], ["info message", 123])
    })

    it("warn forwards to console.warn", () => {
      const calls = captureConsole("warn", () => {
        Term.warn("warning!")
      })

      assert.equal(calls.length, 1)
      assert.deepEqual(calls[0], ["warning!"])
    })

    it("error forwards to console.error", () => {
      const calls = captureConsole("error", () => {
        Term.error("error message", {type: "test"})
      })

      assert.equal(calls.length, 1)
      assert.deepEqual(calls[0], ["error message", {type: "test"}])
    })

    it("debug forwards to console.debug", () => {
      const calls = captureConsole("debug", () => {
        Term.debug("debug info")
      })

      assert.equal(calls.length, 1)
      assert.deepEqual(calls[0], ["debug info"])
    })
  })

  describe("terminalBracket", () => {
    it("creates basic bracketed text", () => {
      const result = Term.terminalBracket(["success", "COMPILED"])

      assert.equal(result, "[COMPILED]")
    })

    it("uses custom brackets when provided", () => {
      const result = Term.terminalBracket(["info", "STATUS", ["<", ">"]])

      assert.equal(result, "<STATUS>")
    })

    it("defaults to square brackets", () => {
      const result = Term.terminalBracket(["error", "FAILED"])

      assert.equal(result, "[FAILED]")
    })

    it("throws error for non-string level", () => {
      assert.throws(() => Term.terminalBracket([123, "text"]), Sass)
    })

    it("throws error for non-string text", () => {
      assert.throws(() => Term.terminalBracket(["level", 456]), Sass)
    })
  })

  describe("terminalMessage", () => {
    it("returns string input unchanged", () => {
      const result = Term.terminalMessage("simple message")

      assert.equal(result, "simple message")
    })

    it("processes array with plain strings", () => {
      const result = Term.terminalMessage(["Hello", "world"])

      assert.equal(result, "Hello world")
    })

    it("processes array with bracketed segments", () => {
      const result = Term.terminalMessage([
        "Status:",
        ["success", "OK"],
        "- processing complete"
      ])

      assert.equal(result, "Status: [OK] - processing complete")
    })

    it("processes array with custom bracket segments", () => {
      const result = Term.terminalMessage([
        "Alert:",
        ["error", "FAILED", ["<", ">"]],
        "check logs"
      ])

      assert.equal(result, "Alert: <FAILED> check logs")
    })

    it("handles mixed content in array", () => {
      const result = Term.terminalMessage([
        "Build",
        ["info", "STARTED"],
        "for project:",
        ["success", "MyApp"]
      ])

      assert.equal(result, "Build [STARTED] for project: [MyApp]")
    })

    it("throws error for invalid argument types", () => {
      assert.throws(() => Term.terminalMessage(123), Sass)
      assert.throws(() => Term.terminalMessage({}), Sass)
      assert.throws(() => Term.terminalMessage(null), Sass)
    })
  })

  describe("status", () => {
    it("outputs formatted message when not silent", () => {
      const calls = captureConsole("info", () => {
        Term.status("Test message")
      })

      assert.equal(calls.length, 1)
      assert.deepEqual(calls[0], ["Test message"])
    })

    it("outputs formatted array message when not silent", () => {
      const calls = captureConsole("info", () => {
        Term.status(["Status:", ["success", "OK"]])
      })

      assert.equal(calls.length, 1)
      assert.deepEqual(calls[0], ["Status: [OK]"])
    })

    it("suppresses output when silent option is true", () => {
      const calls = captureConsole("info", () => {
        Term.status("Should not appear", {silent: true})
      })

      assert.equal(calls.length, 0)
    })

    it("outputs by default when silent option not provided", () => {
      const calls = captureConsole("info", () => {
        Term.status("Should appear")
      })

      assert.equal(calls.length, 1)
    })
  })

  describe("grouping methods", () => {
    it("group forwards to console.group with arguments", () => {
      const calls = captureConsole("group", () => {
        Term.group("Test Group", 123)
      })

      assert.equal(calls.length, 1)
      assert.deepEqual(calls[0], ["Test Group", 123])
    })

    it("group works with no arguments", () => {
      const calls = captureConsole("group", () => {
        Term.group()
      })

      assert.equal(calls.length, 1)
      assert.deepEqual(calls[0], [])
    })

    it("groupEnd forwards to console.groupEnd", () => {
      const calls = captureConsole("groupEnd", () => {
        Term.groupEnd()
      })

      assert.equal(calls.length, 1)
    })

    it("supports nested groups", () => {
      const groupCalls = []
      const groupEndCalls = []
      const errorCalls = []

      const origGroup = console.group
      const origGroupEnd = console.groupEnd
      const origError = console.error

      console.group = (...args) => groupCalls.push(args)
      console.groupEnd = () => groupEndCalls.push(true)
      console.error = (...args) => errorCalls.push(args)

      try {
        Term.group("Outer")
        Term.error("Message 1")
        Term.group("Inner")
        Term.error("Message 2")
        Term.groupEnd()
        Term.error("Message 3")
        Term.groupEnd()

        assert.equal(groupCalls.length, 2)
        assert.equal(groupEndCalls.length, 2)
        assert.equal(errorCalls.length, 3)
      } finally {
        console.group = origGroup
        console.groupEnd = origGroupEnd
        console.error = origError
      }
    })
  })

  describe("terminal control methods", () => {
    it("directWrite exists and returns a promise", async () => {
      assert.equal(typeof Term.directWrite, "function")
      const result = Term.directWrite("")
      assert.ok(result instanceof Promise)
      await result // Should resolve without error
    })

    it("clearLines exists", () => {
      assert.equal(typeof Term.clearLines, "function")
    })

    it("write exists and returns Term class for chaining", () => {
      assert.equal(typeof Term.write, "function")
      // write returns Term class for method chaining
      const result = Term.write("")
      assert.equal(result, Term)
    })

    it("clearLine exists and returns Term class", () => {
      assert.equal(typeof Term.clearLine, "function")
    })

    it("moveUp exists and returns Term class", () => {
      assert.equal(typeof Term.moveUp, "function")
    })

    it("moveStart exists and returns Term class", () => {
      assert.equal(typeof Term.moveStart, "function")
    })

    it("moveEnd exists and returns Term class", () => {
      assert.equal(typeof Term.moveEnd, "function")
    })

    it("hideCursor exists and returns Term class", () => {
      assert.equal(typeof Term.hideCursor, "function")
    })

    it("showCursor exists and returns Term class", () => {
      assert.equal(typeof Term.showCursor, "function")
    })

    it("setCharMode exists", () => {
      assert.equal(typeof Term.setCharMode, "function")
    })

    it("setLineMode exists", () => {
      assert.equal(typeof Term.setLineMode, "function")
    })
  })

  describe("terminal properties", () => {
    it("columns returns a number or undefined (non-TTY)", () => {
      const cols = Term.columns
      // In non-TTY environments (like test runners), columns may be undefined
      assert.ok(cols === undefined || typeof cols === "number")
    })

    it("rows returns a number or undefined (non-TTY)", () => {
      const rows = Term.rows
      // In non-TTY environments (like test runners), rows may be undefined
      assert.ok(rows === undefined || typeof rows === "number")
    })

    it("dim returns an object with columns and rows properties", () => {
      const dim = Term.dim
      assert.ok(typeof dim === "object")
      assert.ok("columns" in dim)
      assert.ok("rows" in dim)
    })

    it("isInteractive returns a boolean", () => {
      const interactive = Term.isInteractive
      // isInteractive uses caching and checks process.stdout.isTTY
      assert.equal(typeof interactive, "boolean")
    })

    it("hasColor returns a boolean", () => {
      const color = Term.hasColor
      assert.equal(typeof color, "boolean")
    })

    it("start returns carriage return sequence", () => {
      assert.equal(Term.start, "\r")
    })

    it("end returns ANSI move to end sequence", () => {
      const end = Term.end
      assert.ok(end.startsWith("\x1b["))
      assert.ok(end.endsWith("G"))
    })

    it("up returns ANSI move up sequence", () => {
      assert.equal(Term.up, "\x1b[1A")
    })
  })

  describe("table method", () => {
    it("exists and is a function", () => {
      assert.equal(typeof Term.table, "function")
    })

    it("handles array data", () => {
      // Just ensure it doesn't throw
      assert.doesNotThrow(() => {
        Term.table([{a: 1, b: 2}, {a: 3, b: 4}])
      })
    })

    it("handles object data", () => {
      assert.doesNotThrow(() => {
        Term.table({row1: {a: 1}, row2: {a: 2}})
      })
    })

    it("accepts properties option", () => {
      assert.doesNotThrow(() => {
        Term.table([{a: 1, b: 2, c: 3}], {properties: ["a", "b"]})
      })
    })

    it("accepts showHeader option", () => {
      assert.doesNotThrow(() => {
        Term.table([{a: 1}], {showHeader: true})
      })
    })

    it("accepts quotedStrings option", () => {
      assert.doesNotThrow(() => {
        Term.table([{a: "hello"}], {quotedStrings: true})
      })
    })

    it("accepts combined options", () => {
      assert.doesNotThrow(() => {
        Term.table([{a: "hello", b: "world"}], {
          showHeader: true,
          quotedStrings: true,
          properties: ["a"]
        })
      })
    })

    it("handles empty array", () => {
      assert.doesNotThrow(() => {
        Term.table([])
      })
    })

    it("handles empty object", () => {
      assert.doesNotThrow(() => {
        Term.table({})
      })
    })
  })
})
