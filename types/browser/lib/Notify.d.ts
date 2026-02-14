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
     * Registers a listener for the given event type on an EventTarget.
     * Defaults to window when no element is provided.
     *
     * @param {string} type - Event name to listen for.
     * @param {(evt: Event) => void} handler - Listener callback.
     * @param {EventTarget} [element] - The target to attach the handler to. Defaults to window.
     * @param {boolean | object} [options] - Options to pass to addEventListener.
     * @returns {() => void} Dispose function to unregister the handler.
     */
    on(type: string, handler: (evt: Event) => void, element?: EventTarget, options?: boolean | object): () => void;
    /**
     * Removes a previously registered listener for the given event type.
     *
     * @param {string} type - Event name to remove.
     * @param {(evt: Event) => void} handler - Listener callback to detach.
     * @param {EventTarget} [element] - The target to remove the handler from. Defaults to window.
     * @param {boolean | object} [options] - Options to pass to removeEventListener.
     * @returns {void}
     */
    off(type: string, handler: (evt: Event) => void, element?: EventTarget, options?: boolean | object): void;
    #private;
}
declare const _default: Notify;
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