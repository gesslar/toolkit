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
     * Returns the real filesystem path (for internal and subclass use).
     *
     * @protected
     * @returns {string} The actual filesystem path
     */
    protected get realPath(): string;
    /**
     * Returns a plain DirectoryObject representing the actual filesystem location.
     * This provides an "escape hatch" from the capped environment to interact
     * with the real filesystem when needed.
     *
     * @returns {DirectoryObject} Uncapped directory object at the real filesystem path
     * @example
     * const temp = new TempDirectoryObject("myapp")
     * const subdir = temp.getDirectory("data")
     *
     * // Work within the capped environment (virtual paths)
     * console.log(subdir.path)        // "/data" (virtual)
     * subdir.getFile("config.json")   // Stays within cap
     *
     * // Break out to real filesystem when needed
     * console.log(subdir.real.path)   // "/tmp/myapp-ABC123/data" (real)
     * subdir.real.parent              // Can traverse outside the cap
     */
    get real(): DirectoryObject;
    /**
     * Returns a generator that walks up to the cap.
     *
     * @returns {Generator<DirectoryObject>} Generator yielding parent directories
     */
    get walkUp(): Generator<DirectoryObject>;
    /**
     * Creates a new CappedDirectoryObject by extending this directory's path.
     *
     * All paths are coerced to remain within the cap directory tree:
     * - Absolute paths (e.g., "/foo") are treated as relative to the cap
     * - Parent traversal ("..") is allowed but clamped at the cap boundary
     * - The cap acts as the virtual root directory
     *
     * @param {string} newPath - The path to resolve (can be absolute or contain ..)
     * @returns {CappedDirectoryObject} A new CappedDirectoryObject with the coerced path
     * @example
     * const capped = new TempDirectoryObject("myapp")
     * const subDir = capped.getDirectory("data")
     * console.log(subDir.path) // "/tmp/myapp-ABC123/data"
     *
     * @example
     * // Absolute paths are relative to cap
     * const abs = capped.getDirectory("/foo/bar")
     * console.log(abs.path) // "/tmp/myapp-ABC123/foo/bar"
     *
     * @example
     * // Excessive .. traversal clamps to cap
     * const up = capped.getDirectory("../../../etc/passwd")
     * console.log(up.path) // "/tmp/myapp-ABC123" (clamped to cap)
     */
    getDirectory(newPath: string): CappedDirectoryObject;
    /**
     * Override read to use real filesystem path and return capped objects.
     *
     * @param {string} [pat=""] - Optional glob pattern
     * @returns {Promise<{files: Array<FileObject>, directories: Array}>} Directory contents
     */
    read(pat?: string): Promise<{
        files: Array<FileObject>;
        directories: any[];
    }>;
    #private;
}
import DirectoryObject from "./DirectoryObject.js";
import FileObject from "./FileObject.js";
//# sourceMappingURL=CappedDirectoryObject.d.ts.map