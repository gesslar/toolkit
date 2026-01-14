import assert from "node:assert/strict"
import {describe,it} from "node:test"

import OObject from "../../src/browser/lib/OObject.js"

describe("OObject", () => {
  describe("constructor", () => {
    it("creates empty OObject with no arguments", () => {
      const oo = new OObject()
      assert.deepEqual(oo.data, [])
    })

    it("creates OObject with provided array", () => {
      const data = [{key: "test", value: 42, path: ["test"], flatPath: "test"}]
      const oo = new OObject(data)
      assert.deepEqual(oo.data, data)
    })
  })

  describe("from static method", () => {
    it("decomposes flat object", () => {
      const source = {name: "Alice", age: 30}
      const oo = OObject.from(source)

      assert.equal(oo.data.length, 2)
      assert.equal(oo.find("name").value, "Alice")
      assert.equal(oo.find("age").value, 30)
    })

    it("decomposes nested object", () => {
      const source = {
        user: {
          name: "Bob",
          age: 25
        }
      }
      const oo = OObject.from(source)

      assert.equal(oo.data.length, 2)
      assert.equal(oo.find("user.name").value, "Bob")
      assert.equal(oo.find("user.age").value, 25)
    })

    it("decomposes arrays with 1-based indexing", () => {
      const source = {colors: ["red", "green", "blue"]}
      const oo = OObject.from(source)

      assert.equal(oo.data.length, 3)
      assert.equal(oo.find("colors.1").value, "red")
      assert.equal(oo.find("colors.2").value, "green")
      assert.equal(oo.find("colors.3").value, "blue")
    })

    it("includes array metadata", () => {
      const source = {items: ["a", "b"]}
      const oo = OObject.from(source)
      const entry = oo.find("items.1")

      assert.ok(entry.array)
      assert.equal(entry.array.index, 0)
      assert.deepEqual(entry.array.path, ["items"])
      assert.equal(entry.array.flatPath, "items")
    })

    it("decomposes deeply nested structure", () => {
      const source = {
        company: {
          employees: [
            {name: "Alice"},
            {name: "Bob"}
          ]
        }
      }
      const oo = OObject.from(source)

      assert.ok(oo.find("company.employees.1.name"))
      assert.equal(oo.find("company.employees.1.name").value, "Alice")
      assert.ok(oo.find("company.employees.2.name"))
      assert.equal(oo.find("company.employees.2.name").value, "Bob")
    })

    it("preserves value and valueString", () => {
      const source = {num: 42, bool: true, str: "hello"}
      const oo = OObject.from(source)

      assert.equal(oo.find("num").value, 42)
      assert.equal(oo.find("num").valueString, "42")
      assert.equal(oo.find("bool").value, true)
      assert.equal(oo.find("bool").valueString, "true")
      assert.equal(oo.find("str").value, "hello")
      assert.equal(oo.find("str").valueString, "hello")
    })
  })

  describe("find method", () => {
    it("finds entry by flat path string", () => {
      const source = {a: {b: {c: "deep"}}}
      const oo = OObject.from(source)
      const entry = oo.find("a.b.c")

      assert.ok(entry)
      assert.equal(entry.value, "deep")
      assert.equal(entry.flatPath, "a.b.c")
    })

    it("finds entry by predicate function", () => {
      const source = {name: "Alice", age: 30}
      const oo = OObject.from(source)
      const entry = oo.find(e => e.value === 30)

      assert.ok(entry)
      assert.equal(entry.key, "age")
      assert.equal(entry.value, 30)
    })

    it("returns undefined for non-existent path", () => {
      const oo = OObject.from({x: 1})
      assert.equal(oo.find("y"), undefined)
    })

    it("returns undefined when predicate matches nothing", () => {
      const oo = OObject.from({x: 1})
      assert.equal(oo.find(e => e.value === 999), undefined)
    })
  })

  describe("findAll method", () => {
    it("finds all entries by flat path string", () => {
      const oo = OObject.from({x: 1})
      oo.assurePath("y", 2)
      const entries = oo.findAll("y")

      assert.equal(entries.length, 1)
      assert.equal(entries[0].value, 2)
    })

    it("finds all entries by predicate function", () => {
      const source = {colors: ["red", "green", "blue"]}
      const oo = OObject.from(source)
      const entries = oo.findAll(e => e.key === "colors")

      assert.equal(entries.length, 3)
      assert.equal(entries[0].value, "red")
      assert.equal(entries[1].value, "green")
      assert.equal(entries[2].value, "blue")
    })

    it("returns empty array when nothing matches", () => {
      const oo = OObject.from({x: 1})
      assert.deepEqual(oo.findAll("nonexistent"), [])
      assert.deepEqual(oo.findAll(e => e.value === 999), [])
    })
  })

  describe("entries method", () => {
    it("returns iterator over all entries", () => {
      const source = {a: 1, b: 2, c: 3}
      const oo = OObject.from(source)
      const entries = [...oo.entries()]

      assert.equal(entries.length, 3)
      assert.equal(entries[0].key, "a")
      assert.equal(entries[1].key, "b")
      assert.equal(entries[2].key, "c")
    })

    it("preserves order", () => {
      const source = {z: 1, a: 2, m: 3}
      const oo = OObject.from(source)
      const keys = [...oo.entries()].map(e => e.key)

      assert.deepEqual(keys, ["z", "a", "m"])
    })
  })

  describe("forEach method", () => {
    it("iterates over all entries in order", () => {
      const source = {a: 1, b: 2}
      const oo = OObject.from(source)
      const collected = []

      oo.forEach(entry => collected.push(entry.key))

      assert.deepEqual(collected, ["a", "b"])
    })

    it("provides entry object to callback", () => {
      const source = {test: 42}
      const oo = OObject.from(source)

      oo.forEach(entry => {
        assert.ok(entry.key)
        assert.ok(entry.value)
        assert.ok(entry.path)
        assert.ok(entry.flatPath)
      })
    })
  })

  describe("assurePath method", () => {
    it("creates new entry if path does not exist", () => {
      const oo = new OObject()
      const entry = oo.assurePath("new.path", 123)

      assert.ok(entry)
      assert.equal(entry.value, 123)
      assert.equal(entry.flatPath, "new.path")
      assert.equal(oo.data.length, 1)
    })

    it("updates existing entry if path exists", () => {
      const oo = OObject.from({existing: "old"})
      const entry = oo.assurePath("existing", "new")

      assert.equal(entry.value, "new")
      assert.equal(entry.valueString, "new")
      assert.equal(oo.data.length, 1)
    })

    it("sets value to undefined if not provided", () => {
      const oo = new OObject()
      const entry = oo.assurePath("path")

      assert.equal(entry.value, undefined)
      assert.equal(entry.valueString, "undefined")
    })

    it("does not modify existing entry if value is undefined", () => {
      const oo = OObject.from({test: "original"})
      const entry = oo.assurePath("test")

      assert.equal(entry.value, "original")
    })
  })
})
