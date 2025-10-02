#!/usr/bin/env node

import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { Util } from "../../src/index.js"

describe("Util.regexify()", () => {
  describe("basic functionality", () => {
    it("converts multiline string to single-line regex", () => {
      const multilinePattern = `
        \\d+
        \\w+
        \\s*
      `
      
      const result = Util.regexify(multilinePattern)
      
      assert.ok(result instanceof RegExp)
      assert.equal(result.source, "\\d+\\w+\\s*")
      assert.equal(result.flags, "")
    })

    it("handles empty input gracefully", () => {
      const result = Util.regexify("")
      
      // Empty regex becomes (?:) in JavaScript
      assert.equal(result.source, "(?:)")
      assert.equal(result.flags, "")
    })

    it("handles single line input", () => {
      const result = Util.regexify("\\d+")
      
      assert.equal(result.source, "\\d+")
    })
  })

  describe("trimming behavior", () => {
    it("trims whitespace by default", () => {
      const pattern = `
        \\s*\\*\\s*
        @(?<tag>\\w+)
        \\s+
      `
      
      const result = Util.regexify(pattern)
      
      assert.equal(result.source, "\\s*\\*\\s*@(?<tag>\\w+)\\s+")
    })

    it("preserves whitespace when trim=false", () => {
      const pattern = `line1
        line2
      line3`
      
      const result = Util.regexify(pattern, false)
      
      // With trim=false, it should preserve the line structure but still join
      assert.equal(result.source, "line1        line2      line3")
    })

    it("filters empty lines when trimming", () => {
      const pattern = `
        \\d+
        
        \\w+
        
        \\s*
      `
      
      const result = Util.regexify(pattern)
      
      assert.equal(result.source, "\\d+\\w+\\s*")
    })
  })

  describe("flags handling", () => {
    it("applies no flags by default", () => {
      const result = Util.regexify("\\d+")
      
      assert.equal(result.flags, "")
    })

    it("applies single flag", () => {
      const result = Util.regexify("\\d+", true, ["g"])
      
      assert.equal(result.flags, "g")
    })

    it("applies multiple flags", () => {
      const result = Util.regexify("\\d+", true, ["g", "i", "m"])
      
      assert.equal(result.flags, "gim")
    })

    it("handles empty flags array", () => {
      const result = Util.regexify("\\d+", true, [])
      
      assert.equal(result.flags, "")
    })
  })

  describe("complex regex patterns", () => {
    it("handles JSDoc tag pattern correctly", () => {
      const jsdocPattern = `
        \\s*\\*\\s*
        @(?<tag>\\w+)
        \\s*
        \\{(?<type>\\w+(?:\\|\\w+)*(?:\\*)?)\\}
        \\s+
        (?<name>(\\w+(\\.\\w?)*=?\\w*\\s*(?<rest>\\.{3})?|\\[\\w+=?.*]))(?:\\s+-)?
        \\s+
        (?<content>[\\s\\S]+?)
        (?=(\\s*\\*\\s*(?=@)|\\s*\\*\\/))
      `
      
      const result = Util.regexify(jsdocPattern)
      
      const expected = "\\s*\\*\\s*@(?<tag>\\w+)\\s*\\{(?<type>\\w+(?:\\|\\w+)*(?:\\*)?)\\}\\s+(?<name>(\\w+(\\.\\w?)*=?\\w*\\s*(?<rest>\\.{3})?|\\[\\w+=?.*]))(?:\\s+-)?\\s+(?<content>[\\s\\S]+?)(?=(\\s*\\*\\s*(?=@)|\\s*\\*\\/))"
      assert.equal(result.source, expected)
    })

    it("preserves named capture groups", () => {
      const pattern = `
        (?<year>\\d{4})
        -
        (?<month>\\d{2})
        -
        (?<day>\\d{2})
      `
      
      const result = Util.regexify(pattern)
      const testString = "2023-12-25"
      const match = testString.match(result)
      
      assert.ok(match)
      assert.equal(match.groups.year, "2023")
      assert.equal(match.groups.month, "12")
      assert.equal(match.groups.day, "25")
    })

    it("handles lookaheads and lookbehinds", () => {
      const pattern = `
        (?<=@)
        \\w+
        (?=\\s*\\{)
      `
      
      const result = Util.regexify(pattern)
      
      assert.equal(result.source, "(?<=@)\\w+(?=\\s*\\{)")
    })
  })

  describe("edge cases", () => {
    it("handles lines with only whitespace", () => {
      const pattern = `
        \\d+
        \t\t\t
        \\w+
      `
      
      const result = Util.regexify(pattern)
      
      // Whitespace-only lines get filtered out when trimming
      assert.equal(result.source, "\\d+\\w+")
    })

    it("handles mixed line endings", () => {
      const pattern = "\\d+\r\n\\w+\n\\s*"
      
      const result = Util.regexify(pattern)
      
      assert.equal(result.source, "\\d+\\w+\\s*")
    })

    it("preserves escaped characters", () => {
      const pattern = `
        \\\\d\\+
        \\\\w\\*
        \\\\s\\?
      `
      
      const result = Util.regexify(pattern)
      
      assert.equal(result.source, "\\\\d\\+\\\\w\\*\\\\s\\?")
    })
  })

  describe("real-world usage", () => {
    it("creates working regex for actual text matching", () => {
      const emailPattern = `
        ^[a-zA-Z0-9._%+-]+
        @
        [a-zA-Z0-9.-]+
        \\.
        [a-zA-Z]{2,}$
      `
      
      const result = Util.regexify(emailPattern)
      
      assert.ok(result.test("user@example.com"))
      assert.ok(!result.test("invalid-email"))
    })

    it("works with global flag for multiple matches", () => {
      const wordPattern = `\\b\\w+\\b`
      const result = Util.regexify(wordPattern, true, ["g"])
      
      const text = "hello world test"
      const matches = text.match(result)
      
      assert.equal(matches.length, 3)
      assert.deepEqual(matches, ["hello", "world", "test"])
    })
  })

  describe("parameter validation", () => {
    describe("input parameter validation", () => {
      it("validates basic non-string types", () => {
        assert.throws(() => Util.regexify(123), /Invalid type.*Expected String/)
        assert.throws(() => Util.regexify(null), /Invalid type.*Expected String/)
        assert.throws(() => Util.regexify(undefined), /Invalid type.*Expected String/)
      })

      it("validates exotic input types", () => {
        assert.throws(() => Util.regexify(Symbol("test")), /Invalid type.*Expected String/)
        assert.throws(() => Util.regexify(["pattern"]), /Invalid type.*Expected String/)
        assert.throws(() => Util.regexify({ pattern: "\\d+" }), /Invalid type.*Expected String/)
        assert.throws(() => Util.regexify(() => "\\d+"), /Invalid type.*Expected String/)
        assert.throws(() => Util.regexify(/\d+/), /Invalid type.*Expected String/)
      })
    })

    describe("trim parameter validation", () => {
      it("validates basic non-boolean types", () => {
        assert.throws(() => Util.regexify("\\d+", "true"), /Invalid type.*Expected Boolean/)
        assert.throws(() => Util.regexify("\\d+", 1), /Invalid type.*Expected Boolean/)
        assert.throws(() => Util.regexify("\\d+", null), /Invalid type.*Expected Boolean/)
      })

      it("validates exotic trim types", () => {
        assert.throws(() => Util.regexify("\\d+", Symbol("trim")), /Invalid type.*Expected Boolean/)
        assert.throws(() => Util.regexify("\\d+", [true]), /Invalid type.*Expected Boolean/)
        assert.throws(() => Util.regexify("\\d+", { trim: true }), /Invalid type.*Expected Boolean/)
        assert.throws(() => Util.regexify("\\d+", () => true), /Invalid type.*Expected Boolean/)
      })
    })

    describe("flags parameter validation", () => {
      it("validates basic non-array types", () => {
        assert.throws(() => Util.regexify("\\d+", true, "g"), /Invalid type.*Expected Array/)
        assert.throws(() => Util.regexify("\\d+", true, {}), /Invalid type.*Expected Array/)
        assert.throws(() => Util.regexify("\\d+", true, null), /Invalid type.*Expected Array/)
      })

      it("validates exotic flags types", () => {
        assert.throws(() => Util.regexify("\\d+", true, Symbol("flags")), /Invalid type.*Expected Array/)
        assert.throws(() => Util.regexify("\\d+", true, new Set(["g"])), /Invalid type.*Expected Array/)
        assert.throws(() => Util.regexify("\\d+", true, () => ["g"]), /Invalid type.*Expected Array/)
        assert.throws(() => Util.regexify("\\d+", true, /g/), /Invalid type.*Expected Array/)
      })
    })

    describe("flags array content validation", () => {
      it("validates basic non-string flag types", () => {
        assert.throws(() => Util.regexify("\\d+", true, ["g", 1]), /All flags must be strings/)
        assert.throws(() => Util.regexify("\\d+", true, ["g", null]), /All flags must be strings/)
        assert.throws(() => Util.regexify("\\d+", true, ["g", true]), /All flags must be strings/)
      })

      it("validates exotic flag element types", () => {
        assert.throws(() => Util.regexify("\\d+", true, ["g", Symbol("i")]), /All flags must be strings/)
        assert.throws(() => Util.regexify("\\d+", true, ["g", ["i"]]), /All flags must be strings/)
        assert.throws(() => Util.regexify("\\d+", true, ["g", { flag: "i" }]), /All flags must be strings/)
        assert.throws(() => Util.regexify("\\d+", true, ["g", () => "i"]), /All flags must be strings/)
        assert.throws(() => Util.regexify("\\d+", true, ["g", /i/]), /All flags must be strings/)
      })

      it("validates mixed type arrays", () => {
        assert.throws(() => Util.regexify("\\d+", true, ["g", 1, "i", null, "m"]), /All flags must be strings/)
        assert.throws(() => Util.regexify("\\d+", true, [Symbol("g"), "i", true]), /All flags must be strings/)
      })
    })

    it("accepts valid parameters", () => {
      // Should not throw
      const result1 = Util.regexify("\\d+", true, [])
      const result2 = Util.regexify("\\d+", false, ["g", "i"])
      
      assert.ok(result1 instanceof RegExp)
      assert.ok(result2 instanceof RegExp)
    })
  })
})