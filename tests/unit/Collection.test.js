#!/usr/bin/env node

import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { Collection } from "../../src/index.js"

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
  })
})
