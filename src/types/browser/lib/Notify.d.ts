declare const _default: {
    /** @type {string} Display name for debugging. */
    name: string;
    /**
     * Emits a CustomEvent without expecting a return value.
     *
     * @param {string} type - Event name to dispatch.
     * @param {unknown} [payload] - Value assigned to `event.detail`.
     * @param {boolean | NotifyEventOptions} [options] - CustomEvent options or boolean to set `bubbles`.
     * @returns {void}
     */
    emit(type: string, payload?: unknown, options?: boolean | NotifyEventOptions): void;
    /**
     * Emits a CustomEvent and returns the detail for simple request/response flows.
     *
     * @param {string} type - Event name to dispatch.
     * @param {unknown} [payload] - Value assigned to `event.detail`.
     * @param {boolean | NotifyEventOptions} [options] - CustomEvent options or boolean to set `bubbles`.
     * @returns {unknown} The detail placed on the CustomEvent.
     */
    request(type: string, payload?: unknown, options?: boolean | NotifyEventOptions): unknown;
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
    on(type: string, handler: (evt: /*elided*/ any) => void, element?: HTMLElement | Window, options?: boolean | object): () => void;
    /**
     * Removes a previously registered listener for the given event type.
     *
     * @param {string} type - Event name to remove.
     * @param {(evt: Notify) => void} handler - Listener callback to detach.
     * @param {HTMLElement | Window} [element] - The object from which to remove the handler. Default is window.
     * @param {boolean | object} [options] - Options to pass to removeEventListener.
     * @returns {void}
     */
    off(type: string, handler: (evt: /*elided*/ any) => void, element?: HTMLElement | Window, options?: boolean | object): void;
    "__#private@#buildEventInit"(detail: any, options: any): any;
};
export default _default;
export type NotifyEventOptions = {
    /**
     * - Whether the event bubbles up the DOM tree.
     */
    bubbles?: boolean;
    /**
     * - Whether the event can be canceled.
     */
    cancelable?: boolean;
    /**
     * - Whether the event can cross the shadow DOM boundary.
     */
    composed?: boolean;
};
//# sourceMappingURL=Notify.d.ts.map