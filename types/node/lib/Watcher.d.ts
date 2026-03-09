/**
 * @import FileObject from "./FileObject.js"
 * @import DirectoryObject from "./DirectoryObject.js"
 */
export const OverFlowBehaviour: Readonly<{
    IGNORE: "ignore";
    THROW: "throw";
}>;
export default class Watcher {
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
     * Stop watching all targets.
     */
    stopWatching(): void;
    #private;
}
import type FileObject from "./FileObject.js";
import type DirectoryObject from "./DirectoryObject.js";
//# sourceMappingURL=Watcher.d.ts.map