import type FileObject from "./FileObject.js";
import type DirectoryObject from "./DirectoryObject.js";
/**
 * @import FileObject from "./FileObject.js"
 * @import DirectoryObject from "./DirectoryObject.js"
 */
export declare const OverFlowBehaviour: Readonly<{
    IGNORE: "ignore";
    THROW: "throw";
}>;
export default class Watcher {
    #private;
    /**
     * Watch one or more file/directory targets for changes, invoking a callback
     * with debounce protection.
     *
     * @param {FileObject|DirectoryObject|Array.<(FileObject|DirectoryObject)>} targets - The target(s) to watch
     * @param {object} options - Watch options
     * @param {(target: FileObject|DirectoryObject) => void} options.onChange - Callback invoked on change
     * @param {number} [options.debounceMs=50] - Debounce interval in milliseconds
     * @param {boolean} [options.persistent=true] - Keep the process alive while watching
     * @param {boolean} [options.recursive=false] - Watch subdirectories (directories only)
     * @param {string} [options.overflow="ignore"] - Overflow behaviour ("ignore" or "throw")
     * @returns {Promise<undefined>}
     */
    watch(targets: FileObject | DirectoryObject | Array<(FileObject | DirectoryObject)>, { onChange, debounceMs, persistent, recursive, overflow }?: {
        onChange: (target: FileObject | DirectoryObject) => void;
        debounceMs?: number;
        persistent?: boolean;
        recursive?: boolean;
        overflow?: string;
    }): Promise<undefined>;
    /**
     * Waits for a target's events to go quiet for `debounceMs`, then calls
     * `onChange` once. Events that arrive during the callback start another
     * round. Runs separately from the event loop so events keep draining
     * while it waits.
     *
     * @private
     * @param {FileObject|DirectoryObject} target - The watched target
     * @param {{busy: boolean, pending: boolean}} state - The target's state
     * @param {number} debounceMs - Quiet interval in milliseconds
     * @param {(target: FileObject|DirectoryObject) => void} onChange - Callback invoked on change
     * @returns {Promise<undefined>}
     */
    private #settle;
    /**
     * Stop watching all targets.
     */
    stopWatching(): void;
}
//# sourceMappingURL=Watcher.d.ts.map