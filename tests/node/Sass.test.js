import assert from "node:assert/strict"
import {describe,it} from "node:test"

import Sass from "../../src/lib/Sass.js"

// Helpers for intercepting console output
/**
 * Captures console output for testing purposes
 * @param {string} method - Console method to capture (e.g., 'error', 'log')
 * @param {() => void} fn - Function to execute while capturing
 * @returns {string} Captured console output
 */
function captureConsole(method, fn) {
  const original = console[method]
  const calls = []
  console[method] = (...args) => { calls.push(args.join(" ")) }
  try {
    fn()
  } finally {
    console[method] = original
  }
  return calls.join("\n")
}

describe("Sass", () => {
  it("creates a Sass error with message and initial trace", () => {
    const err = new Sass("Boom")

    assert.ok(err instanceof Error)
    assert.ok(err instanceof Sass)
    assert.equal(err.message, "Boom")
    assert.deepEqual(err.trace, ["Boom"]) // constructor sets trace via setter
  })


  it("addTrace appends to the front (unshift) and is chainable", () => {
    const err = new Sass("first").addTrace("second").addTrace("third")

    assert.deepEqual(err.trace, ["third", "second", "first"]) // newest first
    assert.ok(err instanceof Sass)
  })

  it("from wraps an Error and adds a trace", () => {
    const base = new Error("Original")
    const err = Sass.from(base, "wrapped here")

    assert.ok(err instanceof Sass)
    assert.equal(err.message, "Original")
    assert.equal(err.cause, base)
    assert.deepEqual(err.trace, ["wrapped here", "Original"]) // addTrace + constructor
  })

  it("new returns new Sass when only message provided", () => {
    const err = Sass.new("Solo")

    assert.ok(err instanceof Sass)
    assert.equal(err.message, "Solo")
    assert.deepEqual(err.trace, ["Solo"])
  })

  it("new enhances existing Sass by adding a trace", () => {
    const err0 = Sass.new("first")
    const err1 = Sass.new("second", err0)

    assert.ok(err1 instanceof Sass)
    assert.strictEqual(err1, err0) // same instance enhanced
    assert.deepEqual(err1.trace, ["second", "first"])
  })

  it("new wraps non-Sass Error via from() and adds trace", () => {
    const base = new Error("oops")
    const err = Sass.new("context", base)

    assert.ok(err instanceof Sass)
    assert.equal(err.message, "oops")
    assert.equal(err.cause, base)
    assert.deepEqual(err.trace, ["context", "oops"]) // context + original message
  })

  it("report prints trace and optional nerd stack", () => {
    const err = new Sass("Kaboom").addTrace("Context")

    const output = captureConsole("error", () => {
      err.report(false)
    })

    // Should include the header and both trace lines
    assert.match(output, /\[Something Went Wrong\]/)
    assert.match(output, /Context/)
    assert.match(output, /Kaboom/)
  })

  it("report(nerdMode) includes formatted stack and cause stack when present", () => {
    const cause = new Error("root cause")
    const err = Sass.new("top", cause)

    const output = captureConsole("error", () => {
      err.report(true)
    })

    assert.match(output, /\[Something Went Wrong\]/)
    assert.match(output, /\[Nerd Vittles\]/)
    assert.match(output, /\[Rethrown From\]/)
  })

  it("addTrace validates input type", () => {
    const err = new Sass("hi")

    assert.throws(() => err.addTrace(123), /expected string/i)
  })

  it("from throws if first argument is not an Error", () => {
    assert.throws(() => Sass.from("not an error", "msg"), /must take an Error object/)
    assert.throws(() => Sass.from(null, "msg"), /must take an Error object/)
    assert.throws(() => Sass.from({}, "msg"), /must take an Error object/)
  })

  it("works with additional constructor args", () => {
    const err = new Sass("test", { cause: new Error("root") })

    assert.equal(err.message, "test")
    assert.ok(err.cause instanceof Error)
    assert.equal(err.cause.message, "root")
  })

  it("trace getter returns a reference to internal array", () => {
    const err = new Sass("test")
    const trace = err.trace

    trace.push("modified")
    assert.deepEqual(err.trace, ["test", "modified"]) // modified original
  })
})
