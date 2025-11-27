#!/usr/bin/env node

import assert from "node:assert/strict"
import {afterEach, beforeEach, describe, it} from "node:test"
import {performance} from "node:perf_hooks"

import {Util} from "@gesslar/toolkit/browser"

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

    it("rejects non-string inputs", () => {
      assert.throws(() => Util.capitalize(null), TypeError)
      assert.throws(() => Util.capitalize(undefined), TypeError)
      assert.throws(() => Util.capitalize(123), TypeError)
      assert.throws(() => Util.capitalize([1, 2, 3]), TypeError)
      assert.throws(() => Util.capitalize({}), TypeError)
    })

    it("handles special characters and unicode", () => {
      assert.equal(Util.capitalize("émilie"), "Émilie")
      assert.equal(Util.capitalize("🤔thinking"), "🤔thinking") // Emoji first char
      assert.equal(Util.capitalize("123abc"), "123abc") // Number first
    })
  })

  describe("time()", () => {
    let originalNow

    const mockNowSequence = sequence => {
      let index = 0
      performance.now = () => {
        const value = sequence[Math.min(index, sequence.length - 1)]
        index += 1
        return value
      }
    }

    beforeEach(() => {
      originalNow = performance.now
    })

    afterEach(() => {
      performance.now = originalNow
    })

    it("captures elapsed time using performance.now", async () => {
      mockNowSequence([100, 150.75])

      const {result, cost} = await Util.time(async () => {
        return await Promise.resolve("completed")
      })

      assert.equal(result, "completed")
      assert.equal(cost, 50.8) // (150.75 - 100) rounded to 1 decimal place
      assert.equal(typeof cost, "number")
      assert.ok(Number.isFinite(cost))
    })

    it("returns zero when no time elapses", async () => {
      mockNowSequence([42, 42])

      const {cost} = await Util.time(async () => {
        return await Promise.resolve()
      })

      assert.equal(cost, 0)
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
      mockNowSequence([10, 22.34])

      const {cost} = await Util.time(async () => {
        return await Promise.resolve("test")
      })

      assert.equal(cost, 12.3)
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

  describe("centreAlignText()", () => {
    it("centre-aligns text within default width (80)", () => {
      const result = Util.centreAlignText("hello")

      assert.equal(result.length, 80)
      // "hello" is 5 chars, total padding is 75, left gets 37, right gets 38
      assert.equal(result.trim(), "hello")
      assert.ok(result.indexOf("hello") > 30 && result.indexOf("hello") < 45)
    })

    it("centre-aligns with custom width", () => {
      const result = Util.centreAlignText("test", 10)

      assert.equal(result.length, 10)
      // "test" is 4 chars, total padding is 6, left gets 3, right gets 3
      assert.equal(result, "   test   ")
    })

    it("handles numbers by converting to strings", () => {
      const result = Util.centreAlignText(123, 10)

      assert.equal(result.length, 10)
      // "123" is 3 chars, total padding is 7, left gets 3, right gets 4
      assert.equal(result, "   123    ")
    })

    it("returns unchanged if text exceeds width", () => {
      const longText = "This text is definitely longer than 10 characters"
      const result = Util.centreAlignText(longText, 10)

      assert.equal(result, longText) // Should return unchanged
      assert.ok(result.length > 10)
    })

    it("handles edge cases", () => {
      // Zero width
      assert.equal(Util.centreAlignText("test", 0), "test")

      // Negative width
      assert.equal(Util.centreAlignText("test", -5), "test")

      // Exact width match
      assert.equal(Util.centreAlignText("1234567890", 10), "1234567890")
    })

    it("handles non-string inputs via String() conversion", () => {
      // "null" is 4 chars, total padding is 6, left gets 3, right gets 3
      assert.equal(Util.centreAlignText(null, 10), "   null   ")
      // "undefined" is 9 chars, total padding is 1, left gets 0, right gets 1
      assert.equal(Util.centreAlignText(undefined, 10), "undefined ")
      // "true" is 4 chars, total padding is 6, left gets 3, right gets 3
      assert.equal(Util.centreAlignText(true, 10), "   true   ")
    })

    it("centres odd-length strings correctly", () => {
      // "Hi!" is 3 chars, total padding is 7, left gets 3, right gets 4
      assert.equal(Util.centreAlignText("Hi!", 10), "   Hi!    ")
    })

    it("centres even-length strings correctly", () => {
      // "Test" is 4 chars, total padding is 6, left gets 3, right gets 3
      assert.equal(Util.centreAlignText("Test", 10), "   Test   ")
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

  // Note: asyncEmit() and asyncEmitQuack() tests are in Node tests (uses EventEmitter)

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
  })

  describe("levenshteinDistance()", () => {
    it("returns 0 for identical strings", () => {
      assert.equal(Util.levenshteinDistance("hello", "hello"), 0)
      assert.equal(Util.levenshteinDistance("", ""), 0)
      assert.equal(Util.levenshteinDistance("a", "a"), 0)
    })

    it("calculates correct distances for single operations", () => {
      // Insertions
      assert.equal(Util.levenshteinDistance("abc", "ab"), 1) // delete 'c'
      assert.equal(Util.levenshteinDistance("ab", "abc"), 1) // insert 'c'

      // Deletions
      assert.equal(Util.levenshteinDistance("abc", "ac"), 1) // delete 'b'

      // Substitutions
      assert.equal(Util.levenshteinDistance("abc", "adc"), 1) // 'b' -> 'd'
    })

    it("calculates distances for complex examples", () => {
      assert.equal(Util.levenshteinDistance("kitten", "sitting"), 3)
      assert.equal(Util.levenshteinDistance("book", "back"), 2)
      assert.equal(Util.levenshteinDistance("saturday", "sunday"), 3)
    })

    it("handles empty strings", () => {
      assert.equal(Util.levenshteinDistance("", "abc"), 3)
      assert.equal(Util.levenshteinDistance("abc", ""), 3)
      assert.equal(Util.levenshteinDistance("", ""), 0)
    })

    it("handles strings of different lengths", () => {
      assert.equal(Util.levenshteinDistance("a", "abc"), 2)
      assert.equal(Util.levenshteinDistance("abc", "a"), 2)
    })

    it("handles unicode characters", () => {
      assert.equal(Util.levenshteinDistance("café", "cafe"), 1) // é -> e
      assert.equal(Util.levenshteinDistance("naïve", "naive"), 1) // ï -> i
    })
  })

  describe("findClosestMatch()", () => {
    it("returns exact match when present", () => {
      const allowed = ["help", "build", "test", "deploy"]
      assert.equal(Util.findClosestMatch("help", allowed), "help")
      assert.equal(Util.findClosestMatch("test", allowed), "test")
    })

    it("finds closest matches within threshold", () => {
      const allowed = ["help", "build", "test", "deploy"]

      // Single character differences
      assert.equal(Util.findClosestMatch("bulid", allowed), "build") // 'u' -> 'i'
      assert.equal(Util.findClosestMatch("tst", allowed), "test") // missing 'e'
      assert.equal(Util.findClosestMatch("deply", allowed), "deploy") // missing 'o'

      // Two character differences
      assert.equal(Util.findClosestMatch("buid", allowed), "build") // missing 'l'
      assert.equal(Util.findClosestMatch("hlelp", allowed), "help") // extra 'l'
    })

    it("returns null when no match within threshold", () => {
      const allowed = ["help", "build", "test", "deploy"]

      assert.equal(Util.findClosestMatch("xyz", allowed), null)
      assert.equal(Util.findClosestMatch("completelydifferent", allowed), null)
      assert.equal(Util.findClosestMatch("", allowed), null)
    })

    it("handles empty allowed values array", () => {
      assert.equal(Util.findClosestMatch("anything", []), null)
    })

    it("prefers closer matches when multiple are within threshold", () => {
      const allowed = ["cat", "bat", "rat"]
      assert.equal(Util.findClosestMatch("bat", allowed), "bat") // exact match
      assert.equal(Util.findClosestMatch("bt", allowed), "bat") // 1 edit vs cat=2, rat=2
    })

    it("handles unicode and special characters", () => {
      const allowed = ["café", "naïve", "résumé"]
      assert.equal(Util.findClosestMatch("cafe", allowed), "café") // é -> e
      assert.equal(Util.findClosestMatch("naive", allowed), "naïve") // ï -> i
    })

    it("works with various string lengths", () => {
      const allowed = ["a", "ab", "abc", "abcd"]
      assert.equal(Util.findClosestMatch("b", allowed), "a") // 1 edit (a->b)
      assert.equal(Util.findClosestMatch("ad", allowed), "ab") // 1 edit (b->d)
      assert.equal(Util.findClosestMatch("xyz", allowed), null) // too far
    })

    it("respects custom threshold parameter", () => {
      const allowed = ["help", "build", "test", "deploy"]
      assert.equal(Util.findClosestMatch("xyz", allowed, 1), null) // too far with threshold 1
      assert.equal(Util.findClosestMatch("hel", allowed, 1), "help") // 1 edit, within threshold 1
      assert.equal(Util.findClosestMatch("bulid", allowed, 3), "build") // 1 edit, within threshold 3
    })
  })
})
