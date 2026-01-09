/**
 * File system utility class for path operations and file discovery.
 */
export default class FileSystem {
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
    static pathToUrl(pathName: string): string;
    /**
     * Convert a URI to a path
     *
     * @static
     * @param {string} pathName - The URI to convert
     * @returns {string} The path
     */
    static urlToPath(pathName: string): string;
    /**
     * Computes the relative path from one file or directory to another.
     *
     * If the target is outside the source (i.e., the relative path starts with
     * ".."), returns the absolute path to the target instead.
     *
     * @static
     * @param {FileObject|DirectoryObject} from - The source file or directory object
     * @param {FileObject|DirectoryObject} to - The target file or directory object
     * @returns {string} The relative path from `from` to `to`, or the absolute path if not reachable
     */
    static relativeOrAbsolute(from: FileObject | DirectoryObject, to: FileObject | DirectoryObject): string;
    /**
     * Computes the relative path from one file or directory to another.
     *
     * If the target is outside the source (i.e., the relative path starts with
     * ".."), returns the absolute path to the target instead.
     *
     * @static
     * @param {string} from - The source file or directory object
     * @param {string} to - The target file or directory object
     * @returns {string} The relative path from `from` to `to`, or the absolute path if not reachable
     */
    static relativeOrAbsolutePath(from: string, to: string): string;
    /**
     * Merge two paths by finding overlapping segments and combining them
     * efficiently
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
     * Check if a candidate path is contained within a container path.
     *
     * @static
     * @param {string} container - The container path to check against
     * @param {string} candidate - The candidate path that might be contained
     * @returns {boolean} True if candidate is within container, false otherwise
     * @throws {Sass} If container is not a non-empty string
     * @throws {Sass} If candidate is not a non-empty string
     * @example
     * FS.pathContains("/home/user", "/home/user/docs") // true
     * FS.pathContains("/home/user", "/home/other") // false
     */
    static pathContains(container: string, candidate: string): boolean;
    /**
     * Convert an absolute path to a relative path by finding overlapping segments.
     * Returns the relative portion of the 'to' path after the last occurrence
     * of the final segment from the 'from' path.
     *
     * @static
     * @param {string} from - The base path to calculate relative from
     * @param {string} to - The target path to make relative
     * @param {string} [sep=path.sep] - The path separator to use (defaults to system separator)
     * @returns {string|null} The relative path, empty string if paths are identical, or null if no overlap found
     * @example
     * FS.toRelativePath("/projects/toolkit", "/projects/toolkit/src") // "src"
     * FS.toRelativePath("/home/user", "/home/user") // ""
     * FS.toRelativePath("/projects/app", "/other/path") // null
     */
    static toRelativePath(from: string, to: string, sep?: string): string | null;
    /**
     * Find the common root path between two paths by identifying overlapping segments.
     * Returns the portion of 'from' that matches up to the overlap point in 'to'.
     *
     * @static
     * @param {string} from - The first path to compare
     * @param {string} to - The second path to find common root with
     * @param {string} [sep=path.sep] - The path separator to use (defaults to system separator)
     * @returns {string|null} The common root path, the original path if identical, or null if no overlap found
     * @throws {Sass} If from is not a non-empty string
     * @throws {Sass} If to is not a non-empty string
     * @example
     * FS.getCommonRootPath("/projects/toolkit/src", "/projects/toolkit/tests") // "/projects/toolkit"
     * FS.getCommonRootPath("/home/user", "/home/user") // "/home/user"
     * FS.getCommonRootPath("/projects/app", "/other/path") // null
     */
    static getCommonRootPath(from: string, to: string, sep?: string): string | null;
    /**
     * @typedef {object} PathParts
     * @property {string} base - The file name with extension
     * @property {string} dir - The directory path
     * @property {string} ext - The file extension (including dot)
     */
    /**
     * Deconstruct a file or directory name into parts.
     *
     * @static
     * @param {string} pathName - The file/directory name to deconstruct
     * @returns {PathParts} The filename parts
     * @throws {Sass} If not a string of more than 1 character
     */
    static pathParts(pathName: string): {
        /**
         * - The file name with extension
         */
        base: string;
        /**
         * - The directory path
         */
        dir: string;
        /**
         * - The file extension (including dot)
         */
        ext: string;
    };
    /**
     * Convert a virtual capped path to its real filesystem path.
     * For capped objects, resolves the virtual path relative to the cap's real path.
     * For uncapped objects, returns the path unchanged.
     *
     * @static
     * @param {FileObject|DirectoryObject} fileOrDirectoryObject - The file or directory object to convert
     * @returns {string} The real filesystem path
     * @throws {Sass} If parameter is not a FileObject or DirectoryObject
     * @example
     * const temp = new TempDirectoryObject("myapp")
     * const file = temp.getFile("/config.json")
     * FS.virtualToRealPath(file) // "/tmp/myapp-ABC123/config.json"
     *
     * @example
     * const regular = new FileObject("/home/user/file.txt")
     * FS.virtualToRealPath(regular) // "/home/user/file.txt"
     */
    static virtualToRealPath(fileOrDirectoryObject: FileObject | DirectoryObject): string;
    /**
     * Returns the current working directory as a string.
     *
     * @returns {string} The current working directory
     */
    static get cwd(): string;
    /**
     * Compute the relative path from another file or directory to this instance.
     *
     * If the target is outside the source (i.e., the relative path starts with ".."),
     * returns the absolute path to this instance instead.
     *
     * @param {FileObject|DirectoryObject} fileOrDirectoryObject - The source file or directory object
     * @returns {string} The relative path from the source to this instance, or the absolute path if not reachable
     * @throws {Sass} If the parameter is not a FileObject or DirectoryObject
     */
    relativeTo(fileOrDirectoryObject: FileObject | DirectoryObject): string;
}
export type FileObject = import("./FileObject.js").default;
export type DirectoryObject = import("./DirectoryObject.js").default;
//# sourceMappingURL=FileSystem.d.ts.map