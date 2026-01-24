import assert from "node:assert/strict"
import {EventEmitter} from "node:events"
import {afterEach, describe, it} from "node:test"

import {Notify, NotifyClass} from "../../src/node/index.js"

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
        /no empty values/
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

  describe("asyncEmit", () => {
    it("waits for async listeners to complete", async () => {
      const order = []

      const handler = async payload => {
        await new Promise(resolve => setTimeout(resolve, 10))
        order.push(payload)
      }

      Notify.on("async-test", handler)
      await Notify.asyncEmit("async-test", "done")
      Notify.off("async-test", handler)

      assert.deepEqual(order, ["done"])
    })

    it("waits for multiple async listeners", async () => {
      const order = []

      const handler1 = async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
        order.push(1)
      }

      const handler2 = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        order.push(2)
      }

      Notify.on("async-multi", handler1)
      Notify.on("async-multi", handler2)
      await Notify.asyncEmit("async-multi")
      Notify.off("async-multi", handler1)
      Notify.off("async-multi", handler2)

      assert.equal(order.length, 2)
      assert.ok(order.includes(1))
      assert.ok(order.includes(2))
    })

    it("handles sync listeners too", async () => {
      const order = []

      const handler = payload => {
        order.push(payload)
      }

      Notify.on("async-sync", handler)
      await Notify.asyncEmit("async-sync", "sync-value")
      Notify.off("async-sync", handler)

      assert.deepEqual(order, ["sync-value"])
    })

    it("throws when a listener rejects", async () => {
      const handler = async () => {
        throw new Error("listener failed")
      }

      Notify.on("async-error", handler)

      await assert.rejects(
        () => Notify.asyncEmit("async-error"),
        /listener failed/
      )

      Notify.off("async-error", handler)
    })

    it("throws when type is empty string", async () => {
      await assert.rejects(
        () => Notify.asyncEmit(""),
        /no empty values/
      )
    })

    it("throws when type is not a string", async () => {
      await assert.rejects(
        () => Notify.asyncEmit(123),
        /Invalid type.*Expected String/
      )
    })

    it("resolves immediately when no listeners", async () => {
      await Notify.asyncEmit("no-listeners", "data")
      // Should not hang or throw
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

describe("NotifyClass export", () => {
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
    assert.equal(typeof instance.asyncEmit, "function")
  })

  it("default export is an instance of NotifyClass", () => {
    assert.ok(Notify instanceof NotifyClass)
  })

  it("instances are independent", () => {
    const instance1 = new NotifyClass()
    const instance2 = new NotifyClass()
    const events1 = []
    const events2 = []

    const handler1 = payload => events1.push(payload)
    const handler2 = payload => events2.push(payload)

    instance1.on("test", handler1)
    instance2.on("test", handler2)

    instance1.emit("test", "from-1")
    instance2.emit("test", "from-2")

    instance1.off("test", handler1)
    instance2.off("test", handler2)

    assert.deepEqual(events1, ["from-1"])
    assert.deepEqual(events2, ["from-2"])
  })

  it("instances are independent from default export", () => {
    const instance = new NotifyClass()
    const instanceEvents = []
    const defaultEvents = []

    const instanceHandler = payload => instanceEvents.push(payload)
    const defaultHandler = payload => defaultEvents.push(payload)

    instance.on("isolated", instanceHandler)
    Notify.on("isolated", defaultHandler)

    instance.emit("isolated", "instance-only")
    Notify.emit("isolated", "default-only")

    instance.off("isolated", instanceHandler)
    Notify.off("isolated", defaultHandler)

    assert.deepEqual(instanceEvents, ["instance-only"])
    assert.deepEqual(defaultEvents, ["default-only"])
  })

  it("multiple instances can coexist", () => {
    const instances = [
      new NotifyClass(),
      new NotifyClass(),
      new NotifyClass()
    ]
    const results = []

    instances.forEach((inst, idx) => {
      inst.on("ping", () => results.push(idx))
    })

    instances[1].emit("ping")

    instances.forEach(inst => {
      inst.off("ping", () => {})
    })

    assert.deepEqual(results, [1])
  })
})
