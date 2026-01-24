#!/usr/bin/env node

import assert from "node:assert/strict"
import {after, afterEach, before, describe, it} from "node:test"
import {setupBrowserEnvironment, cleanupBrowserEnvironment} from "../helpers/browser-env.js"

import {Notify, NotifyClass} from "@gesslar/toolkit/browser"

describe("Notify", () => {
  let originalWindow
  let cleanup

  before(() => {
    cleanup = setupBrowserEnvironment()
    originalWindow = globalThis.window
  })

  after(() => {
    cleanupBrowserEnvironment(cleanup)
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

describe("NotifyClass export (Browser)", () => {
  let cleanup

  before(() => {
    cleanup = setupBrowserEnvironment()
  })

  after(() => {
    cleanupBrowserEnvironment(cleanup)
  })

  it("is exported as a class", () => {
    assert.equal(typeof NotifyClass, "function")
    assert.equal(NotifyClass.name, "Notify")
  })

  it("can be instantiated", () => {
    const instance = new NotifyClass()

    assert.ok(instance)
    assert.equal(instance.name, "Notify")
    assert.equal(typeof instance.emit, "function")
    assert.equal(typeof instance.on, "function")
    assert.equal(typeof instance.off, "function")
    assert.equal(typeof instance.request, "function")
  })

  it("default export is an instance of NotifyClass", () => {
    assert.ok(Notify instanceof NotifyClass)
  })

  it("instances share window but have independent method calls", () => {
    const target = new EventTarget()
    globalThis.window = target

    const instance1 = new NotifyClass()
    const instance2 = new NotifyClass()
    const received = []

    target.addEventListener("shared", event => {
      received.push(event.detail)
    })

    instance1.emit("shared", "from-1")
    instance2.emit("shared", "from-2")

    assert.deepEqual(received, ["from-1", "from-2"])
  })

  it("instances can manage their own listeners independently", () => {
    const addCalls1 = []
    const addCalls2 = []
    const element1 = {
      addEventListener: (...args) => addCalls1.push(args),
      removeEventListener: () => {}
    }
    const element2 = {
      addEventListener: (...args) => addCalls2.push(args),
      removeEventListener: () => {}
    }

    const instance1 = new NotifyClass()
    const instance2 = new NotifyClass()

    instance1.on("event1", () => {}, element1)
    instance2.on("event2", () => {}, element2)

    assert.equal(addCalls1.length, 1)
    assert.equal(addCalls1[0][0], "event1")
    assert.equal(addCalls2.length, 1)
    assert.equal(addCalls2[0][0], "event2")
  })
})
