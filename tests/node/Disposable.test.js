#!/usr/bin/env node

import assert from "node:assert/strict"
import {describe, it} from "node:test"

import {DisposerClass as Disposer} from "../../src/node/index.js"

describe("Disposer (node entry)", () => {
  it("is exported and disposes registered callbacks", () => {
    const calls = []
    const disposable = new Disposer()

    disposable.register(() => calls.push("done"))
    disposable.dispose()

    assert.deepEqual(calls, ["done"])
  })

  it("returns unregister array when multiple disposers are registered", () => {
    const calls = []
    const disposable = new Disposer()

    const unregisters = disposable.register(
      () => calls.push("skip"),
      () => calls.push("keep")
    )

    unregisters[0]()
    disposable.dispose()

    assert.ok(Array.isArray(unregisters))
    assert.deepEqual(calls, ["keep"])
  })

  it("supports array input for disposers", () => {
    const calls = []
    const disposable = new Disposer()

    const unregisters = disposable.register([
      () => calls.push("one"),
      () => calls.push("two")
    ])

    unregisters[0]()
    disposable.dispose()

    assert.ok(Array.isArray(unregisters))
    assert.deepEqual(calls, ["two"])
  })

  it("allows registering again after a dispose", () => {
    const calls = []
    const disposable = new Disposer()

    disposable.dispose()
    disposable.register(() => calls.push("again"))
    disposable.dispose()

    assert.deepEqual(calls, ["again"])
  })
})
