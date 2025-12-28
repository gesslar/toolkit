#!/usr/bin/env node

import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { Collection, Sass } from "@gesslar/toolkit/browser"

describe("Collection", () => {
  describe("evalArray()", () => {
    it("handles normal cases", () => {
      const array = [1, 2, 3, 4, 5]
      const result = Collection.evalArray(array, n => n > 3 ? n * 2 : null)
      assert.equal(result, 8) // 4 * 2 = 8
    })

    it("returns undefined when no match found", () => {
      const array = [1, 2, 3]
      const result = Collection.evalArray(array, n => n > 5 ? n : null)
      assert.equal(result, undefined)
    })

    it("handles empty arrays", () => {
      const result = Collection.evalArray([], n => n > 0 ? n : null)
      assert.equal(result, undefined)
    })

    it("validates input types", () => {
      assert.throws(() => Collection.evalArray("not array", () => {}), /Invalid type/)
      assert.throws(() => Collection.evalArray([], "not function"), /Invalid type/)
    })

    it("passes correct arguments to predicate", () => {
      const array = ["a", "b", "c"]
      let capturedArgs = []

      Collection.evalArray(array, (element, index, arr) => {
        capturedArgs.push([element, index, arr])
        return null
      })

      assert.deepEqual(capturedArgs[0], ["a", 0, array])
      assert.deepEqual(capturedArgs[1], ["b", 1, array])
      assert.deepEqual(capturedArgs[2], ["c", 2, array])
    })

    it("supports forward iteration (default)", () => {
      const array = [1, 2, 3, 4]
      const results = []

      Collection.evalArray(array, n => {
        results.push(n)
        return n === 2 ? "found" : null
      })

      assert.deepEqual(results, [1, 2])
    })

    it("supports backward iteration", () => {
      const array = [1, 2, 3, 4]
      const results = []

      Collection.evalArray(array, n => {
        results.push(n)
        return n === 3 ? "found" : null
      }, false)

      assert.deepEqual(results, [4, 3])
    })
  })

  describe("evalObject()", () => {
    it("handles normal cases", () => {
      const obj = {a: 1, b: 2, c: 3}
      const result = Collection.evalObject(obj, (value, key) => value > 2 ? `${key}:${value}` : null)
      assert.equal(result, "c:3")
    })

    it("returns undefined when no match found", () => {
      const obj = {a: 1, b: 2}
      const result = Collection.evalObject(obj, value => value > 5 ? value : null)
      assert.equal(result, undefined)
    })

    it("handles empty objects", () => {
      const result = Collection.evalObject({}, value => value > 0 ? value : null)
      assert.equal(result, undefined)
    })

    it("validates input types", () => {
      assert.throws(() => Collection.evalObject("not object", () => {}), /Invalid type/)
      assert.throws(() => Collection.evalObject({}, "not function"), /Invalid type/)
    })

    it("passes correct arguments to predicate", () => {
      const obj = {x: 10, y: 20}
      let capturedArgs = []

      Collection.evalObject(obj, (value, key, object) => {
        capturedArgs.push([value, key, object])
        return null
      })

      assert.deepEqual(capturedArgs[0], [10, "x", obj])
      assert.deepEqual(capturedArgs[1], [20, "y", obj])
    })
  })

  describe("evalSet()", () => {
    it("handles normal cases", () => {
      const set = new Set([1, 2, 3, 4, 5])
      const result = Collection.evalSet(set, n => n > 3 ? n * 2 : null)
      assert.equal(result, 8) // 4 * 2 = 8
    })

    it("returns undefined when no match found", () => {
      const set = new Set([1, 2, 3])
      const result = Collection.evalSet(set, n => n > 5 ? n : null)
      assert.equal(result, undefined)
    })

    it("handles empty sets", () => {
      const result = Collection.evalSet(new Set(), n => n > 0 ? n : null)
      assert.equal(result, undefined)
    })

    it("validates input types", () => {
      assert.throws(() => Collection.evalSet("not set", () => {}), /Invalid type/)
      assert.throws(() => Collection.evalSet(new Set(), "not function"), /Invalid type/)
    })

    it("passes correct arguments to predicate", () => {
      const set = new Set(["a", "b"])
      let capturedArgs = []

      Collection.evalSet(set, (element, setRef) => {
        capturedArgs.push([element, setRef])
        return null
      })

      assert.equal(capturedArgs.length, 2)
      assert.ok(capturedArgs[0][1] === set)
      assert.ok(capturedArgs[1][1] === set)
    })
  })

  describe("evalMap()", () => {
    it("handles normal cases", () => {
      const map = new Map([['a', 1], ['b', 2], ['c', 3]])
      const result = Collection.evalMap(map, (value, key) => value > 2 ? `${key}:${value}` : null)
      assert.equal(result, "c:3")
    })

    it("returns undefined when no match found", () => {
      const map = new Map([['a', 1], ['b', 2]])
      const result = Collection.evalMap(map, value => value > 5 ? value : null)
      assert.equal(result, undefined)
    })

    it("handles empty maps", () => {
      const result = Collection.evalMap(new Map(), value => value > 0 ? value : null)
      assert.equal(result, undefined)
    })

    it("validates input types", () => {
      assert.throws(() => Collection.evalMap("not map", () => {}), /Invalid type/)
      assert.throws(() => Collection.evalMap(new Map(), "not function"), /Invalid type/)
    })

    it("passes correct arguments to predicate", () => {
      const map = new Map([['x', 10], ['y', 20]])
      let capturedArgs = []

      Collection.evalMap(map, (value, key, mapRef) => {
        capturedArgs.push([value, key, mapRef])
        return null
      })

      assert.deepEqual(capturedArgs[0], [10, "x", map])
      assert.deepEqual(capturedArgs[1], [20, "y", map])
    })

    it("supports forward iteration (default)", () => {
      const map = new Map([['a', 1], ['b', 2], ['c', 3]])
      const results = []

      Collection.evalMap(map, (value, key) => {
        results.push(key)
        return value === 2 ? "found" : null
      })

      assert.deepEqual(results, ["a", "b"])
    })

    it("supports backward iteration", () => {
      const map = new Map([['a', 1], ['b', 2], ['c', 3]])
      const results = []

      Collection.evalMap(map, (value, key) => {
        results.push(key)
        return value === 2 ? "found" : null
      }, false)

      assert.deepEqual(results, ["c", "b"])
    })
  })

  describe("zip()", () => {
    it("zips arrays of equal length", () => {
      const result = Collection.zip([1, 2, 3], ['a', 'b', 'c'])
      assert.deepEqual(result, [[1, 'a'], [2, 'b'], [3, 'c']])
    })

    it("zips arrays of unequal length", () => {
      const result = Collection.zip([1, 2, 3, 4], ['a', 'b'])
      assert.deepEqual(result, [[1, 'a'], [2, 'b']])
    })

    it("handles empty arrays", () => {
      const result = Collection.zip([], [])
      assert.deepEqual(result, [])
    })

    it("handles one empty array", () => {
      const result = Collection.zip([1, 2], [])
      assert.deepEqual(result, [])
    })
  })

  describe("unzip()", () => {
    it("unzips arrays correctly", () => {
      const zipped = [[1, 'a'], [2, 'b'], [3, 'c']]
      const result = Collection.unzip(zipped)
      assert.deepEqual(result, [[1, 2, 3], ['a', 'b', 'c']])
    })

    it("handles empty input", () => {
      const result = Collection.unzip([])
      assert.deepEqual(result, [])
    })

    it("handles invalid input", () => {
      const result = Collection.unzip("not array")
      assert.deepEqual(result, [])
    })

    it("handles jagged arrays", () => {
      const zipped = [[1, 2], [3], [4, 5, 6]]
      const result = Collection.unzip(zipped)
      assert.deepEqual(result, [[1, 3, 4], [2, undefined, 5], [undefined, undefined, 6]])
    })
  })

  describe("asyncMap()", () => {
    it("handles normal async cases", async () => {
      const array = [1, 2, 3]
      const result = await Collection.asyncMap(array, async (n) => {
        await new Promise(resolve => setTimeout(resolve, 1))
        return n * 2
      })
      assert.deepEqual(result, [2, 4, 6])
    })

    it("executes operations sequentially", async () => {
      const array = [100, 50, 25]
      const execution = []

      await Collection.asyncMap(array, async (ms) => {
        execution.push(`start-${ms}`)
        await new Promise(resolve => setTimeout(resolve, ms))
        execution.push(`end-${ms}`)
        return ms
      })

      // If sequential, we should see start-100, end-100, start-50, end-50, start-25, end-25
      assert.deepEqual(execution, [
        'start-100', 'end-100', 'start-50', 'end-50', 'start-25', 'end-25'
      ])
    })

    it("works with sync functions", async () => {
      const array = [1, 2, 3]
      const result = await Collection.asyncMap(array, (n) => n * 2)
      assert.deepEqual(result, [2, 4, 6])
    })

    it("handles empty arrays", async () => {
      const result = await Collection.asyncMap([], async (n) => n * 2)
      assert.deepEqual(result, [])
    })

    it("validates input types", async () => {
      await assert.rejects(
        () => Collection.asyncMap("not array", async () => {}),
        /Invalid type.*Expected Array/
      )
      await assert.rejects(
        () => Collection.asyncMap([], "not function"),
        /Invalid type.*Expected Function/
      )
    })

    it("handles null and undefined inputs", async () => {
      await assert.rejects(
        () => Collection.asyncMap(null, async () => {}),
        /Invalid type.*Expected Array/
      )
      await assert.rejects(
        () => Collection.asyncMap(undefined, async () => {}),
        /Invalid type.*Expected Array/
      )
    })

    it("preserves order of results", async () => {
      const array = [3, 1, 4, 1, 5]
      const result = await Collection.asyncMap(array, async (n) => {
        // Longer delays for smaller numbers to test order preservation
        await new Promise(resolve => setTimeout(resolve, (10 - n) * 10))
        return n * 10
      })
      assert.deepEqual(result, [30, 10, 40, 10, 50])
    })

    it("handles async errors appropriately", async () => {
      const array = [1, 2, 3]

      await assert.rejects(
        () => Collection.asyncMap(array, async (n) => {
          if (n === 2) throw new Error("Test error")
          return n * 2
        }),
        /Test error/
      )
    })

    it("stops execution on first error", async () => {
      const array = [1, 2, 3, 4]
      const processed = []

      try {
        await Collection.asyncMap(array, async (n) => {
          processed.push(n)
          if (n === 2) throw new Error("Test error")
          return n * 2
        })
        assert.fail("Should have thrown")
      } catch (error) {
        assert.equal(error.message, "Test error")
        // Should have processed items 1 and 2, but not 3 and 4
        assert.deepEqual(processed, [1, 2])
      }
    })

    it("handles complex objects", async () => {
      const users = [
        {id: 1, name: "Alice"},
        {id: 2, name: "Bob"},
        {id: 3, name: "Charlie"}
      ]

      const result = await Collection.asyncMap(users, async (user) => {
        await new Promise(resolve => setTimeout(resolve, 1))
        return {
          ...user,
          name: user.name.toUpperCase(),
          processed: true
        }
      })

      assert.deepEqual(result, [
        {id: 1, name: "ALICE", processed: true},
        {id: 2, name: "BOB", processed: true},
        {id: 3, name: "CHARLIE", processed: true}
      ])
    })

    it("works with promises that resolve to different types", async () => {
      const array = ["hello", 42, true, null]
      const result = await Collection.asyncMap(array, async (item) => {
        await new Promise(resolve => setTimeout(resolve, 1))
        return typeof item
      })
      assert.deepEqual(result, ["string", "number", "boolean", "object"])
    })

    it("handles large arrays efficiently", async () => {
      const array = Array.from({length: 100}, (_, i) => i)
      const start = Date.now()

      const result = await Collection.asyncMap(array, async (n) => {
        // Very small delay to avoid test timeout
        await new Promise(resolve => setTimeout(resolve, 1))
        return n * 2
      })

      const duration = Date.now() - start
      assert.equal(result.length, 100)
      assert.equal(result[99], 198)
      // Should complete reasonably quickly (allowing for CI variance)
      assert.ok(duration < 5000, `Too slow: ${duration}ms`)
    })
  })

  describe("error scenarios", () => {
    it("handles null and undefined inputs", () => {
      assert.throws(() => Collection.evalArray(null, () => {}), /Invalid type/)
      assert.throws(() => Collection.evalArray(undefined, () => {}), /Invalid type/)
      assert.throws(() => Collection.evalObject(null, () => {}), /Invalid type/)
      assert.throws(() => Collection.evalSet(null, () => {}), /Invalid type/)
      assert.throws(() => Collection.evalMap(null, () => {}), /Invalid type/)
    })

    it("handles complex nested scenarios", () => {
      const complex = {
        users: [
          {id: 1, name: "Alice"},
          {id: 2, name: "Bob"}
        ],
        settings: new Map([['theme', 'dark']])
      }

      // Test nested array evaluation
      const userResult = Collection.evalArray(complex.users, user => user.id === 2 ? user.name : null)
      assert.equal(userResult, "Bob")

      // Test nested map evaluation
      const settingResult = Collection.evalMap(complex.settings, (value, key) => key === 'theme' ? value : null)
      assert.equal(settingResult, "dark")
    })

    it("asyncMap error handling preserves context", async () => {
      const array = [1, 2, 3]

      try {
        await Collection.asyncMap(array, async (n) => {
          if (n === 2) {
            const error = new Error("Original async error")
            error.context = {item: n, step: "processing"}
            throw error
          }
          return n * 2
        })
        assert.fail("Should have thrown")
      } catch (error) {
        assert.equal(error.message, "Original async error")
        assert.deepEqual(error.context, {item: 2, step: "processing"})
      }
    })
  })

  // Migrated array methods from Data.js
  describe("array utilities", () => {
    it("isArrayUniform checks type consistency", () => {
      assert.equal(Collection.isArrayUniform([1, 2, 3]), true)
      assert.equal(Collection.isArrayUniform(["a", "b", "c"]), true)
      assert.equal(Collection.isArrayUniform([1, "a", 3]), false)
      assert.equal(Collection.isArrayUniform([], "string"), true) // empty arrays are uniform
      assert.equal(Collection.isArrayUniform([1, 2, 3], "number"), true)
      assert.equal(Collection.isArrayUniform([1, 2, 3], "string"), false)
    })

    it("isArrayUniform respects strict option for inheritance checking", () => {
      const sass1 = Sass.new("error 1")
      const sass2 = Sass.new("error 2")
      const baseError = new Error("base")

      // Strict mode (default): requires exact type match
      assert.equal(Collection.isArrayUniform([sass1, sass2], "Sass"), true)
      assert.equal(Collection.isArrayUniform([sass1, baseError], "Error"), false)

      // Loose mode: allows inheritance
      assert.equal(Collection.isArrayUniform([sass1, sass2], "Error", {strict: false}), true)
      assert.equal(Collection.isArrayUniform([sass1, baseError], "Error", {strict: false}), true)

      // Parent type doesn't match child requirement
      assert.equal(Collection.isArrayUniform([baseError], "Sass", {strict: false}), false)
    })

    it("isArrayUnique removes duplicates", () => {
      assert.deepEqual(Collection.isArrayUnique([1, 2, 2, 3, 1]), [1, 2, 3])
      assert.deepEqual(Collection.isArrayUnique(["a", "b", "a", "c"]), ["a", "b", "c"])
      assert.deepEqual(Collection.isArrayUnique([]), [])
      assert.deepEqual(Collection.isArrayUnique([1]), [1])
    })

    it("arrayIntersection finds common elements", () => {
      assert.deepEqual(Collection.intersection([1, 2, 3], [2, 3, 4]), [2, 3])
      assert.deepEqual(Collection.intersection([1, 2], [3, 4]), [])
      assert.deepEqual(Collection.intersection([], [1, 2]), [])
      assert.deepEqual(Collection.intersection(["a", "b"], ["b", "c"]), ["b"])
    })

    it("arrayIntersects checks for any common elements", () => {
      assert.equal(Collection.intersects([1, 2, 3], [2, 4, 5]), true)
      assert.equal(Collection.intersects([1, 2], [3, 4]), false)
      assert.equal(Collection.intersects([], [1, 2]), false)
      assert.equal(Collection.intersects(["a"], ["a", "b"]), true)
    })

    it("arrayPad extends array to specified length", () => {
      assert.deepEqual(Collection.arrayPad([1, 2], 4, 0), [0, 0, 1, 2]) // prepend by default
      assert.deepEqual(Collection.arrayPad([1, 2], 4, 0, -1), [1, 2, 0, 0]) // append
      assert.deepEqual(Collection.arrayPad([1, 2, 3], 2, 0), [1, 2, 3]) // no change if already long enough

      assert.throws(() => {
        Collection.arrayPad([1, 2], 4, 0, 1) // invalid position
      }, Sass)
    })

    it("asyncFilter filters arrays with async predicate", async () => {
      const arr = [1, 2, 3, 4, 5]
      const isEven = async (x) => x % 2 === 0
      const result = await Collection.asyncFilter(arr, isEven)

      assert.deepEqual(result, [2, 4])
    })

    it("trimArray removes falsy elements from both ends", () => {
      const arr = [null, 0, 1, 2, "", undefined]
      const trimmed = Collection.trimArray(arr)

      assert.strictEqual(trimmed, arr)
      assert.deepEqual(arr, [1, 2])
    })

    it("trimArrayLeft trims leading falsy values while honoring exceptions", () => {
      const arr = [0, false, 1]

      Collection.trimArrayLeft(arr, [0])

      assert.deepEqual(arr, [0, false, 1])

      const arr2 = [null, undefined, "value"]

      Collection.trimArrayLeft(arr2)

      assert.deepEqual(arr2, ["value"])
    })

    it("trimArrayRight trims trailing falsy values and respects exceptions", () => {
      const arr = [1, "", undefined]

      Collection.trimArrayRight(arr)

      assert.deepEqual(arr, [1])

      const arr2 = [1, "", 0]

      Collection.trimArrayRight(arr2, [0])

      assert.deepEqual(arr2, [1, "", 0])
    })

    it("trimArrayLeft handles empty arrays safely", () => {
      const arr = []

      Collection.trimArrayLeft(arr)

      assert.deepEqual(arr, [])
    })
  })

  describe("flattenObjectArray()", () => {
    it("flattens array of objects into key-value arrays", () => {
      const objects = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 35 }
      ]

      const result = Collection.flattenObjectArray(objects)

      assert.deepEqual(result, {
        name: ['Alice', 'Bob', 'Charlie'],
        age: [25, 30, 35]
      })
    })

    it("handles objects with different keys", () => {
      const objects = [
        { a: 1, b: 2 },
        { a: 3, c: 4 },
        { b: 5, c: 6, d: 7 }
      ]

      const result = Collection.flattenObjectArray(objects)

      assert.deepEqual(result, {
        a: [1, 3],
        b: [2, 5],
        c: [4, 6],
        d: [7]
      })
    })

    it("handles empty objects", () => {
      const objects = [{}, { a: 1 }, {}]

      const result = Collection.flattenObjectArray(objects)

      assert.deepEqual(result, { a: [1] })
    })

    it("handles empty array", () => {
      const result = Collection.flattenObjectArray([])

      assert.deepEqual(result, {})
    })

    it("handles single object", () => {
      const objects = [{ name: 'Test', value: 42 }]

      const result = Collection.flattenObjectArray(objects)

      assert.deepEqual(result, {
        name: ['Test'],
        value: [42]
      })
    })

    it("preserves different value types", () => {
      const objects = [
        { mixed: 'string', num: 1 },
        { mixed: 42, bool: true },
        { mixed: null, obj: { nested: 'value' } }
      ]

      const result = Collection.flattenObjectArray(objects)

      assert.deepEqual(result, {
        mixed: ['string', 42, null],
        num: [1],
        bool: [true],
        obj: [{ nested: 'value' }]
      })
    })

    it("handles duplicate values", () => {
      const objects = [
        { key: 'value1' },
        { key: 'value1' },
        { key: 'value2' }
      ]

      const result = Collection.flattenObjectArray(objects)

      assert.deepEqual(result, {
        key: ['value1', 'value1', 'value2']
      })
    })

    it("flattens nested arrays of objects", () => {
      const objects = [
        [
          { name: 'Alice', age: 25 },
          { name: 'Avery', age: 28 }
        ],
        { name: 'Bob', age: 30 }
      ]

      const result = Collection.flattenObjectArray(objects)

      assert.deepEqual(result, {
        name: ['Alice', 'Avery', 'Bob'],
        age: [25, 28, 30]
      })
    })

    it("treats nested empty arrays as empty input", () => {
      const result = Collection.flattenObjectArray([[]])

      assert.deepEqual(result, {})
    })

    it("validates input types", () => {
      assert.throws(() => Collection.flattenObjectArray(null), /Invalid type/)
      assert.throws(() => Collection.flattenObjectArray("not array"), /Invalid type/)
      assert.throws(() => Collection.flattenObjectArray([new Date()]), /Invalid array element/)
      assert.throws(() => Collection.flattenObjectArray([null]), /Invalid array element/)
      assert.throws(() => Collection.flattenObjectArray([[new Date()]]), /Invalid array element/)
    })

    it("prevents prototype pollution", () => {
      const objects = [
        { name: 'Alice', __proto__: 'polluted' },
        { name: 'Bob', constructor: 'polluted' },
        { name: 'Charlie', prototype: 'polluted' }
      ]

      assert.throws(() => Collection.flattenObjectArray(objects), /don't pee in your pool/)
    })
  })

  describe("transposeObjects()", () => {
    it("transposes object arrays into keyed arrays", () => {
      const objects = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 }
      ]

      const result = Collection.transposeObjects(objects)

      assert.deepEqual(result, {
        name: ['Alice', 'Bob'],
        age: [25, 30]
      })
    })

    it("throws when encountering non-plain objects", () => {
      assert.throws(() => Collection.transposeObjects([new Date()]), /Invalid array element/)
    })
  })
})
