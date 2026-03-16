/**
 * @file Notify.js
 * @description Node.js event notification system using EventEmitter.
 * Provides a centralized API for event emission and handling.
 */

import {EventEmitter} from "node:events"

import Valid from "./Valid.js"
import Util from "./Util.js"
import {sign} from "node:crypto"

/**
 * @typedef {object} NotifyEventOptions
 * @property {boolean} [once] - Whether the listener should be invoked only once.
 * @property {AbortSignal} [signal] - An AbortSignal to remove the listener.
 */

/**
 * Notify class provides a thin wrapper around EventEmitter for centralized
 * event handling in Node.js applications. Mirrors the browser Notify API.
 */
export class Notify {
  /** @type {string} Display name for debugging. */
  name = "Notify"

  /** @type {EventEmitter} Internal event emitter */
  #emitter = new EventEmitter()

  /**
   * Emits an event without expecting a return value.
   *
   * @param {string} type - Event name to dispatch.
   * @param {unknown} [payload] - Data to send with the event.
   * @returns {undefined}
   */
  emit(type, payload=undefined) {
    Valid.type(type, "String", {allowEmpty: false})

    this.#emitter.emit(type, payload)
  }

  /**
   * Emits an event asynchronously and waits for all listeners to complete.
   * Unlike emit() which is synchronous, this method properly handles async
   * event listeners by waiting for all of them to resolve.
   *
   * @param {string} type - Event name to dispatch.
   * @param {unknown} [payload] - Data to send with the event.
   * @returns {Promise<undefined>} Resolves when all listeners have completed.
   */
  async asyncEmit(type, payload) {
    Valid.type(type, "String", {allowEmpty: false})

    await Util.asyncEmit(this.#emitter, type, payload)
  }

  /**
   * Fires an event asynchronously without blocking the caller.
   * Listeners run in the background. If any listener throws and an error
   * callback is provided, it receives the error. Otherwise errors are
   * silently discarded.
   *
   * @param {string} type - Event name to dispatch.
   * @param {unknown} [payload] - Data to send with the event.
   * @param {((error: Error) => void)|null} [errorCb] - Optional callback for errors.
   * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the operation.
   * @returns {undefined}
   */
  fire(type, payload, errorCb, signal) {
    Valid.type(type, "String", {allowEmpty: false})
    Valid.type(errorCb, "Undefined|Null|Function")
    Valid.type(signal, "Undefined|Null|AbortSignal")

    Util.fire(this.#emitter, type, payload, errorCb, signal)
  }

  /**
   * Emits an event and returns the payload for simple request/response flows.
   * Listeners can mutate the payload object to provide responses.
   *
   * @param {string} type - Event name to dispatch.
   * @param {unknown} [payload] - Data to send with the event (will be returned).
   * @returns {unknown} The payload after listeners have processed it.
   */
  request(type, payload={}) {
    Valid.type(type, "String", {allowEmpty: false})

    this.#emitter.emit(type, payload)

    return payload
  }

  /**
   * Registers a listener for the given event type.
   *
   * @param {string} type - Event name to listen for.
   * @param {(payload: unknown) => undefined} handler - Listener callback.
   * @param {EventEmitter} [emitter] - The EventEmitter to attach to. Default is internal emitter.
   * @param {NotifyEventOptions} [options] - Options for the listener.
   * @returns {() => undefined} Dispose function to unregister the handler.
   */
  on(type, handler, emitter=this.#emitter, options=undefined) {
    Valid.type(type, "String", {allowEmpty: false})
    Valid.type(handler, "Function")

    if(options?.once) {
      emitter.once(type, handler, options)
    } else {
      emitter.on(type, handler, options)
    }

    return () => this.off(type, handler, emitter)
  }

  /**
   * Removes a previously registered listener for the given event type.
   *
   * @param {string} type - Event name to remove.
   * @param {(payload: unknown) => undefined} handler - Listener callback to detach.
   * @param {EventEmitter} [emitter] - The EventEmitter from which to remove. Default is internal emitter.
   * @returns {undefined}
   */
  off(type, handler, emitter=this.#emitter) {
    Valid.type(type, "String", {allowEmpty: false})

    emitter.off(type, handler)
  }
}

export default new Notify()
