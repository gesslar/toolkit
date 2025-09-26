import assert from "node:assert/strict"
import {describe,it} from "node:test"

import {Sass,Type} from "../../src/index.js"

describe("Type", () => {
  describe("constructor and basic properties", () => {
    it("parses simple type string", () => {
      const spec = new Type("string")

      assert.equal(spec.length, 1)
      assert.equal(spec.stringRepresentation, "String")
      assert.ok(spec.specs)
      assert.equal(spec.specs[0].typeName, "String")
      assert.equal(spec.specs[0].array, false)
    })

    it("parses array type string", () => {
      const spec = new Type("number[]")

      assert.equal(spec.length, 1)
      assert.equal(spec.stringRepresentation, "Number[]")
      assert.equal(spec.specs[0].typeName, "Number")
      assert.equal(spec.specs[0].array, true)
    })

    it("parses union type string", () => {
      const spec = new Type("string|number")

      assert.equal(spec.length, 2)
      assert.equal(spec.stringRepresentation, "String|Number")
      assert.equal(spec.specs[0].typeName, "String")
      assert.equal(spec.specs[0].array, false)
      assert.equal(spec.specs[1].typeName, "Number")
      assert.equal(spec.specs[1].array, false)
    })

    it("parses complex union with arrays", () => {
      const spec = new Type("string[]|number|boolean[]")

      assert.equal(spec.length, 3)
      assert.equal(spec.stringRepresentation, "String[]|Number|Boolean[]")
      assert.equal(spec.specs[0].typeName, "String")
      assert.equal(spec.specs[0].array, true)
      assert.equal(spec.specs[1].typeName, "Number")
      assert.equal(spec.specs[1].array, false)
      assert.equal(spec.specs[2].typeName, "Boolean")
      assert.equal(spec.specs[2].array, true)
    })

    it("is frozen after construction", () => {
      const spec = new Type("string")

      assert.throws(() => {
        spec.length = 99
      }, TypeError)

      assert.throws(() => {
        spec.specs = []
      }, TypeError)
    })
  })

  describe("validation methods", () => {
    it("throws for invalid type names", () => {
      assert.throws(() => {
        new Type("123invalid")
      }, (error) => {
        return error instanceof Sass && error.message.includes("Invalid type: 123invalid")
      })
    })

    it("throws for malformed type syntax", () => {
      // The regex is quite permissive, so let's test truly invalid patterns
      assert.throws(() => {
        new Type("123invalid")
      }, Sass)

      assert.throws(() => {
        new Type("string|")
      }, Sass)
    })
  })

  describe("array methods", () => {
    it("forEach iterates over specs", () => {
      const spec = new Type("string|number")
      const types = []

      spec.forEach(s => types.push(s.typeName))

      assert.deepEqual(types, ["String", "Number"])
    })

    it("every tests all specs", () => {
      const spec = new Type("string|number")

      assert.equal(spec.every(s => typeof s.typeName === "string"), true)
      assert.equal(spec.every(s => s.array === true), false)
    })

    it("some tests any spec", () => {
      const spec = new Type("string[]|number")

      assert.equal(spec.some(s => s.array === true), true)
      assert.equal(spec.some(s => s.typeName === "boolean"), false)
    })

    it("filter returns matching specs", () => {
      const spec = new Type("string[]|number|boolean[]")
      const arrays = spec.filter(s => s.array)

      assert.equal(arrays.length, 2)
      assert.equal(arrays[0].typeName, "String")
      assert.equal(arrays[1].typeName, "Boolean")
    })

    it("map transforms specs", () => {
      const spec = new Type("string|number")
      const names = spec.map(s => s.typeName)

      assert.deepEqual(names, ["String", "Number"])
    })

    it("reduce accumulates specs", () => {
      const spec = new Type("string|number|boolean")
      const count = spec.reduce((acc, s) => acc + (s.array ? 0 : 1), 0)

      assert.equal(count, 3)
    })

    it("find returns first matching spec", () => {
      const spec = new Type("String[]|Number|Boolean[]")
      const found = spec.find(s => s.array && s.typeName === "Boolean")

      assert.ok(found)
      assert.equal(found.typeName, "Boolean")
      assert.equal(found.array, true)
    })
  })

  describe("match method", () => {
    it("matches simple types", () => {
      const spec = new Type("String")

      assert.equal(spec.match("hello"), true)
      assert.equal(spec.match(123), false)
      assert.equal(spec.match(true), false)
    })

    it("matches array types", () => {
      const spec = new Type("String[]")

      assert.equal(spec.match(["a", "b", "c"]), true)
      assert.equal(spec.match([1, 2, 3]), false)
      assert.equal(spec.match("not array"), false)
    })

    it("matches union types", () => {
      const spec = new Type("String|Number")

      assert.equal(spec.match("hello"), true)
      assert.equal(spec.match(123), true)
      assert.equal(spec.match(true), false)
    })

    it("matches mixed array and non-array types", () => {
      const spec = new Type("String|Number[]")

      assert.equal(spec.match("hello"), true)
      assert.equal(spec.match([1, 2, 3]), true)
      assert.equal(spec.match(["a", "b"]), false) // string[] not in union
      assert.equal(spec.match(true), false)
    })

    it("handles empty arrays with allowEmpty option", () => {
      const spec = new Type("String[]")

      assert.equal(spec.match([], { allowEmpty: true }), true)
      assert.equal(spec.match([], { allowEmpty: false }), false)
    })

    it("handles empty strings with allowEmpty option", () => {
      const spec = new Type("String")

      assert.equal(spec.match("", { allowEmpty: true }), true)
      assert.equal(spec.match("", { allowEmpty: false }), false)
    })

    it("handles array type matching", () => {
      const spec = new Type("Array")

      assert.equal(spec.match([]), true)
      assert.equal(spec.match([1, 2, 3]), true)
      assert.equal(spec.match("not array"), false)
    })

    it("rejects non-uniform arrays", () => {
      const spec = new Type("String[]")

      assert.equal(spec.match(["a", "b", "c"]), true)
      assert.equal(spec.match(["a", 1, "c"]), false) // mixed types
    })
  })

  describe("toString and toJSON", () => {
    it("toString returns string representation", () => {
      const spec1 = new Type("String")
      const spec2 = new Type("Number[]")
      const spec3 = new Type("String|Number[]|Boolean")

      assert.equal(spec1.toString(), "String")
      assert.equal(spec2.toString(), "Number[]")
      assert.equal(spec3.toString(), "String|Number[]|Boolean")
    })

    it("toJSON returns structured data", () => {
      const spec = new Type("String|Number[]")
      const json = spec.toJSON()

      assert.equal(json.length, 2)
      assert.equal(json.stringRepresentation, "String|Number[]")
      assert.ok(Array.isArray(json.specs))
      assert.equal(json.specs.length, 2)
    })
  })

  describe("custom delimiter option", () => {
    it("uses custom delimiter when provided", () => {
      const spec = new Type("String&Number&Boolean", { delimiter: "&" })

      assert.equal(spec.length, 3)
      assert.equal(spec.specs[0].typeName, "String")
      assert.equal(spec.specs[1].typeName, "Number")
      assert.equal(spec.specs[2].typeName, "Boolean")
    })
  })

  describe("edge cases", () => {
    it("handles all valid JavaScript types", () => {
      const validTypes = [
        "String", "Number", "Boolean", "Object", "Function", "Undefined",
        "Symbol", "Bigint", "Array", "Date", "RegExp", "Error", "Map", "Set"
      ]

      for (const type of validTypes) {
        const spec = new Type(type)
        assert.equal(spec.specs[0].typeName, type)
      }
    })

    it("handles complex nested scenarios", () => {
      const spec = new Type("Object|String[]|Function")

      assert.equal(spec.match({}), true)
      assert.equal(spec.match(["a", "b"]), true)
      assert.equal(spec.match(() => {}), true)
      assert.equal(spec.match(123), false)
    })

    it("validates invalid type specifications", () => {
      assert.throws(() => new Type("bad-type"), Sass)
      assert.throws(() => new Type("String|bad-type"), Sass)
      assert.throws(() => new Type(""), Sass)
    })

    it("correctly handles union type matching with arrays", () => {
      const spec = new Type("String|Number[]|Boolean")

      // Should match individual types
      assert.equal(spec.match("hello"), true)
      assert.equal(spec.match(true), true)
      assert.equal(spec.match([1, 2, 3]), true)

      // Should NOT match array types not in union
      assert.equal(spec.match(["a", "b"]), false)
      assert.equal(spec.match([true, false]), false)

      // Should handle mixed arrays correctly
      assert.equal(spec.match([1, "mixed"]), false)
    })

    it("respects allowEmpty for different value types", () => {
      const stringSpec = new Type("String")
      const arraySpec = new Type("String[]")

      // String emptiness
      assert.equal(stringSpec.match("", { allowEmpty: true }), true)
      assert.equal(stringSpec.match("", { allowEmpty: false }), false)
      assert.equal(stringSpec.match("  ", { allowEmpty: false }), false) // whitespace-only is empty

      // Array emptiness
      assert.equal(arraySpec.match([], { allowEmpty: true }), true)
      assert.equal(arraySpec.match([], { allowEmpty: false }), false)
    })
  })
})
