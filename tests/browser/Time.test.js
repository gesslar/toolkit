#!/usr/bin/env node

import assert from "node:assert/strict"
import {describe, it} from "node:test"

import {Time, Sass} from "@gesslar/toolkit/browser"

describe("Time", () => {
  describe("after()", () => {
    it("resolves after specified delay", async () => {
      const start = Date.now()
      await Time.after(50)
      const elapsed = Date.now() - start

      assert.ok(elapsed >= 45, `Expected at least 45ms, got ${elapsed}ms`)
    })

    it("resolves with provided value", async () => {
      const result = await Time.after(10, "test value")
      assert.equal(result, "test value")
    })

    it("resolves with undefined when no value provided", async () => {
      const result = await Time.after(10)
      assert.equal(result, undefined)
    })

    it("returns promise with timerId property", () => {
      const promise = Time.after(100, "value")
      assert.ok("timerId" in promise, "Promise should have timerId property")
      assert.ok(promise.timerId, "timerId should be truthy")

      Time.cancel(promise)
    })

    it("handles zero delay", async () => {
      const result = await Time.after(0, "immediate")
      assert.equal(result, "immediate")
    })

    it("resolves with null value", async () => {
      const result = await Time.after(10, null)
      assert.equal(result, null)
    })

    it("resolves with object value", async () => {
      const obj = {key: "value", nested: {data: 42}}
      const result = await Time.after(10, obj)
      assert.deepEqual(result, obj)
    })

    it("resolves with array value", async () => {
      const arr = [1, 2, 3, "four"]
      const result = await Time.after(10, arr)
      assert.deepEqual(result, arr)
    })

    it("resolves with boolean value", async () => {
      const resultTrue = await Time.after(10, true)
      const resultFalse = await Time.after(10, false)
      assert.equal(resultTrue, true)
      assert.equal(resultFalse, false)
    })

    it("resolves with number value", async () => {
      const result = await Time.after(10, 42)
      assert.equal(result, 42)
    })

    it("throws Sass error for non-number delay", () => {
      assert.throws(
        () => Time.after("100"),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Invalid type.*Expected number/i)
          return true
        }
      )
    })

    it("throws Sass error for undefined delay", () => {
      assert.throws(
        () => Time.after(undefined),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Invalid type.*Expected number/i)
          return true
        }
      )
    })

    it("throws Sass error for null delay", () => {
      assert.throws(
        () => Time.after(null),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Invalid type.*Expected number/i)
          return true
        }
      )
    })

    it("throws Sass error for object delay", () => {
      assert.throws(
        () => Time.after({}),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Invalid type.*Expected number/i)
          return true
        }
      )
    })

    it("throws Sass error for array delay", () => {
      assert.throws(
        () => Time.after([100]),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Invalid type.*Expected number/i)
          return true
        }
      )
    })

    it("throws Sass error for negative delay", () => {
      assert.throws(
        () => Time.after(-100),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /delay must be non-negative/i)
          return true
        }
      )
    })

    it("throws Sass error for negative infinity", () => {
      assert.throws(
        () => Time.after(-Infinity),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /delay must be non-negative/i)
          return true
        }
      )
    })

    it("accepts positive infinity", async () => {
      const promise = Time.after(Infinity, "never")
      assert.ok(promise instanceof Promise)
      Time.cancel(promise)
    })

    it("handles very large delays", () => {
      const promise = Time.after(Number.MAX_SAFE_INTEGER, "far future")
      assert.ok(promise instanceof Promise)
      assert.ok("timerId" in promise)
      Time.cancel(promise)
    })

    it("handles multiple concurrent delays", async () => {
      const results = await Promise.all([
        Time.after(10, "first"),
        Time.after(20, "second"),
        Time.after(15, "third")
      ])

      assert.deepEqual(results, ["first", "second", "third"])
    })
  })

  describe("cancel()", () => {
    it("cancels a pending timeout", async () => {
      let resolved = false
      const promise = Time.after(100, "should not resolve")
      promise.then(() => {
        resolved = true
      })

      Time.cancel(promise)

      await new Promise(resolve => setTimeout(resolve, 150))
      assert.equal(resolved, false, "Promise should not have resolved")
    })

    it("handles null gracefully", () => {
      assert.doesNotThrow(() => Time.cancel(null))
    })

    it("handles undefined gracefully", () => {
      assert.doesNotThrow(() => Time.cancel(undefined))
    })

    it("handles non-object gracefully", () => {
      assert.doesNotThrow(() => Time.cancel(42))
      assert.doesNotThrow(() => Time.cancel("string"))
      assert.doesNotThrow(() => Time.cancel(true))
    })

    it("handles promise without timerId gracefully", () => {
      const regularPromise = Promise.resolve("test")
      assert.doesNotThrow(() => Time.cancel(regularPromise))
    })

    it("handles object without timerId gracefully", () => {
      const obj = {other: "property"}
      assert.doesNotThrow(() => Time.cancel(obj))
    })

    it("handles already resolved promise", async () => {
      const promise = Time.after(10, "resolved")
      await promise
      assert.doesNotThrow(() => Time.cancel(promise))
    })

    it("can be called multiple times on same promise", () => {
      const promise = Time.after(100, "value")
      assert.doesNotThrow(() => {
        Time.cancel(promise)
        Time.cancel(promise)
        Time.cancel(promise)
      })
    })
  })

  describe("integration scenarios", () => {
    it("creates and cancels multiple timeouts selectively", async () => {
      const results = []

      const p1 = Time.after(30, "keep1")
      const p2 = Time.after(40, "cancel")
      const p3 = Time.after(50, "keep2")

      p1.then(val => results.push(val))
      p2.then(val => results.push(val))
      p3.then(val => results.push(val))

      Time.cancel(p2)

      await new Promise(resolve => setTimeout(resolve, 100))

      assert.equal(results.length, 2)
      assert.ok(results.includes("keep1"))
      assert.ok(results.includes("keep2"))
      assert.ok(!results.includes("cancel"))
    })

    it("handles race conditions with cancel", async () => {
      const promise = Time.after(10, "quick")

      const raceResult = await Promise.race([
        promise,
        new Promise(resolve => {
          setTimeout(() => {
            Time.cancel(promise)
            resolve("cancelled")
          }, 50)
        })
      ])

      assert.equal(raceResult, "quick")
    })

    it("works with Promise.all", async () => {
      const promises = [
        Time.after(10, 1),
        Time.after(20, 2),
        Time.after(15, 3)
      ]

      const results = await Promise.all(promises)
      assert.deepEqual(results, [1, 2, 3])
    })

    it("works with Promise.race", async () => {
      const promises = [
        Time.after(50, "slow"),
        Time.after(10, "fast"),
        Time.after(30, "medium")
      ]

      const result = await Promise.race(promises)
      assert.equal(result, "fast")
    })

    it("can create delay chain", async () => {
      const results = []

      await Time.after(10, "first").then(val => {
        results.push(val)
        return Time.after(10, "second")
      }).then(val => {
        results.push(val)
        return Time.after(10, "third")
      }).then(val => {
        results.push(val)
      })

      assert.deepEqual(results, ["first", "second", "third"])
    })

    it("handles errors in promise chain", async () => {
      let caughtError = null

      await Time.after(10, "value")
        .then(() => {
          throw new Error("intentional error")
        })
        .catch(err => {
          caughtError = err
        })

      assert.ok(caughtError instanceof Error)
      assert.equal(caughtError.message, "intentional error")
    })

    it("supports async/await patterns", async () => {
      const start = Date.now()

      await Time.after(20)
      const middle = Date.now()

      await Time.after(20)
      const end = Date.now()

      const firstDelay = middle - start
      const secondDelay = end - middle

      assert.ok(firstDelay >= 15, "First delay should be at least 15ms")
      assert.ok(secondDelay >= 15, "Second delay should be at least 15ms")
    })
  })
})
