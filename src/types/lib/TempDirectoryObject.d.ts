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
    /**
     * Constructs a TempDirectoryObject instance and creates the directory.
     *
     * The directory is created synchronously during construction, so it will
     * exist immediately after the constructor returns.
     *
     * If no name is provided, uses the OS temp directory directly. If a name
     * is provided without a parent, creates a new directory with a unique suffix.
     * If a parent is provided, creates a subdirectory within that parent.
     *
     * @param {string?} [name] - Base name for the temp directory (if empty/null, uses OS temp dir)
     * @param {TempDirectoryObject?} [parent] - Optional parent temporary directory
     * @throws {Sass} If name is absolute
     * @throws {Sass} If name is empty (when parent is provided)
     * @throws {Sass} If name contains path separators
     * @throws {Sass} If parent is provided but not a temporary directory
     * @throws {Sass} If parent's lineage does not trace back to the OS temp directory
     * @throws {Sass} If directory creation fails
     * @example
     * // Use OS temp directory directly
     * const temp = new TempDirectoryObject()
     * console.log(temp.path) // "/tmp"
     *
     * @example
     * // Create with unique name
     * const temp = new TempDirectoryObject("myapp")
     * console.log(temp.path) // "/tmp/myapp-ABC123"
     *
     * @example
     * // Nested temp directories
     * const parent = new TempDirectoryObject("parent")
     * const child = new TempDirectoryObject("child", parent)
     * await parent.remove() // Removes both parent and child
     */
    constructor(name?: string | null, parent?: TempDirectoryObject | null);
    /**
     * Creates a new TempDirectoryObject by extending this directory's path.
     *
     * Validates that the resulting path remains within the temp directory tree.
     *
     * @param {string} newPath - The path segment to append
     * @returns {TempDirectoryObject} A new TempDirectoryObject with the extended path
     * @throws {Sass} If the path would escape the temp directory
     * @throws {Sass} If the path is absolute
     * @throws {Sass} If the path contains traversal (..)
     * @example
     * const temp = new TempDirectoryObject("myapp")
     * const subDir = temp.getDirectory("data")
     * console.log(subDir.path) // "/tmp/myapp-ABC123/data"
     */
    getDirectory(newPath: string): TempDirectoryObject;
    /**
     * Creates a new FileObject by extending this directory's path.
     *
     * Validates that the resulting path remains within the temp directory tree.
     *
     * @param {string} filename - The filename to append
     * @returns {FileObject} A new FileObject with the extended path
     * @throws {Sass} If the path would escape the temp directory
     * @throws {Sass} If the path is absolute
     * @throws {Sass} If the path contains traversal (..)
     * @example
     * const temp = new TempDirectoryObject("myapp")
     * const file = temp.getFile("config.json")
     * console.log(file.path) // "/tmp/myapp-ABC123/config.json"
     */
    getFile(filename: string): FileObject;
    #private;
}
import CappedDirectoryObject from "./CappedDirectoryObject.js";
//# sourceMappingURL=TempDirectoryObject.d.ts.map