declare const _default: {
    /** @type {string} Display name for debugging. */
    name: string;
    /** @type {EventEmitter} Internal event emitter */
    "__#private@#emitter": EventEmitter;
    /**
     * Emits an event without expecting a return value.
     *
     * @param {string} type - Event name to dispatch.
     * @param {unknown} [payload] - Data to send with the event.
     * @returns {void}
     */
    emit(type: string, payload?: unknown): void;
    /**
     * Emits an event and returns the payload for simple request/response flows.
     * Listeners can mutate the payload object to provide responses.
     *
     * @param {string} type - Event name to dispatch.
     * @param {unknown} [payload] - Data to send with the event (will be returned).
     * @returns {unknown} The payload after listeners have processed it.
     */
    request(type: string, payload?: unknown): unknown;
    /**
     * Registers a listener for the given event type.
     *
     * @param {string} type - Event name to listen for.
     * @param {(payload: unknown) => void} handler - Listener callback.
     * @param {EventEmitter} [emitter] - The EventEmitter to attach to. Default is internal emitter.
     * @param {NotifyEventOptions} [options] - Options for the listener.
     * @returns {() => void} Dispose function to unregister the handler.
     */
    on(type: string, handler: (payload: unknown) => void, emitter?: EventEmitter, options?: NotifyEventOptions): () => void;
    /**
     * Removes a previously registered listener for the given event type.
     *
     * @param {string} type - Event name to remove.
     * @param {(payload: unknown) => void} handler - Listener callback to detach.
     * @param {EventEmitter} [emitter] - The EventEmitter from which to remove. Default is internal emitter.
     * @returns {void}
     */
    off(type: string, handler: (payload: unknown) => void, emitter?: EventEmitter): void;
};
export default _default;
export type NotifyEventOptions = {
    /**
     * - Whether the listener should be invoked only once.
     */
    once?: boolean;
    /**
     * - An AbortSignal to remove the listener.
     */
    signal?: AbortSignal;
};
//# sourceMappingURL=Notify.d.ts.map