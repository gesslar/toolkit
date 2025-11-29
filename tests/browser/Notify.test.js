#!/usr/bin/env node

import assert from "node:assert/strict"
import {afterEach, before, describe, it} from "node:test"

import {Notify} from "@gesslar/toolkit/browser"

describe("Notify", () => {
  let originalWindow

  before(() => {
    originalWindow = globalThis.window
  })

  afterEach(() => {
    globalThis.window = originalWindow
  })

  it("emits events with payload through window", () => {
    const target = new EventTarget()
    const received = []

    globalThis.window = target
    target.addEventListener("ping", event => {
      received.push(event.detail)
    })

    Notify.emit("ping", {value: 123})

    assert.deepEqual(received, [{value: 123}])
  })

  it("returns mutated detail from request listeners", () => {
    const target = new EventTarget()
    globalThis.window = target

    target.addEventListener("query", event => {
      event.detail.response = "ok"
    })

    const detail = Notify.request("query", {question: "?"})

    assert.deepEqual(detail, {question: "?", response: "ok"})
  })

  it("cleans up listeners via disposer with options", () => {
    const addCalls = []
    const removeCalls = []
    const element = {
      addEventListener: (...args) => addCalls.push(args),
      removeEventListener: (...args) => removeCalls.push(args)
    }
    const handler = () => {}
    const dispose = Notify.on("cleanup", handler, element, {capture: true})

    dispose()

    assert.deepEqual(addCalls, [["cleanup", handler, {capture: true}]])
    assert.deepEqual(removeCalls, [["cleanup", handler, {capture: true}]])
  })
})
