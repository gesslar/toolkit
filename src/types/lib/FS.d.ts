/**
 * File system utility class for path operations and file discovery.
 */
export default class FS {
    static fdTypes: readonly string[];
    static upperFdTypes: readonly string[];
    static fdType: any;
    /**
     * Fix slashes in a path
     *
     * @static
     * @param {string} pathName - The path to fix
     * @returns {string} The fixed path
     */
    static fixSlashes(pathName: string): string;
    /**
     * Convert a path to a URI
     *
     * @static
     * @param {string} pathName - The path to convert
     * @returns {string} The URI
     */
    static pathToUri(pathName: string): string;
    /**
     * Convert a URI to a path
     *
     * @static
     * @param {string} pathName - The URI to convert
     * @returns {string} The path
     */
    static uriToPath(pathName: string): string;
    /**
     * Retrieve all files matching a specific glob pattern.
     *
     * @static
     * @param {string|Array<string>} glob - The glob pattern(s) to search.
     * @returns {Promise<Array<FileObject>>} A promise that resolves to an array of file objects
     * @throws {Sass} If the input is not a string or array of strings.
     * @throws {Sass} If the glob pattern array is empty or for other search failures.
     */
    static getFiles(glob: string | Array<string>): Promise<Array<FileObject>>;
    /**
     * Computes the relative path from one file or directory to another.
     *
     * If the target is outside the source (i.e., the relative path starts with ".."),
     * returns the absolute path to the target instead.
     *
     * @static
     * @param {FileObject|DirectoryObject} from - The source file or directory object
     * @param {FileObject|DirectoryObject} to - The target file or directory object
     * @returns {string} The relative path from `from` to `to`, or the absolute path if not reachable
     */
    static relativeOrAbsolutePath(from: FileObject | DirectoryObject, to: FileObject | DirectoryObject): string;
    /**
     * Merge two paths by finding overlapping segments and combining them efficiently
     *
     * @static
     * @param {string} path1 - The first path
     * @param {string} path2 - The second path to merge with the first
     * @param {string} [sep] - The path separator to use (defaults to system separator)
     * @returns {string} The merged path
     */
    static mergeOverlappingPaths(path1: string, path2: string, sep?: string): string;
    /**
     * Resolve a path relative to another path using various strategies
     * Handles absolute paths, relative navigation, and overlap-based merging
     *
     * @static
     * @param {string} fromPath - The base path to resolve from
     * @param {string} toPath - The target path to resolve
     * @returns {string} The resolved path
     */
    static resolvePath(fromPath: string, toPath: string): string;
    /**
     * Creates a new temporary directory and wraps it in a DirectoryObject.
     *
     * When called without a parent, creates a new temporary directory in the OS
     * temp folder with a unique name. When called with a parent DirectoryObject,
     * creates a subdirectory within that parent.
     *
     * The parent directory (if provided) must:
     * - Be marked as temporary
     * - Actually exist on the filesystem
     * - Have lineage tracing back to the OS temp directory
     *
     * These validations ensure that only legitimately temporary directories can
     * be created and later removed with the remove() method.
     *
     * @static
     * @async
     * @param {string} name - The base name for the temporary directory. When creating a root temp directory, a random suffix will be appended for uniqueness.
     * @param {DirectoryObject|null} [parent] - Optional parent DirectoryObject to create this directory within. Must be a temporary directory itself.
     * @returns {Promise<DirectoryObject>} A DirectoryObject representing the created temporary directory, with the temporary flag set to true.
     * @throws {Sass} If name is not a string
     * @throws {Sass} If parent is provided but is not a DirectoryObject
     * @throws {Sass} If parent is not marked as temporary
     * @throws {Sass} If parent does not exist
     * @throws {Sass} If parent's lineage does not trace back to the OS temp directory
     * @example
     * // Create a standalone temporary directory
     * const tempDir = await FS.tempDirectory("my-temp")
     * console.log(tempDir.temporary) // true
     * console.log(tempDir.path) // /tmp/my-temp-abc123 (on Unix)
     *
     * @example
     * // Create nested temporary directories
     * const parent = await FS.tempDirectory("parent")
     * const child = await FS.tempDirectory("child", parent)
     * console.log(child.path.startsWith(parent.path)) // true
     * await parent.remove() // Removes both parent and child
     */
    static tempDirectory(name: string, parent?: DirectoryObject | null): Promise<DirectoryObject>;
}
export type FileObject = import("./FileObject.js").default;
export type DirectoryObject = import("./DirectoryObject.js").default;
import DirectoryObject from "./DirectoryObject.js";
//# sourceMappingURL=FS.d.ts.map