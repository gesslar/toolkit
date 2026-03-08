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

    it("auto-detects JSON5 with type any", () => {
      const result = Data.textAsData('{"n": 42}', "any")

      assert.deepEqual(result, {n: 42})
    })

    it("auto-detects YAML with type any", () => {
      const result = Data.textAsData("n: 42", "any")

      assert.deepEqual(result, {n: 42})
    })

    it("accepts type json as alias for json5", () => {
      const result = Data.textAsData('{"a": 1}', "json")

      assert.deepEqual(result, {a: 1})
    })

    it("is case-insensitive for type", () => {
      const result = Data.textAsData('{"a": 1}', "JSON5")

      assert.deepEqual(result, {a: 1})
    })

    it("throws for unsupported type", () => {
      assert.throws(
        () => Data.textAsData("{}", "xml"),
        /Unsupported data type 'xml'/
      )
    })

    it("throws for unparseable content", () => {
      assert.throws(
        () => Data.textAsData("{{not valid", "any"),
        /Content is neither valid JSON5 nor valid YAML/
      )
    })

    it("throws for unparseable content with json type", () => {
      assert.throws(
        () => Data.textAsData("{{not valid", "json"),
        /Content is neither valid JSON5 nor valid YAML/
      )
    })

    it("throws for unparseable content with yaml type", () => {
      assert.throws(
        () => Data.textAsData("{: bad", "yaml"),
        /Content is neither valid JSON5 nor valid YAML/
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
