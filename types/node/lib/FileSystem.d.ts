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
     * Convert a file URL to a path.
     *
     * @static
     * @param {string} fileUrl - The file URL to convert (e.g., import.meta.url)
     * @returns {string} The file path
     * @example
     * const currentFile = FileSystem.urlToPath(import.meta.url)
     */
    static urlToPath(fileUrl: string): string;
    /**
     * Computes the relative path from one file or directory to another.
     *
     * If the target is outside the source (i.e., the relative path starts with
     * ".."), returns the absolute path to the target instead.
     *
     * @static
     * @param {import("./FileObject.js").default|import("./DirectoryObject.js").default} from - The source file or directory object
     * @param {import("./FileObject.js").default|import("./DirectoryObject.js").default} to - The target file or directory object
     * @returns {string} The relative path from `from` to `to`, or the absolute path if not reachable
     */
    static relativeOrAbsolute(from: import("./FileObject.js").default | import("./DirectoryObject.js").default, to: import("./FileObject.js").default | import("./DirectoryObject.js").default): string;
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
     * FS.toLocalRelativePath("/projects/toolkit", "/projects/toolkit/src") // "src"
     * FS.toLocalRelativePath("/home/user", "/home/user") // ""
     * FS.toLocalRelativePath("/projects/app", "/other/path") // null
     */
    static toLocalRelativePath(from: string, to: string, sep?: string): string | null;
    /**
     * Computes the relative path from one path to another using Node's path.relative.
     *
     * Unlike toLocalRelativePath which uses overlap detection, this method uses
     * standard relative path calculation and may return paths with ".." segments.
     *
     * @static
     * @param {string} from - The base path to calculate relative from
     * @param {string} to - The target path to make relative
     * @returns {string} The relative path, or empty string if paths are identical
     * @example
     * FS.toRelativePath("/home/user", "/home/user/docs") // "docs"
     * FS.toRelativePath("/home/user", "/home/user") // ""
     * FS.toRelativePath("/home/user", "/home/other") // "../other"
     */
    static toRelativePath(from: string, to: string): string;
    /**
     * Find where a path's final segment appears in another path, returning the
     * portion of 'from' up to that overlap point.
     *
     * Looks for the last segment of `from` within `to`. If found, returns `from`
     * sliced to the index where that segment appears in `to`.
     *
     * @static
     * @param {string} from - The source path whose final segment to search for
     * @param {string} to - The target path to search within
     * @param {string} [sep=path.sep] - The path separator to use (defaults to system separator)
     * @returns {string|null} The sliced portion of from, the original path if identical, or null if no overlap
     * @throws {Sass} If from is not a non-empty string
     * @throws {Sass} If to is not a non-empty string
     * @example
     * FS.getCommonRootPath("/projects/toolkit", "/projects/toolkit/src") // "/projects/toolkit"
     * FS.getCommonRootPath("/home/user", "/home/user") // "/home/user"
     * FS.getCommonRootPath("/projects/app", "/other/path") // null (no overlap)
     */
    static getCommonRootPath(from: string, to: string, sep?: string): string | null;
    /**
     * @typedef {object} PathParts
     * @property {string} base - The file name with extension
     * @property {string} dir - The directory path
     * @property {string} ext - The file extension (including dot)
     * @property {string} root - The root of the path
     * @property {string} name - The file name without extension
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
        /**
         * - The root of the path
         */
        root: string;
        /**
         * - The file name without extension
         */
        name: string;
    };
    /**
     * Determine whether a string is safe to use as a filename on every common
     * operating system.
     *
     * A name is sane only when it would be legal everywhere, so the checks span
     * the union of platform rules rather than any single OS:
     *
     * - No characters that are illegal on common filesystems. Windows is the
     *   strictest, forbidding `< > : " / \ | ? *` and the control characters
     *   (0x00-0x1F); POSIX is a subset of these.
     * - No trailing dot or space (Windows silently trims them).
     * - Not a Windows reserved device name, with or without an extension
     *   (`CON`, `PRN`, `AUX`, `NUL`, `COM1`-`COM9`, `LPT1`-`LPT9`).
     * - Not the relative path indicators `.` or `..`.
     * - No longer than 255 bytes — the per-component limit on ext4, APFS, NTFS
     *   and exFAT. Length is counted in UTF-8 bytes, not characters, so a single
     *   multi-byte codepoint costs more than one toward the limit.
     *
     * @static
     * @param {string} str - The candidate filename to test
     * @returns {boolean} True if the string is a legal filename on every common OS
     * @throws {Sass} If str is not a non-empty string
     * @example
     * FS.sane("report.txt")  // true
     * FS.sane("a/b:c.txt")   // false (illegal character)
     * FS.sane("name ")       // false (trailing space)
     * FS.sane("CON")         // false (reserved on Windows)
     * FS.sane("x".repeat(256))  // false (exceeds 255 bytes)
     */
    static sane(str: string): boolean;
    /**
     * Rewrite a string into a filename that is legal on every common operating
     * system.
     *
     * Applies the union of platform rules (see {@link FileSystem.sane}) so the
     * result is portable regardless of where it is used:
     *
     * - Every character illegal on common filesystems is replaced with
     *   `replacement` (defaults to an underscore).
     * - Trailing dots and spaces are stripped (Windows trims them anyway).
     * - Windows reserved device names are suffixed with `replacement` so they
     *   are no longer reserved (e.g. `CON` becomes `CON_`, `CON.txt` becomes
     *   `CON_.txt`).
     * - Names longer than 255 bytes are truncated to fit that limit. The base
     *   name is shortened while the extension is preserved where it fits, and
     *   truncation never splits a multi-byte UTF-8 codepoint.
     *
     * A custom `replacement` is itself validated: it must contain no illegal
     * characters, otherwise the result could remain unsafe.
     *
     * Note that degenerate inputs can sanitize to an empty string — for example
     * an empty `replacement` applied to a name of only illegal characters, or a
     * relative indicator such as `"."` or `".."` whose trailing dots are
     * stripped. The empty string is not itself a legal filename, so callers that
     * need a guaranteed-usable name should treat an empty result as a signal to
     * fall back to a default of their own.
     *
     * @static
     * @param {string} str - The filename to sanitize
     * @param {string} [replacement] - The substitute for illegal characters (defaults to "_")
     * @returns {string} A filename legal on every common OS, or "" when the input sanitizes to nothing
     * @throws {Sass} If str is not a non-empty string
     * @throws {Sass} If replacement is not a string, or itself contains OS-illegal characters
     * @example
     * FS.sanitize("a/b:c.txt")        // "a_b_c.txt"
     * FS.sanitize("a/b:c.txt", "-")   // "a-b-c.txt"
     * FS.sanitize("name. ")           // "name"
     * FS.sanitize("CON.txt")          // "CON_.txt"
     * FS.sanitize("..")               // "" (caller should supply a fallback)
     */
    static sanitize(str: string, replacement?: string): string;
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
     * @param {import("./FileObject.js").default|import("./DirectoryObject.js").default} fileOrDirectoryObject - The source file or directory object
     * @returns {string} The relative path from the source to this instance, or the absolute path if not reachable
     * @throws {Sass} If the parameter is not a FileObject or DirectoryObject
     */
    relativeTo(fileOrDirectoryObject: import("./FileObject.js").default | import("./DirectoryObject.js").default): string;
    /**
     * Watch this file or directory for changes.
     *
     * @param {object} [options] - Watch options
     * @param {Function} [options.onChange] - Callback invoked on change
     * @param {number} [options.debounceMs] - Debounce interval in milliseconds
     * @param {boolean} [options.persistent] - Keep the process alive while watching
     * @returns {Promise<undefined>}
     */
    watch(options?: {
        onChange?: Function;
        debounceMs?: number;
        persistent?: boolean;
    }): Promise<undefined>;
    /**
     * Stop watching this file or directory for changes.
     */
    stopWatching(): void;
    #private;
}
//# sourceMappingURL=FileSystem.d.ts.map