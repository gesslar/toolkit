import assert from "node:assert/strict"
import {describe, it} from "node:test"

import {Font} from "../../src/node/index.js"

describe("Font", () => {
  describe("findNerdFonts", () => {
    it("exists and is a function", () => {
      assert.equal(typeof Font.findNerdFonts, "function")
    })

    it("returns an array", async () => {
      const result = await Font.findNerdFonts()

      assert.ok(Array.isArray(result))
    })

    it("returns strings in the array", async () => {
      const result = await Font.findNerdFonts()

      result.forEach(font => {
        assert.equal(typeof font, "string")
      })
    })
  })

  describe("hasNerdFonts", () => {
    it("exists and is a function", () => {
      assert.equal(typeof Font.hasNerdFonts, "function")
    })

    it("returns a boolean", async () => {
      const result = await Font.hasNerdFonts()

      assert.equal(typeof result, "boolean")
    })

    it("returns true when findNerdFonts returns non-empty array", async () => {
      const fonts = await Font.findNerdFonts()
      const hasNerd = await Font.hasNerdFonts()

      assert.equal(hasNerd, fonts.length > 0)
    })
  })

  describe("getNerdFontFamilies", () => {
    it("exists and is a function", () => {
      assert.equal(typeof Font.getNerdFontFamilies, "function")
    })

    it("returns an array", async () => {
      const result = await Font.getNerdFontFamilies()

      assert.ok(Array.isArray(result))
    })

    it("returns strings without Nerd Font suffixes", async () => {
      const result = await Font.getNerdFontFamilies()

      result.forEach(font => {
        assert.equal(typeof font, "string")
        // Should not contain NF or Nerd Font suffix
        assert.ok(!font.match(/\s*NF\s*$/i), `Font "${font}" still has NF suffix`)
        assert.ok(!font.match(/Nerd\s*Font/i), `Font "${font}" still has Nerd Font suffix`)
      })
    })
  })
})
