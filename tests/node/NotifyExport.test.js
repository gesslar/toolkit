import assert from "node:assert/strict"
import {EventEmitter} from "node:events"
import {afterEach, describe, it} from "node:test"

import {Notify} from "../../src/node/index.js"

describe("Notify (Node.js)", () => {
  let receivedEvents = []

  afterEach(() => {
    receivedEvents = []
  })

  describe("emit", () => {
    it("emits events with payload", () => {
      const handler = payload => {
        receivedEvents.push(payload)
      }

      Notify.on("test-emit", handler)
      Notify.emit("test-emit", {value: 42})
      Notify.off("test-emit", handler)

      assert.deepEqual(receivedEvents, [{value: 42}])
    })

    it("emits events without payload", () => {
      const handler = payload => {
        receivedEvents.push(payload)
      }

      Notify.on("test-no-payload", handler)
      Notify.emit("test-no-payload")
      Notify.off("test-no-payload", handler)

      assert.deepEqual(receivedEvents, [undefined])
    })

    it("notifies multiple listeners", () => {
      const handler1 = payload => receivedEvents.push({listener: 1, payload})
      const handler2 = payload => receivedEvents.push({listener: 2, payload})

      Notify.on("multi", handler1)
      Notify.on("multi", handler2)
      Notify.emit("multi", "data")
      Notify.off("multi", handler1)
      Notify.off("multi", handler2)

      assert.equal(receivedEvents.length, 2)
      assert.deepEqual(receivedEvents[0], {listener: 1, payload: "data"})
      assert.deepEqual(receivedEvents[1], {listener: 2, payload: "data"})
    })
  })

  describe("request", () => {
    it("returns mutated payload from listeners", () => {
      const handler = payload => {
        payload.response = "processed"
      }

      Notify.on("query", handler)
      const result = Notify.request("query", {question: "what?"})
      Notify.off("query", handler)

      assert.deepEqual(result, {question: "what?", response: "processed"})
    })

    it("allows multiple listeners to mutate payload", () => {
      const handler1 = payload => {
        payload.step1 = true
      }
      const handler2 = payload => {
        payload.step2 = true
      }

      Notify.on("pipeline", handler1)
      Notify.on("pipeline", handler2)
      const result = Notify.request("pipeline", {})
      Notify.off("pipeline", handler1)
      Notify.off("pipeline", handler2)

      assert.deepEqual(result, {step1: true, step2: true})
    })

    it("works with default empty object payload", () => {
      const handler = payload => {
        payload.added = "value"
      }

      Notify.on("default-payload", handler)
      const result = Notify.request("default-payload")
      Notify.off("default-payload", handler)

      assert.deepEqual(result, {added: "value"})
    })
  })

  describe("on and off", () => {
    it("registers and unregisters listeners", () => {
      const handler = payload => {
        receivedEvents.push(payload)
      }

      Notify.on("toggle", handler)
      Notify.emit("toggle", 1)
      Notify.off("toggle", handler)
      Notify.emit("toggle", 2)

      assert.deepEqual(receivedEvents, [1])
    })

    it("returns disposer function", () => {
      const handler = payload => {
        receivedEvents.push(payload)
      }

      const dispose = Notify.on("disposer-test", handler)
      Notify.emit("disposer-test", "a")
      dispose()
      Notify.emit("disposer-test", "b")

      assert.deepEqual(receivedEvents, ["a"])
    })

    it("throws when type is missing", () => {
      assert.throws(
        () => Notify.on("", () => {}),
        /Event type cannot be an empty string/
      )
    })

    it("throws when type is not a string", () => {
      assert.throws(
        () => Notify.on(123, () => {}),
        /Invalid type.*Expected String/
      )
    })

    it("throws when handler is missing", () => {
      assert.throws(
        () => Notify.on("test", null),
        /Invalid type.*Expected Function/
      )
    })

    it("throws when handler is not a function", () => {
      assert.throws(
        () => Notify.on("test", "not-a-function"),
        /Invalid type.*Expected Function/
      )
    })
  })

  describe("options support", () => {
    it("supports once option", () => {
      const handler = payload => {
        receivedEvents.push(payload)
      }

      Notify.on("once-test", handler, undefined, {once: true})
      Notify.emit("once-test", 1)
      Notify.emit("once-test", 2)

      assert.deepEqual(receivedEvents, [1])
    })
  })

  describe("custom EventEmitter", () => {
    it("works with custom EventEmitter instance", () => {
      const customEmitter = new EventEmitter()
      const events = []

      const handler = payload => {
        events.push(payload)
      }

      Notify.on("custom", handler, customEmitter)
      customEmitter.emit("custom", "test-data")
      Notify.off("custom", handler, customEmitter)

      assert.deepEqual(events, ["test-data"])
    })

    it("disposer works with custom emitter", () => {
      const customEmitter = new EventEmitter()
      const events = []

      const handler = payload => {
        events.push(payload)
      }

      const dispose = Notify.on("custom-dispose", handler, customEmitter)
      customEmitter.emit("custom-dispose", 1)
      dispose()
      customEmitter.emit("custom-dispose", 2)

      assert.deepEqual(events, [1])
    })
  })

  describe("edge cases", () => {
    it("handles undefined payload gracefully", () => {
      const handler = payload => {
        receivedEvents.push(payload)
      }

      Notify.on("undefined-payload", handler)
      Notify.emit("undefined-payload", undefined)
      Notify.off("undefined-payload", handler)

      assert.deepEqual(receivedEvents, [undefined])
    })

    it("handles null payload gracefully", () => {
      const handler = payload => {
        receivedEvents.push(payload)
      }

      Notify.on("null-payload", handler)
      Notify.emit("null-payload", null)
      Notify.off("null-payload", handler)

      assert.deepEqual(receivedEvents, [null])
    })

    it("handles complex payload objects", () => {
      const complexPayload = {
        nested: {deep: {value: 42}},
        array: [1, 2, 3],
        fn: () => "test"
      }

      const handler = payload => {
        receivedEvents.push(payload)
      }

      Notify.on("complex", handler)
      Notify.emit("complex", complexPayload)
      Notify.off("complex", handler)

      assert.equal(receivedEvents.length, 1)
      assert.equal(receivedEvents[0].nested.deep.value, 42)
      assert.deepEqual(receivedEvents[0].array, [1, 2, 3])
      assert.equal(typeof receivedEvents[0].fn, "function")
    })

    it("can remove listener that was never added", () => {
      const handler = () => {}

      // Should not throw
      Notify.off("never-added", handler)
    })

    it("multiple disposals don't error", () => {
      const handler = () => {}
      const dispose = Notify.on("multi-dispose", handler)

      dispose()
      dispose() // Should not throw
    })
  })
})
