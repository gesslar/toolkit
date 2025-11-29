#!/usr/bin/env node

import assert from "node:assert/strict"
import {describe, it} from "node:test"

import {DisposableClass as Disposable} from "@gesslar/toolkit"

describe("Disposable (node entry)", () => {
  it("is exported and disposes registered callbacks", () => {
    const calls = []
    const disposable = new Disposable()

    disposable.registerDisposer(() => calls.push("done"))
    disposable.dispose()

    assert.deepEqual(calls, ["done"])
  })
})
