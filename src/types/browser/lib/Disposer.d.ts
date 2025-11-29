/**
 * Simple lifecycle helper that tracks disposer callbacks.
 * Register any teardown functions and call dispose() to run them in reverse.
 */
export class Disposer {
    /**
     * Registers a disposer callback to be executed when disposed.
     *
     * Accepts one or more callbacks (or a single array) and returns matching
     * unregisters. A single disposer returns a single unregister for
     * convenience.
     *
     * @param {...(() => void)|Array<() => void>} disposers - Cleanup callbacks.
     * @returns {(() => void)|Array<() => void>} Unregister function(s).
     */
    register(...disposers: ((() => void) | Array<() => void>)[]): (() => void) | Array<() => void>;
    /**
     * Runs all registered disposers in reverse order.
     *
     * @returns {void}
     */
    dispose(): void;
    /**
     * Whether disposal has run.
     *
     * @returns {boolean} True when dispose() has already been called.
     */
    get disposed(): boolean;
    /**
     * Read-only list of registered disposers.
     *
     * @returns {Array<() => void>} Snapshot of disposer callbacks.
     */
    get disposers(): Array<() => void>;
    #private;
}
declare const _default: Disposer;
export default _default;
//# sourceMappingURL=Disposer.d.ts.map