#!/usr/bin/env node

import assert from "node:assert/strict"
import {describe, it} from "node:test"

import {DisposerClass as Disposer} from "@gesslar/toolkit"

describe("Disposer (node entry)", () => {
  it("is exported and disposes registered callbacks", () => {
    const calls = []
    const disposable = new Disposer()

    disposable.register(() => calls.push("done"))
    disposable.dispose()

    assert.deepEqual(calls, ["done"])
  })
})
