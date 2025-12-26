/**
 * CappedDirectoryObject extends DirectoryObject with constraints that ensure
 * all operations are restricted to a specific directory tree (the "cap").
 *
 * All path operations are validated to ensure they remain within the
 * cap directory hierarchy for security.
 *
 * @augments DirectoryObject
 */
export default class CappedDirectoryObject extends DirectoryObject {
    /**
     * Constructs a CappedDirectoryObject instance.
     *
     * This is an abstract base class - use subclasses like TempDirectoryObject
     * that define specific caps.
     *
     * @param {string?} name - Base name for the directory (if empty/null, uses cap root)
     * @param {string} cap - The root path that constrains this directory tree
     * @param {CappedDirectoryObject?} [parent] - Optional parent capped directory
     * @param {boolean} [temporary=false] - Whether this is a temporary directory
     * @throws {Sass} If name is absolute
     * @throws {Sass} If name is empty (when parent is provided)
     * @throws {Sass} If name contains path separators
     * @throws {Sass} If parent is not a capped directory
     * @throws {Sass} If parent's lineage does not trace back to the cap
     * @throws {Sass} If the resulting path would escape the cap
     */
    constructor(name: string | null, cap: string, parent?: CappedDirectoryObject | null, temporary?: boolean);
    /**
     * Returns the cap path for this directory.
     *
     * @returns {string} The cap directory path
     */
    get cap(): string;
    /**
     * Returns whether this directory is capped.
     *
     * @returns {boolean} Always true for CappedDirectoryObject instances
     */
    get capped(): boolean;
    /**
     * Returns a generator that walks up to the cap.
     *
     * @returns {Generator<DirectoryObject>} Generator yielding parent directories
     */
    get walkUp(): Generator<DirectoryObject>;
    /**
     * Creates a new CappedDirectoryObject by extending this directory's path.
     *
     * Validates that the resulting path remains within the cap directory tree.
     *
     * @param {string} newPath - The path segment to append
     * @returns {CappedDirectoryObject} A new CappedDirectoryObject with the extended path
     * @throws {Sass} If the path would escape the cap directory
     * @throws {Sass} If the path is absolute
     * @throws {Sass} If the path contains traversal (..)
     * @example
     * const capped = new TempDirectoryObject("myapp")
     * const subDir = capped.getDirectory("data")
     * console.log(subDir.path) // "/tmp/myapp-ABC123/data"
     */
    getDirectory(newPath: string): CappedDirectoryObject;
    #private;
}
import DirectoryObject from "./DirectoryObject.js";
//# sourceMappingURL=CappedDirectoryObject.d.ts.map