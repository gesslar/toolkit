/**
 * Thin wrapper around event dispatching to centralize emit/on/off helpers.
 * Uses `globalThis` for safe resolution in server-side build environments
 * (e.g. esm.sh) while defaulting to `window` at runtime.
 */

/**
 * @typedef {object} NotifyEventOptions
 * @property {boolean} [bubbles] - Whether the event bubbles up the DOM tree.
 * @property {boolean} [cancelable] - Whether the event can be canceled.
 * @property {boolean} [composed] - Whether the event can cross the shadow DOM boundary.
 */
export class Notify {
  /** @type {string} Display name for debugging. */
  name = "Notify"

  /**
   * Returns the default event target (window or globalThis).
   *
   * @returns {EventTarget} The default event target.
   */
  get #target() {
    return globalThis.window ?? globalThis
  }

  /**
   * Emits a CustomEvent without expecting a return value.
   *
   * @param {string} type - Event name to dispatch.
   * @param {unknown} [payload] - Value assigned to `event.detail`.
   * @param {boolean | NotifyEventOptions} [options] - CustomEvent options or boolean to set `bubbles`.
   * @returns {void}
   */
  emit(type, payload=undefined, options=undefined) {
    const evt = new CustomEvent(type, this.#buildEventInit(payload, options))
    this.#target.dispatchEvent(evt)
  }

  /**
   * Emits a CustomEvent and returns the detail for simple request/response flows.
   *
   * @param {string} type - Event name to dispatch.
   * @param {unknown} [payload] - Value assigned to `event.detail`.
   * @param {boolean | NotifyEventOptions} [options] - CustomEvent options or boolean to set `bubbles`.
   * @returns {unknown} The detail placed on the CustomEvent.
   */
  request(type, payload={}, options=undefined) {
    const evt = new CustomEvent(type, this.#buildEventInit(payload, options))
    this.#target.dispatchEvent(evt)

    return evt.detail
  }

  /**
   * Registers a listener for the given event type on an EventTarget.
   * Defaults to window when no element is provided.
   *
   * @param {string} type - Event name to listen for.
   * @param {(evt: Event) => void} handler - Listener callback.
   * @param {EventTarget} [element] - The target to attach the handler to. Defaults to window.
   * @param {boolean | object} [options] - Options to pass to addEventListener.
   * @returns {() => void} Dispose function to unregister the handler.
   */
  on(type, handler, element=undefined, options=undefined) {
    if(!(typeof type === "string" && type))
      throw new Error("No event 'type' specified to listen for.")

    if(typeof handler !== "function")
      throw new Error("No handler function specified.")

    const target = element ?? this.#target
    target.addEventListener(type, handler, options)

    return () => this.off(type, handler, target, options)
  }

  /**
   * Removes a previously registered listener for the given event type.
   *
   * @param {string} type - Event name to remove.
   * @param {(evt: Event) => void} handler - Listener callback to detach.
   * @param {EventTarget} [element] - The target to remove the handler from. Defaults to window.
   * @param {boolean | object} [options] - Options to pass to removeEventListener.
   * @returns {void}
   */
  off(type, handler, element=undefined, options=undefined) {
    const target = element ?? this.#target
    target.removeEventListener(type, handler, options)
  }

  /**
   * Builds the CustomEvent init object from detail and options.
   *
   * @param {unknown} detail - The event detail payload.
   * @param {boolean | NotifyEventOptions} [options] - Event options.
   * @returns {object} The event init object.
   */
  #buildEventInit(detail, options) {
    if(typeof options === "boolean")
      return {detail, bubbles: options}

    if(typeof options === "object" && options !== null)
      return {detail, ...options}

    return {detail}
  }
}

export default new Notify()
