#!/usr/bin/env node

import assert from "node:assert/strict"
import {describe, it} from "node:test"

import {DisposableClass as Disposable} from "@gesslar/toolkit/browser"

describe("Disposable", () => {
  it("runs disposers in reverse order", () => {
    const calls = []
    const disposable = new Disposable()

    disposable.registerDisposer(() => calls.push("first"))
    disposable.registerDisposer(() => calls.push("second"))

    disposable.dispose()

    assert.deepEqual(calls, ["second", "first"])
  })

  it("removes an individual disposer via returned unregister", () => {
    const calls = []
    const disposable = new Disposable()

    const unregister = disposable.registerDisposer(() => calls.push("kept"))
    disposable.registerDisposer(() => calls.push("removed"))

    unregister()
    disposable.dispose()

    assert.deepEqual(calls, ["removed"])
  })

  it("aggregates errors thrown during disposal", () => {
    const disposable = new Disposable()

    disposable.registerDisposer(() => {
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
    const disposable = new Disposable()

    const noop = disposable.registerDisposer("not a function")
    assert.equal(typeof noop, "function")

    disposable.dispose()
    const unregister = disposable.registerDisposer(() => {})
    unregister()

    assert.equal(disposable.disposed, true)
  })
})
