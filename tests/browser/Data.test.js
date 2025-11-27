import assert from "node:assert/strict"
import {describe,it} from "node:test"

import {Data,Type,Collection} from "@gesslar/toolkit/browser"

describe("Data", () => {
  describe("static properties", () => {
    it("has correct primitive types", () => {
      const expected = ["Bigint", "Boolean", "Class", "Null", "Number", "String", "Symbol", "Undefined", "Function", "Object"]
      assert.deepEqual(Data.primitives, expected)
      assert.ok(Object.isFrozen(Data.primitives))
    })

    it("has correct constructor types", () => {
      const expected = [
        "Array", "Date", "Error", "Float32Array", "Float64Array", "Function", "Int8Array", "Map",
        "Object", "Promise", "RegExp", "Set", "Uint8Array", "WeakMap", "WeakSet"
      ]
      assert.deepEqual(Data.constructors, expected)
      assert.ok(Object.isFrozen(Data.constructors))
    })

    it("combines primitives and constructors in dataTypes", () => {
      const expectedLength = Data.primitives.length + Data.constructors.length
      assert.equal(Data.dataTypes.length, expectedLength)
      assert.ok(Data.dataTypes.includes("String"))
      assert.ok(Data.dataTypes.includes("Array"))
      assert.ok(Object.isFrozen(Data.dataTypes))
    })

    it("has correct emptyable types", () => {
      const expected = ["String", "Array", "Object"]
      assert.deepEqual(Data.emptyableTypes, expected)
      assert.ok(Object.isFrozen(Data.emptyableTypes))
    })
  })

  describe("string utilities", () => {
    it("appendString adds suffix if not present", () => {
      assert.equal(Data.appendString("hello", "!"), "hello!")
      assert.equal(Data.appendString("hello!", "!"), "hello!") // no duplicate
      assert.equal(Data.appendString("", "test"), "test")
    })

    it("prependString adds prefix if not present", () => {
      assert.equal(Data.prependString("world", "hello "), "hello world")
      assert.equal(Data.prependString("hello world", "hello "), "hello world") // no duplicate
      assert.equal(Data.prependString("", "test"), "test")
    })
  })


  describe("object utilities", () => {

    it("assureObjectPath creates nested structure", () => {
      const obj = {}
      const result = Collection.assureObjectPath(obj, ["a", "b", "c"])

      assert.deepEqual(obj, { a: { b: { c: {} } } })
      assert.strictEqual(result, obj.a.b.c)
    })

    it("setNestedValue sets deep property values", () => {
      const obj = {}
      Collection.setNestedValue(obj, ["a", "b", "c"], "value")

      assert.deepEqual(obj, { a: { b: { c: "value" } } })

      // Update existing path
      Collection.setNestedValue(obj, ["a", "b", "d"], "other")
      assert.equal(obj.a.b.d, "other")
    })

    it("assureObjectPath prevents prototype pollution", () => {
      const obj = {}
      assert.throws(() => Collection.assureObjectPath(obj, ["__proto__", "polluted"]), /don't pee in your pool/)
      assert.throws(() => Collection.assureObjectPath(obj, ["constructor", "polluted"]), /don't pee in your pool/)
      assert.throws(() => Collection.assureObjectPath(obj, ["prototype", "polluted"]), /don't pee in your pool/)
    })

    it("setNestedValue prevents prototype pollution", () => {
      const obj = {}
      assert.throws(() => Collection.setNestedValue(obj, ["__proto__", "polluted"], "value"), /don't pee in your pool/)
      assert.throws(() => Collection.setNestedValue(obj, ["constructor", "polluted"], "value"), /don't pee in your pool/)
      assert.throws(() => Collection.setNestedValue(obj, ["prototype", "polluted"], "value"), /don't pee in your pool/)
    })

    it("mergeObject deeply merges objects", () => {
      const obj1 = { a: 1, b: { c: 2, d: 3 } }
      const obj2 = { b: { c: 4, e: 5 }, f: 6 }
      const result = Data.mergeObject(obj1, obj2)

      const expected = { a: 1, b: { c: 4, d: 3, e: 5 }, f: 6 }
      assert.deepEqual(result, expected)

      // Arrays are replaced, not merged
      const arr1 = { a: [1, 2] }
      const arr2 = { a: [3, 4] }
      assert.deepEqual(Data.mergeObject(arr1, arr2), { a: [3, 4] })
    })

    it("deepFreezeObject recursively freezes", () => {
      const obj = { a: 1, b: { c: 2, d: [3, 4] } }
      const frozen = Data.deepFreezeObject(obj)

      assert.strictEqual(frozen, obj) // same reference
      assert.ok(Object.isFrozen(obj))
      assert.ok(Object.isFrozen(obj.b))
      assert.ok(Object.isFrozen(obj.b.d))
    })
  })



  describe("type checking", () => {
    it("newTypeSpec creates TypeSpec instances", () => {
      const spec = Data.newTypeSpec("string|number[]")
      assert.ok(spec instanceof Type)
      assert.equal(spec.stringRepresentation, "String|Number[]")
    })

    it("isType delegates to TypeSpec.match", () => {
      assert.equal(Data.isType("hello", "string"), true)
      assert.equal(Data.isType(123, "string"), false)
      assert.equal(Data.isType([1, 2, 3], "number[]"), true)
      assert.equal(Data.isType([], "string[]", { allowEmpty: false }), false)
    })

    it("isValidType checks against dataTypes list", () => {
      assert.equal(Data.isValidType("String"), true)
      assert.equal(Data.isValidType("Array"), true)
      assert.equal(Data.isValidType("invalidtype"), false)
      assert.equal(Data.isValidType(""), false)
    })

    it("isBaseType checks primitive/constructor types only", () => {
      assert.equal(Data.isBaseType("hello", "String"), true)
      assert.equal(Data.isBaseType([1, 2], "Array"), true)
      assert.equal(Data.isBaseType({}, "Object"), true)
      assert.equal(Data.isBaseType(null, "Object"), false) // null excluded
      assert.equal(Data.isBaseType(NaN, "Number"), false) // NaN excluded
      assert.equal(Data.isBaseType(null, "Null"), true)
    })

    it("typeOf returns enhanced typeof", () => {
      assert.equal(Data.typeOf("hello"), "String")
      assert.equal(Data.typeOf([]), "Array") // enhanced for arrays
      assert.equal(Data.typeOf({}), "Object")
      assert.equal(Data.typeOf(null), "Null") // enhanced to distinguish null from object
      assert.equal(Data.typeOf(new RegExp), "RegExp") // enhanced to distinguish null from object
    })
  })

  describe("emptiness and nullability", () => {
    it("isNothing checks for null/undefined", () => {
      assert.equal(Data.isNothing(null), true)
      assert.equal(Data.isNothing(undefined), true)
      assert.equal(Data.isNothing(0), false)
      assert.equal(Data.isNothing(""), false)
      assert.equal(Data.isNothing(false), false)
    })

    it("isEmpty checks various empty states", () => {
      // With checkForNothing (default true)
      assert.equal(Data.isEmpty(null), true)
      assert.equal(Data.isEmpty(undefined), true)
      assert.equal(Data.isEmpty(""), true)
      assert.equal(Data.isEmpty("   "), true) // whitespace-only
      assert.equal(Data.isEmpty([]), true)
      assert.equal(Data.isEmpty({}), true)

      // Non-empty values
      assert.equal(Data.isEmpty("hello"), false)
      assert.equal(Data.isEmpty([1]), false)
      assert.equal(Data.isEmpty({ a: 1 }), false)
      assert.equal(Data.isEmpty(0), false) // number not emptyable

      // Without checkForNothing
      assert.equal(Data.isEmpty(null, false), false)
      assert.equal(Data.isEmpty(undefined, false), false)
    })
  })

  describe("utility functions", () => {
    it("asyncFilter filters arrays with async predicate", async () => {
      const arr = [1, 2, 3, 4, 5]
      const isEven = async (x) => x % 2 === 0
      const result = await Data.asyncFilter(arr, isEven)

      assert.deepEqual(result, [2, 4])
    })

    it("clamp constrains values to range", () => {
      assert.equal(Data.clamp(5, 1, 10), 5)
      assert.equal(Data.clamp(-5, 1, 10), 1)
      assert.equal(Data.clamp(15, 1, 10), 10)
    })

    it("clamped checks if value is in range", () => {
      assert.equal(Data.clamped(5, 1, 10), true)
      assert.equal(Data.clamped(1, 1, 10), true) // inclusive
      assert.equal(Data.clamped(10, 1, 10), true) // inclusive
      assert.equal(Data.clamped(0, 1, 10), false)
      assert.equal(Data.clamped(11, 1, 10), false)
    })

    it("isPlainObject identifies plain objects correctly", () => {
      // Plain objects should return true
      assert.equal(Data.isPlainObject({}), true)
      assert.equal(Data.isPlainObject(new Object()), true)
      assert.equal(Data.isPlainObject(Object.create(null)), true)
      assert.equal(Data.isPlainObject({a: 1, b: 2}), true)
      assert.equal(Data.isPlainObject({nested: {object: true}}), true)

      // Non-object types should return false
      assert.equal(Data.isPlainObject(null), false)
      assert.equal(Data.isPlainObject(undefined), false)
      assert.equal(Data.isPlainObject("string"), false)
      assert.equal(Data.isPlainObject(123), false)
      assert.equal(Data.isPlainObject(true), false)
      assert.equal(Data.isPlainObject(Symbol("test")), false)
      assert.equal(Data.isPlainObject(BigInt(123)), false)

      // Built-in objects should return false
      assert.equal(Data.isPlainObject([]), false)
      assert.equal(Data.isPlainObject([1, 2, 3]), false)
      assert.equal(Data.isPlainObject(new Date()), false)
      assert.equal(Data.isPlainObject(/regex/), false)
      assert.equal(Data.isPlainObject(new RegExp("test")), false)
      assert.equal(Data.isPlainObject(new Error("test")), false)
      assert.equal(Data.isPlainObject(new Map()), false)
      assert.equal(Data.isPlainObject(new Set()), false)
      assert.equal(Data.isPlainObject(new WeakMap()), false)
      assert.equal(Data.isPlainObject(new WeakSet()), false)
      assert.equal(Data.isPlainObject(Promise.resolve()), false)
      assert.equal(Data.isPlainObject(new Int8Array()), false)
      assert.equal(Data.isPlainObject(new Float32Array()), false)

      // Functions should return false
      assert.equal(Data.isPlainObject(function() {}), false)
      assert.equal(Data.isPlainObject(() => {}), false)
      assert.equal(Data.isPlainObject(async function() {}), false)
      assert.equal(Data.isPlainObject(function* generator() {}), false)

      // Custom constructor instances should return false
      class CustomClass {
        constructor() {
          this.prop = "value"
        }
      }
      assert.equal(Data.isPlainObject(new CustomClass()), false)

      // Objects with custom prototypes should return false
      const proto = { customProto: true }
      const customObj = Object.create(proto)
      assert.equal(Data.isPlainObject(customObj), false)

      // Edge case: Object.create(Object.prototype) should be plain
      assert.equal(Data.isPlainObject(Object.create(Object.prototype)), true)
    })

    it("isPlainObject handles edge cases and complex prototype chains", () => {
      // Test objects created with Object.setPrototypeOf
      const obj1 = {}
      Object.setPrototypeOf(obj1, { custom: true })
      assert.equal(Data.isPlainObject(obj1), false)

      // Test objects with null prototype are considered plain
      const nullProtoObj = Object.create(null)
      nullProtoObj.prop = "value"
      assert.equal(Data.isPlainObject(nullProtoObj), true)

      // Test deeply nested prototype chain that ends at Object.prototype
      const deepProtoObj = Object.create(Object.prototype)
      assert.equal(Data.isPlainObject(deepProtoObj), true)

      // Test object with multiple prototype levels (should be false)
      const level1 = { level: 1 }
      const level2 = Object.create(level1)
      const level3 = Object.create(level2)
      assert.equal(Data.isPlainObject(level3), false)

      // Test object created via Object.assign
      const assigned = Object.assign({}, { a: 1 })
      assert.equal(Data.isPlainObject(assigned), true)

      // Test frozen objects (should still be plain if originally plain)
      const frozenPlain = Object.freeze({ a: 1 })
      assert.equal(Data.isPlainObject(frozenPlain), true)

      const frozenCustom = Object.freeze(new Date())
      assert.equal(Data.isPlainObject(frozenCustom), false)
    })
  })

  describe("edge cases and error handling", () => {
    it("handles null/undefined inputs gracefully", () => {
      assert.equal(Data.typeOf(null), "Null")
      assert.equal(Data.typeOf(undefined), "Undefined")
      assert.equal(Data.deepFreezeObject(null), null)
      assert.equal(Data.deepFreezeObject("not object"), "not object")
    })

  })
})
