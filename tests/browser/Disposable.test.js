#!/usr/bin/env node

import assert from "node:assert/strict"
import {describe, it} from "node:test"

import {DisposerClass as Disposer} from "@gesslar/toolkit/browser"

describe("Disposer", () => {
  it("runs disposers in reverse order", () => {
    const calls = []
    const disposable = new Disposer()

    disposable.register(() => calls.push("first"))
    disposable.register(() => calls.push("second"))

    disposable.dispose()

    assert.deepEqual(calls, ["second", "first"])
  })

  it("removes an individual disposer via returned unregister", () => {
    const calls = []
    const disposable = new Disposer()

    const unregister = disposable.register(() => calls.push("kept"))
    disposable.register(() => calls.push("removed"))

    unregister()
    disposable.dispose()

    assert.deepEqual(calls, ["removed"])
  })

  it("aggregates errors thrown during disposal", () => {
    const disposable = new Disposer()

    disposable.register(() => {
      throw new Error("boom")
    })

    assert.throws(() => disposable.dispose(), error => {
      assert.ok(error instanceof AggregateError)
      assert.equal(error.errors.length, 1)
      assert.match(error.errors[0].message, /boom/)
      return true
    })
  })

  it("returns empty disposer when already disposed or invalid input", () => {
    const disposable = new Disposer()

    const noop = disposable.register("not a function")
    assert.equal(typeof noop, "function")

    disposable.dispose()
    const unregister = disposable.register(() => {})
    unregister()

    assert.equal(disposable.disposed, true)
  })
})
