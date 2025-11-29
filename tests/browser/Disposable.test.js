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

  it("registers multiple disposers and returns matching unregisters", () => {
    const calls = []
    const disposable = new Disposer()

    const unregisters = disposable.register(
      () => calls.push("first"),
      () => calls.push("second")
    )

    assert.ok(Array.isArray(unregisters))
    assert.equal(unregisters.length, 2)

    unregisters[0]()
    disposable.dispose()

    assert.deepEqual(calls, ["second"])
  })

  it("registers array of disposers and returns matching unregisters", () => {
    const calls = []
    const disposable = new Disposer()

    const unregisters = disposable.register([
      () => calls.push("first"),
      () => calls.push("second")
    ])

    unregisters[1]()
    disposable.dispose()

    assert.deepEqual(calls, ["first"])
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

  it("throws on invalid input", () => {
    const disposable = new Disposer()

    assert.throws(
      () => disposable.register("not a function"),
      /Invalid type\. Expected Function\[\]/
    )
  })

  it("returns empty disposer when already disposed", () => {
    const disposable = new Disposer()

    disposable.dispose()
    const unregister = disposable.register(() => {})
    unregister()

    assert.equal(disposable.disposed, true)
  })
})
