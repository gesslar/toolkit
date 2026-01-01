#!/usr/bin/env node

import assert from "node:assert/strict"
import {after, afterEach, before, describe, it} from "node:test"
import {setupBrowserEnvironment, cleanupBrowserEnvironment} from "../helpers/browser-env.js"

import {HTMLClass as HTML, Sass} from "@gesslar/toolkit/browser"

describe("HTML", () => {
  const fakeSanitizer = input => `safe:${input}`
  let originalFetch
  let cleanup

  before(() => {
    cleanup = setupBrowserEnvironment()
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  after(() => {
    globalThis.fetch = originalFetch
    cleanupBrowserEnvironment(cleanup)
  })

  describe("loadHTML", () => {
    it("returns inner body content when requested", async () => {
      const htmlString = "<html><body><p>hi</p></body></html>"
      globalThis.fetch = async () => ({text: async () => htmlString})

      const html = new HTML({sanitize: fakeSanitizer})
      const result = await html.loadHTML("https://example.com", true)

      assert.equal(result, "<p>hi</p>")
    })

    it("returns full HTML when body is absent", async () => {
      const htmlString = "<div>outer</div>"
      globalThis.fetch = async () => ({text: async () => htmlString})

      const html = new HTML({sanitize: fakeSanitizer})
      const result = await html.loadHTML("https://example.com")

      assert.equal(result, htmlString)
    })
  })

  describe("sanitise", () => {
    it("throws a Sass error when DOMPurify is unavailable", () => {
      const html = new HTML(null)

      assert.throws(() => html.sanitise("<p>unsafe</p>"), error => {
        assert.ok(error instanceof Sass)
        assert.match(error.message, /DOMPurify sanitization is unavailable/i)

        return true
      })
    })

    it("uses the provided sanitizer implementation", () => {
      const html = new HTML({sanitize: fakeSanitizer})
      const result = html.sanitise("<p>unsafe</p>")

      assert.equal(result, "safe:<p>unsafe</p>")
    })
  })

  describe("setHTMLContent", () => {
    it("sanitizes and assigns via innerHTML when replaceChildren is unavailable", () => {
      const element = {innerHTML: ""}
      const html = new HTML({sanitize: fakeSanitizer})

      html.setHTMLContent(element, "<span>value</span>")

      assert.equal(element.innerHTML, "safe:<span>value</span>")
    })
  })

  describe("clearHTMLContent", () => {
    it("clears content using replaceChildren when available", () => {
      const calls = []
      const element = {
        replaceChildren: (...args) => {
          calls.push(args)
        }
      }

      const html = new HTML({sanitize: fakeSanitizer})

      html.clearHTMLContent(element)

      assert.deepEqual(calls, [[]])
    })
  })
})
