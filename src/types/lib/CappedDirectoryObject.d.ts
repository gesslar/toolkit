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
     * Creates a CappedDirectoryObject from the current working directory.
     * This is useful when working with pnpx or other tools where you need to
     * cap at the project's root directory determined at runtime.
     *
     * @returns {CappedDirectoryObject} A CappedDirectoryObject capped at the current working directory
     * @example
     * // When using pnpx or similar tools
     * const projectRoot = CappedDirectoryObject.fromCwd()
     * const srcDir = projectRoot.getDirectory("src")
     * // srcDir is capped at the project root
     */
    static fromCwd(): CappedDirectoryObject;
    /**
     * Constructs a CappedDirectoryObject instance.
     *
     * Without a parent, the path becomes both the directory location and the cap
     * (virtual root). With a parent, the path is resolved relative to the parent's
     * cap using virtual path semantics (absolute paths treated as cap-relative).
     *
     * @param {string} [directory="."] - Directory path (becomes cap if no parent, else relative to parent's cap, defaults to current directory)
     * @param {CappedDirectoryObject?} [parent] - Optional parent capped directory
     * @throws {Sass} If parent is provided but not a CappedDirectoryObject
     * @throws {Sass} If the resulting path would escape the cap
     * @example
     * // Create new capped directory at current directory
     * const cwd = new CappedDirectoryObject()
     * // path: process.cwd(), cap: process.cwd()
     *
     * @example
     * // Create new capped directory
     * const cache = new CappedDirectoryObject("/home/user/.cache")
     * // path: /home/user/.cache, cap: /home/user/.cache
     *
     * @example
     * // Create subdirectory with parent
     * const data = new CappedDirectoryObject("data", cache)
     * // path: /home/user/.cache/data, cap: /home/user/.cache
     *
     * @example
     * // Virtual absolute path with parent
     * const config = new CappedDirectoryObject("/etc/config", cache)
     * // path: /home/user/.cache/etc/config, cap: /home/user/.cache
     */
    constructor(directory?: string, source?: any);
    get isCapped(): boolean;
    get cap(): any;
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
     * Returns the parent directory of this capped directory.
     * Returns null only if this directory is at the cap (the "root" of the capped tree).
     *
     * Note: The returned parent is a CappedDirectoryObject with the same cap.
     * This maintains the capping behavior throughout the directory hierarchy.
     *
     * @returns {CappedDirectoryObject|null} Parent directory or null if at cap root
     * @example
     * const capped = new TempDirectoryObject("myapp")
     * const subdir = capped.getDirectory("data")
     * console.log(subdir.parent.path) // Returns parent CappedDirectoryObject
     * console.log(capped.parent) // null (at cap root)
     */
    get parent(): CappedDirectoryObject | null;
    /**
     * Override read to use real filesystem path and return capped objects.
     *
     * @param {string} [pat=""] - Optional glob pattern
     * @returns {Promise<{files: Array<FileObject>, directories: Array}>} Directory contents
     */
    read(...arg: any[]): Promise<{
        files: Array<FileObject>;
        directories: any[];
    }>;
    /**
     * Generator that walks up the directory tree, yielding each parent directory.
     * Starts from the current directory and yields each parent until reaching the root.
     *
     * @override
     * @returns {CappedDirectoryObject} Generator yielding parent DirectoryObject instances
     * @example
     * const dir = new DirectoryObject('/path/to/deep/directory')
     * for(const parent of dir.walkUp) {
     *   console.log(parent.path)
     *   // /path/to/deep/directory
     *   // /path/to/deep
     *   // /path/to
     *   // /path
     *   // /
     * }
     */
    override get walkUp(): CappedDirectoryObject;
    #private;
}
import DirectoryObject from "./DirectoryObject.js";
//# sourceMappingURL=CappedDirectoryObject.d.ts.map