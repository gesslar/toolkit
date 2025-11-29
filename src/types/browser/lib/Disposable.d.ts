/**
 * Simple lifecycle helper that tracks disposer callbacks.
 * Register any teardown functions and call dispose() to run them in reverse.
 */
export class Disposable {
    /**
     * Registers a disposer callback to be executed when disposed.
     *
     * @param {() => void} disposer - Cleanup callback.
     * @returns {() => void} Function to unregister the disposer.
     */
    registerDisposer(disposer: () => void): () => void;
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
declare const _default: Disposable;
export default _default;
//# sourceMappingURL=Disposable.d.ts.map