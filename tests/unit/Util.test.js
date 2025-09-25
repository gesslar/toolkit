#!/usr/bin/env node

import assert from "node:assert/strict"
import {EventEmitter} from "node:events"
import {describe, it} from "node:test"

import {Sass,Util} from "../../src/index.js"


describe("Util", () => {
  describe("capitalize()", () => {
    it("capitalizes normal strings", () => {
      assert.equal(Util.capitalize("hello"), "Hello")
      assert.equal(Util.capitalize("world"), "World")
      assert.equal(Util.capitalize("test string"), "Test string")
    })

    it("handles empty and single character strings", () => {
      assert.equal(Util.capitalize(""), "")
      assert.equal(Util.capitalize("a"), "A")
      assert.equal(Util.capitalize("A"), "A")
    })

    it("handles already capitalized strings", () => {
      assert.equal(Util.capitalize("Hello World"), "Hello World")
      assert.equal(Util.capitalize("SCREAMING"), "SCREAMING")
    })

    // 🚨 Testing the logic bomb - what happens with non-strings?
    it("handles non-string inputs (potential issue)", () => {
      // This reveals the silent failure pattern
      assert.equal(Util.capitalize(null), null) // Returns null unchanged!
      assert.equal(Util.capitalize(undefined), undefined) // Returns undefined unchanged!
      assert.equal(Util.capitalize(123), 123) // Returns number unchanged!
      assert.deepEqual(Util.capitalize([1, 2, 3]), [1, 2, 3]) // Returns array unchanged!

      // This is problematic - should these be errors instead?
    })

    it("handles special characters and unicode", () => {
      assert.equal(Util.capitalize("émilie"), "Émilie")
      assert.equal(Util.capitalize("🤔thinking"), "🤔thinking") // Emoji first char
      assert.equal(Util.capitalize("123abc"), "123abc") // Number first
    })
  })

  describe("time()", () => {
    it("measures execution time for async functions", async () => {
      const {result, cost} = await Util.time(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return "completed"
      })

      assert.equal(result, "completed")
      assert.ok(cost >= 50) // Should be at least 50ms
      assert.ok(cost < 100) // But not too much more (allowing for system variance)
      assert.equal(typeof cost, "number")
      assert.ok(Number.isFinite(cost))
    })

    it("measures time for fast operations", async () => {
      const {result, cost} = await Util.time(async () => {
        return Math.random()
      })

      assert.equal(typeof result, "number")
      assert.ok(cost >= 0) // Time should be non-negative
      assert.ok(cost < 10) // Should be very fast
    })

    it("handles functions that throw errors", async () => {
      await assert.rejects(
        () => Util.time(async () => {
          throw new Error("Test error")
        }),
        /Test error/
      )
    })

    it("handles functions that return promises that reject", async () => {
      await assert.rejects(
        () => Util.time(async () => {
          return Promise.reject(new Error("Rejection test"))
        }),
        /Rejection test/
      )
    })

    it("rounds cost to one decimal place", async () => {
      const {cost} = await Util.time(async () => {
        await new Promise(resolve => setTimeout(resolve, 1))
        return "test"
      })

      // Should be rounded to 1 decimal place
      const decimalPlaces = cost.toString().split(".")[1]?.length || 0
      assert.ok(decimalPlaces <= 1)
    })
  })

  describe("rightAlignText()", () => {
    it("right-aligns text within default width (80)", () => {
      const result = Util.rightAlignText("hello")

      assert.equal(result.length, 80)
      assert.ok(result.endsWith("hello"))
      assert.ok(result.startsWith("     ")) // Should start with spaces
    })

    it("right-aligns with custom width", () => {
      const result = Util.rightAlignText("test", 10)

      assert.equal(result.length, 10)
      assert.equal(result, "      test")
    })

    it("handles numbers by converting to strings", () => {
      const result = Util.rightAlignText(123, 10)

      assert.equal(result.length, 10)
      assert.equal(result, "       123")
    })

    it("returns unchanged if text exceeds width", () => {
      const longText = "This text is definitely longer than 10 characters"
      const result = Util.rightAlignText(longText, 10)

      assert.equal(result, longText) // Should return unchanged
      assert.ok(result.length > 10)
    })

    it("handles edge cases", () => {
      // Zero width
      assert.equal(Util.rightAlignText("test", 0), "test")

      // Negative width
      assert.equal(Util.rightAlignText("test", -5), "test")

      // Exact width match
      assert.equal(Util.rightAlignText("1234567890", 10), "1234567890")
    })

    it("handles non-string inputs via String() conversion", () => {
      assert.equal(Util.rightAlignText(null, 10), "      null")
      assert.equal(Util.rightAlignText(undefined, 10), " undefined")
      assert.equal(Util.rightAlignText(true, 10), "      true")
    })
  })

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

    // 🚨 What happens with non-strings? Let's find out!
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
  })

  describe("generateOptionNames()", () => {
    it("extracts long option names", () => {
      const options = {
        "-w, --watch": "Watch for changes",
        "-b, --build": "Build the project",
        "--config": "Config file path"
      }

      const names = Util.generateOptionNames(options)
      assert.deepEqual(names.sort(), ["build", "config", "watch"])
    })

    it("prefers long options over short ones", () => {
      const options = {
        "-v, --verbose": "Verbose output",
        "-q, --quiet": "Quiet mode"
      }

      const names = Util.generateOptionNames(options)
      assert.deepEqual(names.sort(), ["quiet", "verbose"])
      // Should not include "v" or "q"
    })

    it("includes short options when no long option present", () => {
      const options = {
        "-v": "Verbose output",
        "-h": "Help",
        "--config": "Config file"
      }

      const names = Util.generateOptionNames(options)
      assert.deepEqual(names.sort(), ["config", "h", "v"])
    })

    it("handles malformed option strings", () => {
      const options = {
        "invalid-option": "No dashes",
        "": "Empty string",
        "-": "Just dash",
        "--": "Just double dash",
        "-w, --watch": "Valid option"
      }

      const names = Util.generateOptionNames(options)
      // Should filter out malformed options and only return valid ones
      // After fix: empty option names like "-" should be filtered out
      assert.deepEqual(names, ["watch"])
    })

    it("handles complex option strings", () => {
      const options = {
        "-w, --watch, --monitor": "Multiple long options", // Should prefer first
        "  -v  ,  --verbose  ": "Spaces around options",
        "-f,--file": "No space after comma"
      }

      const names = Util.generateOptionNames(options)
      assert.deepEqual(names.sort(), ["file", "verbose", "watch"])
    })

    it("handles empty input", () => {
      const names = Util.generateOptionNames({})
      assert.deepEqual(names, [])
    })

    // 🚨 Testing edge cases that might break the regex
    it("handles edge case option formats", () => {
      const options = {
        "-123": "Numeric option",
        "--multi-word-option": "Multi word",
        "-_": "Underscore option",
        "--": "Empty long option",
        "not-an-option": "No dashes"
      }

      const names = Util.generateOptionNames(options)
      // Let's see what gets through the filter
      console.log("Edge case results:", names)
    })
  })

  describe("Promise utilities", () => {
    describe("awaitAll()", () => {
      it("waits for all promises to resolve", async () => {
        const promises = [
          Promise.resolve(1),
          Promise.resolve(2),
          Promise.resolve(3)
        ]

        const results = await Util.awaitAll(promises)
        assert.deepEqual(results, [1, 2, 3])
      })

      it("rejects if any promise rejects", async () => {
        const promises = [
          Promise.resolve(1),
          Promise.reject(new Error("Test error")),
          Promise.resolve(3)
        ]

        await assert.rejects(
          () => Util.awaitAll(promises),
          /Test error/
        )
      })

      it("handles empty array", async () => {
        const results = await Util.awaitAll([])
        assert.deepEqual(results, [])
      })
    })

    describe("settleAll()", () => {
      it("settles all promises regardless of outcome", async () => {
        const promises = [
          Promise.resolve("success"),
          Promise.reject(new Error("failure")),
          Promise.resolve(42)
        ]

        const results = await Util.settleAll(promises)

        assert.equal(results.length, 3)
        assert.equal(results[0].status, "fulfilled")
        assert.equal(results[0].value, "success")
        assert.equal(results[1].status, "rejected")
        assert.ok(results[1].reason instanceof Error)
        assert.equal(results[2].status, "fulfilled")
        assert.equal(results[2].value, 42)
      })
    })

    describe("race()", () => {
      it("returns first resolved promise", async () => {
        const promises = [
          new Promise(resolve => setTimeout(() => resolve("slow"), 100)),
          Promise.resolve("fast"),
          new Promise(resolve => setTimeout(() => resolve("medium"), 50))
        ]

        const result = await Util.race(promises)
        assert.equal(result, "fast")
      })

      it("rejects with first rejection", async () => {
        const promises = [
          new Promise((_, reject) => setTimeout(() => reject(new Error("slow error")), 100)),
          Promise.reject(new Error("fast error")),
          Promise.resolve("success")
        ]

        await assert.rejects(
          () => Util.race(promises),
          /fast error/
        )
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

    describe("asyncEmitAnon()", () => {
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

        await Util.asyncEmitAnon(fakeEmitter, "test")
        assert.ok(called)
      })

      it("validates emitter-like interface", async () => {
        const invalidEmitter = {
          // Missing required methods
        }

        await assert.rejects(
          () => Util.asyncEmitAnon(invalidEmitter, "test"),
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
          () => Util.asyncEmitAnon(partialEmitter, "test"),
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

    // 🚨 Testing the potential double-wrapping issue
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

  describe("Performance and behavior validation", () => {
    it("time() is actually precise", async () => {
      const delay = 100
      const {cost} = await Util.time(async () => {
        await new Promise(resolve => setTimeout(resolve, delay))
      })

      // Should be reasonably close to the expected delay
      assert.ok(cost >= delay - 10) // Allow 10ms variance below
      assert.ok(cost <= delay + 50) // Allow 50ms variance above (system dependent)
    })

    it("hashOf produces standard SHA256", () => {
      // Test against known SHA256 values (corrected)
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
})
