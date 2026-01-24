/**
 * Thin wrapper around `window` event handling to centralize emit/on/off
 * helpers. Used to dispatch simple CustomEvents and manage listeners in one
 * place.
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
   * Emits a CustomEvent without expecting a return value.
   *
   * @param {string} type - Event name to dispatch.
   * @param {unknown} [payload] - Value assigned to `event.detail`.
   * @param {boolean | NotifyEventOptions} [options] - CustomEvent options or boolean to set `bubbles`.
   * @returns {void}
   */
  emit(type, payload=undefined, options=undefined) {
    const evt = new CustomEvent(type, this.#buildEventInit(payload, options))
    window.dispatchEvent(evt)
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
    window.dispatchEvent(evt)

    return evt.detail
  }

  /**
   * Registers a listener for the given event type on an HTMLElement (or
   * window, if not specified).
   *
   * @param {string} type - Event name to listen for.
   * @param {(evt: Notify) => void} handler - Listener callback.
   * @param {HTMLElement | Window} [element] - The object to which to attach the handler. Default is window.
   * @param {boolean | object} [options] - Options to pass to addEventListener.
   * @returns {() => void} Dispose function to unregister the handler.
   */
  on(type, handler, element=window, options=undefined) {
    if(!(typeof type === "string" && type))
      throw new Error("No event 'type' specified to listen for.")

    if(typeof handler !== "function")
      throw new Error("No handler function specified.")

    element.addEventListener(type, handler, options)

    return () => this.off(type, handler, element, options)
  }

  /**
   * Removes a previously registered listener for the given event type.
   *
   * @param {string} type - Event name to remove.
   * @param {(evt: Notify) => void} handler - Listener callback to detach.
   * @param {HTMLElement | Window} [element] - The object from which to remove the handler. Default is window.
   * @param {boolean | object} [options] - Options to pass to removeEventListener.
   * @returns {void}
   */
  off(type, handler, element=window, options=undefined) {
    element.removeEventListener(type, handler, options)
  }

  #buildEventInit(detail, options) {
    if(typeof options === "boolean")
      return {detail, bubbles: options}

    if(typeof options === "object" && options !== null)
      return {detail, ...options}

    return {detail}
  }
}

export default new Notify()
