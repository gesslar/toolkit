#!/usr/bin/env node

import assert from "node:assert/strict"
import {describe, it} from "node:test"

import {Data} from "../../src/node/index.js"

describe("Data", () => {
  describe("textAsData", () => {
    it("parses valid JSON5", () => {
      const result = Data.textAsData('{"key": "value"}')

      assert.deepEqual(result, {key: "value"})
    })

    it("parses JSON5 with comments and trailing commas", () => {
      const result = Data.textAsData(`{
        // a comment
        key: "value",
      }`)

      assert.deepEqual(result, {key: "value"})
    })

    it("parses valid YAML", () => {
      const result = Data.textAsData("key: value\nlist:\n  - a\n  - b")

      assert.deepEqual(result, {key: "value", list: ["a", "b"]})
    })

    it("auto-detects JSON with type any", () => {
      const result = Data.textAsData('{"n": 42}', "any")

      assert.deepEqual(result, {n: 42})
    })

    it("auto-detects YAML with type any", () => {
      const result = Data.textAsData("n: 42", "any")

      assert.deepEqual(result, {n: 42})
    })

    it("parses strict JSON with type json", () => {
      const result = Data.textAsData('{"a": 1}', "json")

      assert.deepEqual(result, {a: 1})
    })

    it("rejects JSON5 syntax when type is json", () => {
      assert.throws(
        () => Data.textAsData("{a: 1, /* comment */}", "json"),
        /Content is not valid JSON/
      )
    })

    it("parses JSON5 syntax when type is json5", () => {
      const result = Data.textAsData("{a: 1, /* comment */}", "json5")

      assert.deepEqual(result, {a: 1})
    })

    it("is case-insensitive for type", () => {
      const result = Data.textAsData('{"a": 1}', "JSON5")

      assert.deepEqual(result, {a: 1})
    })

    it("throws for unsupported type", () => {
      assert.throws(
        () => Data.textAsData("{}", "xml"),
        /Type must be one of any, json, json5, yaml/
      )
    })

    it("throws for unparseable content", () => {
      assert.throws(
        () => Data.textAsData("{{not valid", "any"),
        /Content is not valid JSON or JSON5 or YAML/
      )
    })

    it("throws for unparseable content with json type", () => {
      assert.throws(
        () => Data.textAsData("{{not valid", "json"),
        /Content is not valid JSON/
      )
    })

    it("throws for unparseable content with yaml type", () => {
      assert.throws(
        () => Data.textAsData("{: bad", "yaml"),
        /Content is not valid YAML/
      )
    })

    it("inherits browser Data methods", () => {
      assert.equal(Data.typeOf("hello"), "String")
      assert.equal(Data.typeOf(42), "Number")
      assert.equal(Data.typeOf(null), "Null")
      assert.equal(Data.isPlainObject({}), true)
      assert.equal(Data.isPlainObject([]), false)
    })
  })
})
