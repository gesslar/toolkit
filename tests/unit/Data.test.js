import assert from "node:assert/strict"
import {describe,it} from "node:test"

import {Data,Sass,Type} from "../../src/index.js"

describe("Data", () => {
  describe("static properties", () => {
    it("has correct primitive types", () => {
      const expected = ["Undefined", "Null", "Boolean", "Number", "Bigint", "String", "Symbol", "Object", "Function"]
      assert.deepEqual(Data.primitives, expected)
      assert.ok(Object.isFrozen(Data.primitives))
    })

    it("has correct constructor types", () => {
      const expected = [
        "Object", "Array", "Function", "Date", "RegExp", "Error", "Map", "Set",
        "WeakMap", "WeakSet", "Promise", "Int8Array", "Uint8Array", "Float32Array", "Float64Array"
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

  describe("array utilities", () => {
    it("isArrayUniform checks type consistency", () => {
      assert.equal(Data.isArrayUniform([1, 2, 3]), true)
      assert.equal(Data.isArrayUniform(["a", "b", "c"]), true)
      assert.equal(Data.isArrayUniform([1, "a", 3]), false)
      assert.equal(Data.isArrayUniform([], "string"), true) // empty arrays are uniform
      assert.equal(Data.isArrayUniform([1, 2, 3], "number"), true)
      assert.equal(Data.isArrayUniform([1, 2, 3], "string"), false)
    })

    it("isArrayUnique removes duplicates", () => {
      assert.deepEqual(Data.isArrayUnique([1, 2, 2, 3, 1]), [1, 2, 3])
      assert.deepEqual(Data.isArrayUnique(["a", "b", "a", "c"]), ["a", "b", "c"])
      assert.deepEqual(Data.isArrayUnique([]), [])
      assert.deepEqual(Data.isArrayUnique([1]), [1])
    })

    it("arrayIntersection finds common elements", () => {
      assert.deepEqual(Data.arrayIntersection([1, 2, 3], [2, 3, 4]), [2, 3])
      assert.deepEqual(Data.arrayIntersection([1, 2], [3, 4]), [])
      assert.deepEqual(Data.arrayIntersection([], [1, 2]), [])
      assert.deepEqual(Data.arrayIntersection(["a", "b"], ["b", "c"]), ["b"])
    })

    it("arrayIntersects checks for any common elements", () => {
      assert.equal(Data.arrayIntersects([1, 2, 3], [2, 4, 5]), true)
      assert.equal(Data.arrayIntersects([1, 2], [3, 4]), false)
      assert.equal(Data.arrayIntersects([], [1, 2]), false)
      assert.equal(Data.arrayIntersects(["a"], ["a", "b"]), true)
    })

    it("arrayPad extends array to specified length", () => {
      assert.deepEqual(Data.arrayPad([1, 2], 4, 0), [0, 0, 1, 2]) // prepend by default
      assert.deepEqual(Data.arrayPad([1, 2], 4, 0, -1), [1, 2, 0, 0]) // append
      assert.deepEqual(Data.arrayPad([1, 2, 3], 2, 0), [1, 2, 3]) // no change if already long enough

      assert.throws(() => {
        Data.arrayPad([1, 2], 4, 0, 1) // invalid position
      }, Sass)
    })
  })

  describe("object utilities", () => {
    it("cloneObject creates deep copies", () => {
      const original = { a: 1, b: { c: 2, d: [3, 4] } }
      const cloned = Data.cloneObject(original)

      assert.deepEqual(cloned, original)
      assert.notStrictEqual(cloned, original)
      assert.notStrictEqual(cloned.b, original.b)

      // Modify original to verify independence
      original.b.c = 99
      assert.equal(cloned.b.c, 2) // unchanged
    })

    it("cloneObject with freeze option", () => {
      const original = { a: 1, b: { c: 2 } }
      const cloned = Data.cloneObject(original, true)

      assert.ok(Object.isFrozen(cloned))
      assert.throws(() => {
        cloned.a = 99
      }, TypeError)
    })

    it("isObjectEmpty checks for empty objects", () => {
      assert.equal(Data.isObjectEmpty({}), true)
      assert.equal(Data.isObjectEmpty({ a: 1 }), false)
      assert.equal(Data.isObjectEmpty({ a: undefined }), false) // still has property
    })

    it("assureObjectPath creates nested structure", () => {
      const obj = {}
      const result = Data.assureObjectPath(obj, ["a", "b", "c"])

      assert.deepEqual(obj, { a: { b: { c: {} } } })
      assert.strictEqual(result, obj.a.b.c)
    })

    it("setNestedValue sets deep property values", () => {
      const obj = {}
      Data.setNestedValue(obj, ["a", "b", "c"], "value")

      assert.deepEqual(obj, { a: { b: { c: "value" } } })

      // Update existing path
      Data.setNestedValue(obj, ["a", "b", "d"], "other")
      assert.equal(obj.a.b.d, "other")
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

  describe("allocateObject", () => {
    it("creates object from source and spec arrays", async () => {
      const source = ["key1", "key2", "key3"]
      const spec = ["value1", "value2", "value3"]
      const result = await Data.allocateObject(source, spec)

      const expected = { key1: "value1", key2: "value2", key3: "value3" }
      assert.deepEqual(result, expected)
    })

    it("works with function spec", async () => {
      const source = [1, 2, 3]
      const specFunc = async (src) => src.map(x => x * 2)
      const result = await Data.allocateObject(source, specFunc)

      const expected = { "1": 2, "2": 4, "3": 6 }
      assert.deepEqual(result, expected)
    })

    it("throws for invalid inputs", async () => {
      await assert.rejects(
        () => Data.allocateObject("not array", []),
        Sass
      )

      await assert.rejects(
        () => Data.allocateObject([1, 2], [1]), // mismatched lengths
        Sass
      )

      await assert.rejects(
        () => Data.allocateObject([1], "not array or function"),
        Sass
      )
    })
  })

  describe("mapObject", () => {
    it("transforms object values with async function", async () => {
      const original = { a: 1, b: 2, c: { d: 3 } }
      const transformer = async (key, value) =>
        typeof value === "number" ? value * 2 : value

      const result = await Data.mapObject(original, transformer)
      const expected = { a: 2, b: 4, c: { d: 6 } }
      assert.deepEqual(result, expected)
      assert.notStrictEqual(result, original) // new object
    })

    it("can mutate original object", async () => {
      const original = { a: 1, b: 2 }
      const transformer = async (key, value) => value * 2

      const result = await Data.mapObject(original, transformer, true)
      assert.strictEqual(result, original) // same reference
      assert.deepEqual(original, { a: 2, b: 4 })
    })

    it("validates input types", async () => {
      await assert.rejects(
        () => Data.mapObject("not object", () => {}),
        Sass
      )

      await assert.rejects(
        () => Data.mapObject({}, "not function"),
        Sass
      )
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
    it("uniformStringArray validates string arrays", () => {
      assert.equal(Data.uniformStringArray(["a", "b", "c"]), true)
      assert.equal(Data.uniformStringArray([]), true)
      assert.equal(Data.uniformStringArray(["a", 1, "c"]), false)
      assert.equal(Data.uniformStringArray("not array"), false)
    })

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

    it("handles empty arrays in array operations", () => {
      assert.deepEqual(Data.arrayIntersection([], []), [])
      assert.equal(Data.arrayIntersects([], []), false)
      assert.deepEqual(Data.isArrayUnique([]), [])
    })

    it("handles complex nested object operations", () => {
      const complex = {
        level1: {
          level2: {
            array: [1, 2, { nested: true }],
            func: () => "test"
          }
        }
      }

      const cloned = Data.cloneObject(complex)
      assert.deepEqual(cloned, complex)
      assert.notStrictEqual(cloned.level1.level2.array, complex.level1.level2.array)
    })
  })
})
