#!/usr/bin/env node

import assert from "node:assert/strict"
import {EventEmitter} from "node:events"
import {describe, it} from "node:test"

import {Sass,Util} from "../../src/index.js"

// Note: Base Util functionality is tested in browser tests
// These tests only cover Node-specific features (hashOf, asyncEmit, asyncEmitQuack)

describe("Util (Node-specific features)", () => {
  describe("hashOf()", () => {
    it("generates consistent SHA256 hashes", () => {
      const hash1 = Util.hashOf("hello world")
      const hash2 = Util.hashOf("hello world")

      assert.equal(hash1, hash2) // Should be deterministic
      assert.equal(hash1.length, 64) // SHA256 is 64 hex chars
      assert.match(hash1, /^[a-f0-9]{64}$/) // Should be valid hex
    })

    it("generates different hashes for different inputs", () => {
      const hash1 = Util.hashOf("hello")
      const hash2 = Util.hashOf("world")

      assert.notEqual(hash1, hash2)
    })

    it("handles empty strings", () => {
      const hash = Util.hashOf("")

      assert.equal(hash.length, 64)
      assert.match(hash, /^[a-f0-9]{64}$/)
      // SHA256 of empty string is known value
      assert.equal(hash, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    })

    it("handles unicode and special characters", () => {
      const hash1 = Util.hashOf("🚀 rocket")
      const hash2 = Util.hashOf("émilie café")

      assert.equal(hash1.length, 64)
      assert.equal(hash2.length, 64)
      assert.notEqual(hash1, hash2)
    })

    it("handles non-string inputs (potential issue)", () => {
      // This might throw or behave unexpectedly
      try {
        const hash = Util.hashOf(123)
        assert.equal(hash.length, 64) // If it works, should still be valid
      } catch (error) {
        // If it throws, that's also valid behavior
        assert.ok(error instanceof Error)
      }
    })

    it("produces standard SHA256 hashes", () => {
      // Test against known SHA256 values
      const testCases = [
        {input: "hello", expected: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"},
        {input: "The quick brown fox jumps over the lazy dog", expected: "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592"}
      ]

      testCases.forEach(({input, expected}) => {
        const actual = Util.hashOf(input)
        assert.equal(actual, expected)
      })
    })
  })

  describe("Async event emission", () => {
    describe("asyncEmit()", () => {
      it("emits events and waits for async listeners", async () => {
        const emitter = new EventEmitter()
        let executionOrder = []

        emitter.on("test", async () => {
          executionOrder.push("listener1-start")
          await new Promise(resolve => setTimeout(resolve, 50))
          executionOrder.push("listener1-end")
        })

        emitter.on("test", async () => {
          executionOrder.push("listener2-start")
          await new Promise(resolve => setTimeout(resolve, 25))
          executionOrder.push("listener2-end")
        })

        await Util.asyncEmit(emitter, "test", "payload")

        // All listeners should have completed
        assert.ok(executionOrder.includes("listener1-end"))
        assert.ok(executionOrder.includes("listener2-end"))
      })

      it("throws on first listener error", async () => {
        const emitter = new EventEmitter()

        emitter.on("test", async () => {
          throw new Error("Listener error")
        })

        emitter.on("test", async () => {
          return "success"
        })

        await assert.rejects(
          () => Util.asyncEmit(emitter, "test"),
          Sass
        )
      })

      it("validates EventEmitter instance strictly", async () => {
        const fakeEmitter = {
          listeners: () => [],
          on: () => {},
          emit: () => {}
        }

        await assert.rejects(
          () => Util.asyncEmit(fakeEmitter, "test"),
          /must be an EventEmitter instance/
        )
      })

      it("handles events with no listeners", async () => {
        const emitter = new EventEmitter()

        // Should not throw for events with no listeners
        await Util.asyncEmit(emitter, "nonexistent")
      })

      it("passes arguments correctly to listeners", async () => {
        const emitter = new EventEmitter()
        let receivedArgs = null

        emitter.on("test", async (...args) => {
          receivedArgs = args
        })

        await Util.asyncEmit(emitter, "test", "arg1", 42, {key: "value"})

        assert.deepEqual(receivedArgs, ["arg1", 42, {key: "value"}])
      })
    })

    describe("asyncEmitQuack()", () => {
      it("works with EventEmitter-like objects (duck typing)", async () => {
        let called = false
        const fakeEmitter = {
          listeners: () => [
            async () => {
              called = true
            }
          ],
          on: () => {},
          emit: () => {}
        }

        await Util.asyncEmitQuack(fakeEmitter, "test")
        assert.ok(called)
      })

      it("validates emitter-like interface", async () => {
        const invalidEmitter = {
          // Missing required methods
        }

        await assert.rejects(
          () => Util.asyncEmitQuack(invalidEmitter, "test"),
          /must be an EventEmitter-like object/
        )
      })

      it("handles partial implementations", async () => {
        const partialEmitter = {
          listeners: () => [],
          on: () => {}
          // Missing emit method
        }

        await assert.rejects(
          () => Util.asyncEmitQuack(partialEmitter, "test"),
          Sass
        )
      })
    })
  })

  describe("Error handling edge cases", () => {
    it("handles async emit with non-Error rejections", async () => {
      const emitter = new EventEmitter()

      emitter.on("test", async () => {
        throw "string error" // Non-Error object
      })

      await assert.rejects(
        () => Util.asyncEmit(emitter, "test"),
        Sass
      )
    })

    it("provides detailed error context in async emit failures", async () => {
      const emitter = new EventEmitter()

      emitter.on("test", async () => {
        throw new Error("Listener failure")
      })

      try {
        await Util.asyncEmit(emitter, "test", "arg1", "arg2")
        assert.fail("Should have thrown")
      } catch (error) {
        assert.ok(error instanceof Sass)
        // After fix: Should properly wrap with context in trace when it's not already a Sass error
        assert.equal(error.message, "Listener failure") // Original message preserved
        assert.equal(error.trace.length, 2) // Should have context + original
        assert.match(error.trace[0], /Processing 'test' event/)
        assert.match(error.trace[0], /with arguments: arg1, arg2/)
      }
    })

    it("handles error wrapping correctly", async () => {
      const emitter = new EventEmitter()

      emitter.on("test", async () => {
        throw new Sass("Original Sass error")
      })

      try {
        await Util.asyncEmit(emitter, "test")
        assert.fail("Should have thrown")
      } catch (error) {
        // After fix: Should not double-wrap Sass errors
        assert.ok(error instanceof Sass)
        assert.equal(error.message, "Original Sass error")
        // Should not have extra wrapping context
        assert.equal(error.trace.length, 1)
      }
    })
  })

  describe("getEnv()", () => {
    const originalEnv = process.env

    it("parses valid JSON5 from environment variable", () => {
      process.env.TEST_VAR = '{"debug": true, timeout: 5000}'
      const result = Util.getEnv("TEST_VAR")

      assert.deepEqual(result, {debug: true, timeout: 5000})
      delete process.env.TEST_VAR
    })

    it("returns default value when variable doesn't exist", () => {
      const defaultValue = {fallback: true}
      const result = Util.getEnv("NONEXISTENT_VAR", defaultValue)

      assert.deepEqual(result, defaultValue)
    })

    it("returns default value when variable is empty string", () => {
      process.env.EMPTY_VAR = ""
      const defaultValue = {empty: true}
      const result = Util.getEnv("EMPTY_VAR", defaultValue)

      assert.deepEqual(result, defaultValue)
      delete process.env.EMPTY_VAR
    })

    it("returns undefined when no default provided and variable missing", () => {
      const result = Util.getEnv("MISSING_VAR")

      assert.equal(result, undefined)
    })

    it("handles JSON5 extensions (unquoted keys, trailing commas)", () => {
      process.env.JSON5_VAR = '{name: "test", items: [1, 2, 3,]}'
      const result = Util.getEnv("JSON5_VAR")

      assert.deepEqual(result, {name: "test", items: [1, 2, 3]})
      delete process.env.JSON5_VAR
    })

    it("parses simple values (strings, numbers, booleans)", () => {
      process.env.STRING_VAR = '"hello"'
      process.env.NUMBER_VAR = "42"
      process.env.BOOL_VAR = "true"

      assert.equal(Util.getEnv("STRING_VAR"), "hello")
      assert.equal(Util.getEnv("NUMBER_VAR"), 42)
      assert.equal(Util.getEnv("BOOL_VAR"), true)

      delete process.env.STRING_VAR
      delete process.env.NUMBER_VAR
      delete process.env.BOOL_VAR
    })

    it("parses arrays", () => {
      process.env.ARRAY_VAR = "[1, 2, 3]"
      const result = Util.getEnv("ARRAY_VAR")

      assert.deepEqual(result, [1, 2, 3])
      delete process.env.ARRAY_VAR
    })

    it("throws Sass error on invalid JSON5", () => {
      process.env.BAD_JSON = "{this is not valid json"

      try {
        Util.getEnv("BAD_JSON")
        assert.fail("Should have thrown")
      } catch(error) {
        assert.ok(error instanceof Sass, "Error should be a Sass instance")
        // The error is wrapped by Sass, so check for the JSON5 parsing error
        assert.ok(error.message.includes("JSON5") || error.message.includes("parse"), `Unexpected error message: ${error.message}`)
      }

      delete process.env.BAD_JSON
    })

    it("throws on non-string variable name", () => {
      assert.throws(
        () => Util.getEnv(123),
        error => error.message.includes("String")
      )
    })

    it("handles null in JSON values", () => {
      process.env.NULL_VAR = "null"

      assert.equal(Util.getEnv("NULL_VAR"), null)

      delete process.env.NULL_VAR
    })

    it("preserves nested objects", () => {
      process.env.NESTED_VAR = '{"a": {"b": {"c": 123}}}'
      const result = Util.getEnv("NESTED_VAR")

      assert.deepEqual(result, {a: {b: {c: 123}}})
      delete process.env.NESTED_VAR
    })

    it("handles complex JSON5 with comments", () => {
      process.env.COMMENTED_VAR = `{
        // This is a comment
        debug: true,
        /* Block comment */
        port: 3000
      }`
      const result = Util.getEnv("COMMENTED_VAR")

      assert.deepEqual(result, {debug: true, port: 3000})
      delete process.env.COMMENTED_VAR
    })
  })
})
