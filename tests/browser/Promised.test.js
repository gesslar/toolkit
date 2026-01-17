#!/usr/bin/env node

import assert from "node:assert/strict"
import {describe, it} from "node:test"

import {Promised, Tantrum} from "@gesslar/toolkit/browser"

describe("Promised", () => {
  describe("await()", () => {
    it("awaits all promises in parallel", async () => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ]

      const results = await Promised.await(promises)
      assert.deepEqual(results, [1, 2, 3])
    })

    it("rejects if any promise rejects", async () => {
      const promises = [
        Promise.resolve(1),
        Promise.reject(new Error("Test error")),
        Promise.resolve(3)
      ]

      await assert.rejects(
        () => Promised.await(promises),
        /Test error/
      )
    })

    it("handles empty array (await)", async () => {
      const results = await Promised.await([])
      assert.deepEqual(results, [])
    })

    it("preserves order of results", async () => {
      const promises = [
        Promise.resolve("first"),
        Promise.resolve("second"),
        Promise.resolve("third")
      ]

      const results = await Promised.await(promises)
      assert.deepEqual(results, ["first", "second", "third"])
    })

    it("works with mixed value types", async () => {
      const promises = [
        Promise.resolve(42),
        Promise.resolve("string"),
        Promise.resolve(true),
        Promise.resolve(null),
        Promise.resolve({key: "value"})
      ]

      const results = await Promised.await(promises)
      assert.equal(results[0], 42)
      assert.equal(results[1], "string")
      assert.equal(results[2], true)
      assert.equal(results[3], null)
      assert.deepEqual(results[4], {key: "value"})
    })
  })

  describe("settle()", () => {
    it("settles all promises regardless of outcome", async () => {
      const promises = [
        Promise.resolve("success"),
        Promise.reject(new Error("failure")),
        Promise.resolve(42)
      ]

      const results = await Promised.settle(promises)

      assert.equal(results.length, 3)
      assert.equal(results[0].status, "fulfilled")
      assert.equal(results[0].value, "success")
      assert.equal(results[1].status, "rejected")
      assert.ok(results[1].reason instanceof Error)
      assert.equal(results[2].status, "fulfilled")
      assert.equal(results[2].value, 42)
    })

    it("handles all fulfilled promises", async () => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ]

      const results = await Promised.settle(promises)

      assert.equal(results.length, 3)
      assert.ok(results.every(r => r.status === "fulfilled"))
      assert.deepEqual(results.map(r => r.value), [1, 2, 3])
    })

    it("handles all rejected promises", async () => {
      const promises = [
        Promise.reject(new Error("error1")),
        Promise.reject(new Error("error2")),
        Promise.reject(new Error("error3"))
      ]

      const results = await Promised.settle(promises)

      assert.equal(results.length, 3)
      assert.ok(results.every(r => r.status === "rejected"))
      assert.ok(results.every(r => r.reason instanceof Error))
    })

    it("handles empty array (settle)", async () => {
      const results = await Promised.settle([])
      assert.deepEqual(results, [])
    })
  })

  describe("hasRejected()", () => {
    it("returns true when any promise is rejected", async () => {
      const settled = await Promised.settle([
        Promise.resolve(1),
        Promise.reject(new Error("fail")),
        Promise.resolve(3)
      ])

      assert.equal(Promised.hasRejected(settled), true)
    })

    it("returns false when all promises are fulfilled", async () => {
      const settled = await Promised.settle([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ])

      assert.equal(Promised.hasRejected(settled), false)
    })

    it("returns true when all promises are rejected", async () => {
      const settled = await Promised.settle([
        Promise.reject(new Error("fail1")),
        Promise.reject(new Error("fail2"))
      ])

      assert.equal(Promised.hasRejected(settled), true)
    })

    it("returns false for empty array (hasRejected)", () => {
      assert.equal(Promised.hasRejected([]), false)
    })
  })

  describe("hasFulfilled()", () => {
    it("returns true when any promise is fulfilled", async () => {
      const settled = await Promised.settle([
        Promise.reject(new Error("fail")),
        Promise.resolve(2),
        Promise.reject(new Error("fail2"))
      ])

      assert.equal(Promised.hasFulfilled(settled), true)
    })

    it("returns false when all promises are rejected", async () => {
      const settled = await Promised.settle([
        Promise.reject(new Error("fail1")),
        Promise.reject(new Error("fail2"))
      ])

      assert.equal(Promised.hasFulfilled(settled), false)
    })

    it("returns true when all promises are fulfilled", async () => {
      const settled = await Promised.settle([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ])

      assert.equal(Promised.hasFulfilled(settled), true)
    })

    it("returns false for empty array (hasFulfilled)", () => {
      assert.equal(Promised.hasFulfilled([]), false)
    })
  })

  describe("rejected()", () => {
    it("filters only rejected results", async () => {
      const settled = await Promised.settle([
        Promise.resolve("ok"),
        Promise.reject(new Error("fail1")),
        Promise.resolve(42),
        Promise.reject(new Error("fail2"))
      ])

      const rejected = Promised.rejected(settled)

      assert.equal(rejected.length, 2)
      assert.ok(rejected.every(r => r.status === "rejected"))
      assert.ok(rejected[0].reason instanceof Error)
      assert.equal(rejected[0].reason.message, "fail1")
      assert.equal(rejected[1].reason.message, "fail2")
    })

    it("returns empty array when all promises fulfilled (rejected)", async () => {
      const settled = await Promised.settle([
        Promise.resolve(1),
        Promise.resolve(2)
      ])

      const rejected = Promised.rejected(settled)
      assert.deepEqual(rejected, [])
    })

    it("returns all results when all promises rejected (rejected)", async () => {
      const settled = await Promised.settle([
        Promise.reject(new Error("fail1")),
        Promise.reject(new Error("fail2"))
      ])

      const rejected = Promised.rejected(settled)
      assert.equal(rejected.length, 2)
    })

    it("returns empty array for empty input (rejected)", () => {
      assert.deepEqual(Promised.rejected([]), [])
    })
  })

  describe("fulfilled()", () => {
    it("filters only fulfilled results", async () => {
      const settled = await Promised.settle([
        Promise.resolve("ok"),
        Promise.reject(new Error("fail")),
        Promise.resolve(42)
      ])

      const fulfilled = Promised.fulfilled(settled)

      assert.equal(fulfilled.length, 2)
      assert.ok(fulfilled.every(r => r.status === "fulfilled"))
      assert.equal(fulfilled[0].value, "ok")
      assert.equal(fulfilled[1].value, 42)
    })

    it("returns empty array when all promises rejected (fulfilled)", async () => {
      const settled = await Promised.settle([
        Promise.reject(new Error("fail1")),
        Promise.reject(new Error("fail2"))
      ])

      const fulfilled = Promised.fulfilled(settled)
      assert.deepEqual(fulfilled, [])
    })

    it("returns all results when all promises fulfilled (fulfilled)", async () => {
      const settled = await Promised.settle([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ])

      const fulfilled = Promised.fulfilled(settled)
      assert.equal(fulfilled.length, 3)
    })

    it("returns empty array for empty input (fulfilled)", () => {
      assert.deepEqual(Promised.fulfilled([]), [])
    })
  })

  describe("reasons()", () => {
    it("extracts rejection reasons from settled promises", async () => {
      const settled = await Promised.settle([
        Promise.resolve("ok"),
        Promise.reject(new Error("fail1")),
        Promise.resolve(42),
        Promise.reject(new Error("fail2"))
      ])

      const reasons = Promised.reasons(settled)

      assert.equal(reasons.length, 2)
      assert.ok(reasons[0] instanceof Error)
      assert.equal(reasons[0].message, "fail1")
      assert.equal(reasons[1].message, "fail2")
    })

    it("returns empty array when all promises fulfilled (reasons)", async () => {
      const settled = await Promised.settle([
        Promise.resolve(1),
        Promise.resolve(2)
      ])

      const reasons = Promised.reasons(settled)
      assert.deepEqual(reasons, [])
    })

    it("extracts all reasons when all promises rejected (reasons)", async () => {
      const settled = await Promised.settle([
        Promise.reject(new Error("fail1")),
        Promise.reject(new Error("fail2")),
        Promise.reject(new Error("fail3"))
      ])

      const reasons = Promised.reasons(settled)
      assert.equal(reasons.length, 3)
      assert.deepEqual(
        reasons.map(r => r.message),
        ["fail1", "fail2", "fail3"]
      )
    })

    it("handles non-Error rejection reasons", async () => {
      const settled = await Promised.settle([
        Promise.reject("string error"),
        Promise.reject(42),
        Promise.reject({custom: "error"})
      ])

      const reasons = Promised.reasons(settled)
      assert.equal(reasons.length, 3)
      assert.equal(reasons[0], "string error")
      assert.equal(reasons[1], 42)
      assert.deepEqual(reasons[2], {custom: "error"})
    })

    it("returns empty array for empty input (reasons)", () => {
      assert.deepEqual(Promised.reasons([]), [])
    })
  })

  describe("values()", () => {
    it("extracts values from fulfilled promises", async () => {
      const settled = await Promised.settle([
        Promise.resolve("ok"),
        Promise.reject(new Error("fail")),
        Promise.resolve(42),
        Promise.resolve(true)
      ])

      const values = Promised.values(settled)

      assert.equal(values.length, 3)
      assert.deepEqual(values, ["ok", 42, true])
    })

    it("returns empty array when all promises rejected (values)", async () => {
      const settled = await Promised.settle([
        Promise.reject(new Error("fail1")),
        Promise.reject(new Error("fail2"))
      ])

      const values = Promised.values(settled)
      assert.deepEqual(values, [])
    })

    it("extracts all values when all promises fulfilled (values)", async () => {
      const settled = await Promised.settle([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ])

      const values = Promised.values(settled)
      assert.deepEqual(values, [1, 2, 3])
    })

    it("handles various value types", async () => {
      const settled = await Promised.settle([
        Promise.resolve(null),
        Promise.resolve(undefined),
        Promise.resolve(""),
        Promise.resolve(0),
        Promise.resolve(false)
      ])

      const values = Promised.values(settled)
      assert.equal(values.length, 5)
      assert.equal(values[0], null)
      assert.equal(values[1], undefined)
      assert.equal(values[2], "")
      assert.equal(values[3], 0)
      assert.equal(values[4], false)
    })

    it("returns empty array for empty input (values)", () => {
      assert.deepEqual(Promised.values([]), [])
    })
  })

  describe("throw()", () => {
    it("throws Tantrum with rejection reasons", async () => {
      const settled = await Promised.settle([
        Promise.resolve("ok"),
        Promise.reject(new Error("fail1")),
        Promise.reject(new Error("fail2"))
      ])

      assert.throws(
        () => Promised.throw("Multiple failures", settled),
        (error) => {
          assert.ok(error instanceof Tantrum)
          assert.equal(error.message, "Multiple failures")
          assert.equal(error.errors.length, 2)
          return true
        }
      )
    })

    it("uses default message 'GIGO' when not provided", async () => {
      const settled = await Promised.settle([
        Promise.reject(new Error("fail"))
      ])

      assert.throws(
        () => Promised.throw(undefined, settled),
        (error) => {
          assert.ok(error instanceof Tantrum)
          assert.equal(error.message, "GIGO")
          return true
        }
      )
    })

    it("throws even when only one rejection", async () => {
      const settled = await Promised.settle([
        Promise.resolve(1),
        Promise.reject(new Error("single failure"))
      ])

      assert.throws(
        () => Promised.throw("Failed", settled),
        (error) => {
          assert.ok(error instanceof Tantrum)
          assert.equal(error.errors.length, 1)
          assert.equal(error.errors[0].message, "single failure")
          return true
        }
      )
    })

    it("throws with custom message", async () => {
      const settled = await Promised.settle([
        Promise.reject(new Error("fail"))
      ])

      assert.throws(
        () => Promised.throw("Custom error message", settled),
        (error) => {
          assert.equal(error.message, "Custom error message")
          return true
        }
      )
    })
  })

  describe("race()", () => {
    it("returns first resolved promise", async () => {
      const promises = [
        new Promise(resolve => setTimeout(() => resolve("slow"), 100)),
        Promise.resolve("fast"),
        new Promise(resolve => setTimeout(() => resolve("medium"), 50))
      ]

      const result = await Promised.race(promises)
      assert.equal(result, "fast")
    })

    it("rejects with first rejection", async () => {
      const promises = [
        new Promise((_, reject) => setTimeout(() => reject(new Error("slow error")), 100)),
        Promise.reject(new Error("fast error")),
        Promise.resolve("success")
      ]

      await assert.rejects(
        () => Promised.race(promises),
        /fast error/
      )
    })

    it("handles single promise", async () => {
      const result = await Promised.race([Promise.resolve("only")])
      assert.equal(result, "only")
    })
  })

  describe("integration scenarios", () => {
    it("settles, filters, and extracts values in pipeline", async () => {
      const promises = [
        Promise.resolve(1),
        Promise.reject(new Error("skip this")),
        Promise.resolve(2),
        Promise.reject(new Error("skip that")),
        Promise.resolve(3)
      ]

      const settled = await Promised.settle(promises)
      const values = Promised.values(settled)

      assert.deepEqual(values, [1, 2, 3])
    })

    it("settles, checks for rejections, and extracts reasons", async () => {
      const promises = [
        Promise.resolve("ok"),
        Promise.reject(new Error("problem1")),
        Promise.reject(new Error("problem2"))
      ]

      const settled = await Promised.settle(promises)

      assert.equal(Promised.hasRejected(settled), true)

      const reasons = Promised.reasons(settled)
      assert.equal(reasons.length, 2)
      assert.deepEqual(
        reasons.map(r => r.message),
        ["problem1", "problem2"]
      )
    })

    it("handles complex async workflows", async () => {
      const fetchData = (id, shouldFail = false) =>
        new Promise((resolve, reject) =>
          setTimeout(
            () => shouldFail
              ? reject(new Error(`Failed to fetch ${id}`))
              : resolve({id, data: `data-${id}`}),
            Math.random() * 10
          )
        )

      const promises = [
        fetchData(1),
        fetchData(2, true),
        fetchData(3),
        fetchData(4, true),
        fetchData(5)
      ]

      const settled = await Promised.settle(promises)

      const successfulData = Promised.values(settled)
      const failures = Promised.reasons(settled)

      assert.equal(successfulData.length, 3)
      assert.equal(failures.length, 2)
      assert.ok(successfulData.every(item => item.data.startsWith("data-")))
      assert.ok(failures.every(err => err.message.startsWith("Failed to fetch")))
    })
  })
})
