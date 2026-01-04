/**
 * TempDirectoryObject extends CappedDirectoryObject with the cap set to
 * the OS's temporary directory. Temporary directories are created
 * synchronously during construction and exist immediately.
 *
 * All path operations are validated to ensure they remain within the temp
 * directory hierarchy for security.
 *
 * @augments CappedDirectoryObject
 */
export default class TempDirectoryObject extends CappedDirectoryObject {
    /**
     * TempDirectoryObject does not support fromCwd() since it is specifically
     * designed to work within the OS temporary directory tree.
     *
     * @throws {Sass} Always throws an error
     */
    static fromCwd(): void;
    get isTemporary(): boolean;
    get cap(): any;
    /**
     * Recursively removes a temporary directory and all its contents.
     *
     * This method will delete all files and subdirectories within this directory,
     * then delete the directory itself. It only works on directories explicitly
     * marked as temporary for safety.
     *
     * @async
     * @returns {Promise<void>}
     * @throws {Sass} If the directory is not marked as temporary
     * @throws {Sass} If the directory deletion fails
     * @example
     * const tempDir = new TempDirectoryObject("my-temp")
     * await tempDir.assureExists()
     * // ... use the directory ...
     * await tempDir.remove() // Recursively deletes everything
     */
    remove(): Promise<void>;
    #private;
}
import CappedDirectoryObject from "./CappedDirectoryObject.js";
//# sourceMappingURL=TempDirectoryObject.d.ts.map