#!/usr/bin/env node

import assert from "node:assert/strict"
import {describe, it} from "node:test"

describe("Notify (node entry)", () => {
  it("is not exported from the node bundle", async () => {
    const toolkit = await import("@gesslar/toolkit")

    assert.equal(Object.prototype.hasOwnProperty.call(toolkit, "Notify"), false)
  })
})
