/**
 * @typedef {object} GeneratorType
 * @property {function(): {value: DirectoryObject, done: boolean}} next
 * @property {function(): GeneratorType} [Symbol.iterator]
 */
/**
 * @typedef {object} DirectoryMeta
 *
 * @property {boolean} isDirectory - Always true for directories
 * @property {string|null} extension - The directory extension (if any)
 * @property {string|null} module - The directory name without extension
 * @property {string|null} name - The directory name
 * @property {DirectoryObject|undefined} parent - The parent DirectoryObject
 * @property {string|null} parentPath - The parent directory path
 * @property {string|null} path - The absolute directory path
 * @property {string|null} sep - Path separator
 * @property {string|null} supplied - User-supplied path
 * @property {Array<string>|null} trail - Path segments
 * @property {URL|null} url - The directory URL
 */
/** * DirectoryObject encapsulates metadata and operations for a directory,
 * providing immutable path resolution, existence checks, and content enumeration.
 *
 * Features:
 * - Immutable metadata (path, name, URL) sealed on construction
 * - Async existence checking and directory creation
 * - Pattern-based content filtering with glob support
 * - Path traversal via walkUp generator
 * - Intelligent path merging for subdirectories and files
 *
 * @property {string} supplied - The original directory path as supplied to constructor
 * @property {string} path - The absolute resolved directory path
 * @property {URL} url - The directory as a file:// URL
 * @property {string} name - The directory name (basename)
 * @property {string} module - The directory name without extension (same as name for directories)
 * @property {string} extension - The directory extension (typically empty string)
 * @property {string} sep - Platform-specific path separator ('/' or '\\')
 * @property {Array<string>} trail - Path segments split by separator
 * @property {boolean} isDirectory - Always true
 * @property {DirectoryObject|null} parent - The parent directory (null if root)
 * @property {Promise<boolean>} exists - Whether the directory exists (async getter)
 *
 * @example
 * // Basic usage
 * const dir = new DirectoryObject("/projects/myapp")
 * console.log(dir.path) // "/projects/myapp"
 * console.log(await dir.exists) // true/false
 *
 * @example
 * // Read directory contents
 * const {files, directories} = await dir.read()
 * const {files: jsFiles} = await dir.read("*.js")
 *
 * @example
 * // Path traversal
 * for(const parent of dir.walkUp) {
 *   console.log(parent.path)
 * }
 *
 * @example
 * // Working with subdirectories and files
 * const subDir = dir.getDirectory("src/lib")
 * const file = dir.getFile("package.json")
 */
export default class DirectoryObject extends FS {
    /**
     * Creates a DirectoryObject from the current working directory.
     * Useful when working with pnpx or other tools where the project root
     * needs to be determined at runtime.
     *
     * @returns {DirectoryObject} A DirectoryObject representing the current working directory
     * @example
     * const projectRoot = DirectoryObject.fromCwd()
     * console.log(projectRoot.path) // process.cwd()
     */
    static fromCwd(): DirectoryObject;
    /**
     * Constructs a DirectoryObject instance.
     *
     * @param {string?} [supplied="."] - The directory path (defaults to current directory)
     */
    constructor(supplied?: string | null);
    /**
     * Returns a JSON-serializable representation of the DirectoryObject.
     *
     * @returns {object} Plain object with directory metadata
     */
    toJSON(): object;
    /**
     * Returns the directory path as a primitive string value.
     *
     * @returns {string} The directory path
     */
    valueOf(): string;
    /**
     * Checks if the directory exists (async).
     *
     * @returns {Promise<boolean>} - A Promise that resolves to true or false
     */
    get exists(): Promise<boolean>;
    /**
     * Return the path as passed to the constructor.
     *
     * @returns {string} The directory path
     */
    get supplied(): string;
    /**
     * Return the resolved path
     *
     * @returns {string} The directory path
     */
    get path(): string;
    /**
     * Returns the URL of the current directory.
     *
     * @returns {URL} The directory URL
     */
    get url(): URL;
    /**
     * Returns the directory name with extension (if any) without the path.
     *
     * @returns {string} The directory name
     */
    get name(): string;
    /**
     * Returns the directory name without extension.
     *
     * @returns {string} The directory name without extension
     */
    get module(): string;
    /**
     * Returns the directory extension (if any).
     *
     * @returns {string} The directory extension including the dot (e.g., '.git')
     */
    get extension(): string;
    /**
     * Returns the platform-specific path separator.
     *
     * @returns {string} The path separator ('/' on Unix, '\\' on Windows)
     */
    get sep(): string;
    /**
     * Returns the directory path split into segments.
     *
     * @returns {Array<string>} Array of path segments
     * @example
     * const dir = new DirectoryObject('/path/to/directory')
     * console.log(dir.trail) // ['', 'path', 'to', 'directory']
     */
    get trail(): Array<string>;
    /**
     * Returns the parent directory of this directory.
     * Returns null if this directory is the root directory.
     * Computed lazily on first access and cached.
     *
     * @returns {DirectoryObject|null} The parent directory or null if root
     * @example
     * const dir = new DirectoryObject('/path/to/directory')
     * console.log(dir.parent.path) // '/path/to'
     *
     * const root = new DirectoryObject('/')
     * console.log(root.parent) // null
     */
    get parent(): DirectoryObject | null;
    /**
     * We're a directory!
     *
     * @returns {boolean} Always true
     */
    get isDirectory(): boolean;
    /**
     * Lists the contents of a directory, optionally filtered by a glob pattern.
     *
     * Returns FileObject and DirectoryObject instances. Symbolic links are
     * resolved to their target type: links to files appear in `files`, links
     * to directories appear in `directories`. Broken symlinks propagate the
     * stat error to the caller.
     *
     * @async
     * @param {string} [pat=""] - Optional glob pattern to filter results (e.g., "*.txt", "test-*")
     * @returns {Promise<{files: Array<FileObject>, directories: Array<DirectoryObject>}>} Object containing arrays of files and directories
     * @example
     * const dir = new DirectoryObject("./src")
     * const {files, directories} = await dir.read()
     * console.log(files) // All files in ./src
     *
     * @example
     * // Filter for specific files
     * const {files} = await dir.read("*.js")
     * console.log(files) // Only .js files in ./src
     */
    read(pat?: string, options?: {}): Promise<{
        files: Array<FileObject>;
        directories: Array<DirectoryObject>;
    }>;
    /**
     * Recursively searches directory tree for files and directories matching a glob pattern.
     * Unlike read(), this method searches recursively through subdirectories.
     *
     * Returns FileObject and DirectoryObject instances. Symbolic links are
     * resolved to their target type: links to files appear in `files`, links
     * to directories appear in `directories`. Broken symlinks propagate the
     * stat error to the caller.
     *
     * @async
     * @param {string} [pat=""] - Glob pattern to filter results
     * @returns {Promise<{files: Array<FileObject>, directories: Array<DirectoryObject>}>} Object containing arrays of matching files and directories
     * @example
     * const dir = new DirectoryObject("./src")
     * const {files} = await dir.glob("**\/*.test.js")
     * console.log(files) // All .test.js files in ./src and subdirectories
     *
     * @example
     * // Find all package.json files recursively
     * const {files} = await dir.glob("**\/package.json")
     */
    glob(pat?: string, options?: {}): Promise<{
        files: Array<FileObject>;
        directories: Array<DirectoryObject>;
    }>;
    /**
     * Ensures a directory exists, creating it if necessary.
     * Gracefully handles the case where the directory already exists.
     *
     * @async
     * @param {object} [options] - Options to pass to fs.mkdir (e.g., {recursive: true, mode: 0o755})
     * @returns {Promise<void>}
     * @throws {Sass} If directory creation fails for reasons other than already existing
     * @example
     * // Create directory recursively
     * const dir = new DirectoryObject('./build/output')
     * await dir.assureExists({recursive: true})
     */
    assureExists(options?: object): Promise<void>;
    /**
     * Generator that walks up the directory tree, yielding each parent directory.
     * Starts from the current directory and yields each parent until reaching the root.
     *
     * @returns {DirectoryObject} Generator yielding parent DirectoryObject instances
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
    get walkUp(): DirectoryObject;
    /**
     * Deletes an empty directory from the filesystem.
     *
     * Recursive deletion is intentionally not supported. If you need to delete
     * a directory with contents, you must imperatively decide your deletion
     * strategy and handle it explicitly.
     *
     * @returns {Promise<void>} Resolves when directory is deleted
     * @throws {Sass} If the directory URL is invalid
     * @throws {Sass} If the directory does not exist
     * @throws {Error} If the directory is not empty (from fs.rmdir)
     * @example
     * const dir = new DirectoryObject('./temp/cache')
     * await dir.delete() // Only works if directory is empty
     */
    delete(): Promise<void>;
    /**
     * Checks if a file exists within this directory.
     *
     * @param {string} filename - The filename to check for
     * @returns {Promise<boolean>} True if the file exists, false otherwise
     */
    hasFile(filename: string): Promise<boolean>;
    /**
     * Checks if a subdirectory exists within this directory.
     *
     * @param {string} dirname - The directory name to check for
     * @returns {Promise<boolean>} True if the directory exists, false otherwise
     */
    hasDirectory(dirname: string): Promise<boolean>;
    /**
     * Creates a new DirectoryObject by extending this directory's path.
     *
     * Paths are always resolved relative to THIS directory. Any attempt to
     * escape via `..` or absolute paths is constrained - the `..` segments
     * are stripped and the remaining path is resolved relative to this directory.
     *
     * On Windows, cross-drive absolute paths (e.g., `D:\foo` when base is `C:\`)
     * are also constrained - the drive root is stripped and the path is resolved
     * relative to this directory.
     *
     * Uses overlapping path segment detection to intelligently combine paths.
     *
     * @param {string} newPath - The path to append to this directory's path.
     * @returns {DirectoryObject} A new DirectoryObject with the extended path.
     * @example
     * const dir = new DirectoryObject("/projects/git/toolkit")
     * const subDir = dir.getDirectory("src/lib")
     * console.log(subDir.path) // "/projects/git/toolkit/src/lib"
     *
     * @example
     * // Path traversal is constrained to this directory
     * const dir = new DirectoryObject("/projects/git/toolkit")
     * const escaped = dir.getDirectory("../../../foo/bar")
     * console.log(escaped.path) // "/projects/git/toolkit/foo/bar"
     */
    getDirectory(newPath: string): DirectoryObject;
    /**
     * Creates a new FileObject by extending this directory's path.
     *
     * Paths are always resolved relative to THIS directory. Any attempt to
     * escape via `..` or absolute paths is constrained - the `..` segments
     * are stripped and the remaining path is resolved relative to this directory.
     *
     * On Windows, cross-drive absolute paths (e.g., `D:\foo` when base is `C:\`)
     * are also constrained - the drive root is stripped and the path is resolved
     * relative to this directory.
     *
     * Uses overlapping path segment detection to intelligently combine paths.
     *
     * @param {string} filename - The filename to append to this directory's path.
     * @returns {FileObject} A new FileObject with the extended path.
     * @example
     * const dir = new DirectoryObject("/projects/git/toolkit")
     * const file = dir.getFile("package.json")
     * console.log(file.path) // "/projects/git/toolkit/package.json"
     *
     * @example
     * // Path traversal is constrained to this directory
     * const dir = new DirectoryObject("/projects/git/toolkit")
     * const escaped = dir.getFile("../../../foo/bar.js")
     * console.log(escaped.path) // "/projects/git/toolkit/foo/bar.js"
     */
    getFile(filename: string): FileObject;
    /**
     * Custom Node.js inspect implementation for console.log output.
     *
     * @param {number} depth - Inspection depth
     * @param {object} options - Inspect options
     * @param {Function} ins - The inspect function
     * @returns {string} Formatted string representation
     */
    [inspect.custom](depth: number, options: object, ins: Function): string;
    /**
     * Returns the directory path as a primitive value, enabling natural use in
     * string contexts. String and default hints return the directory path; number
     * hint returns NaN.
     *
     * @param {"string"|"number"|"default"} hint - The coercion type hint
     * @returns {string|number} The directory path, or NaN for numeric coercion
     */
    [Symbol.toPrimitive](hint: "string" | "number" | "default"): string | number;
    #private;
}
export type GeneratorType = {
    next: () => {
        value: DirectoryObject;
        done: boolean;
    };
    iterator?: () => GeneratorType;
};
export type DirectoryMeta = {
    /**
     * - Always true for directories
     */
    isDirectory: boolean;
    /**
     * - The directory extension (if any)
     */
    extension: string | null;
    /**
     * - The directory name without extension
     */
    module: string | null;
    /**
     * - The directory name
     */
    name: string | null;
    /**
     * - The parent DirectoryObject
     */
    parent: DirectoryObject | undefined;
    /**
     * - The parent directory path
     */
    parentPath: string | null;
    /**
     * - The absolute directory path
     */
    path: string | null;
    /**
     * - Path separator
     */
    sep: string | null;
    /**
     * - User-supplied path
     */
    supplied: string | null;
    /**
     * - Path segments
     */
    trail: Array<string> | null;
    /**
     * - The directory URL
     */
    url: URL | null;
};
import FS from "./FileSystem.js";
import { URL } from "node:url";
import FileObject from "./FileObject.js";
import { inspect } from "node:util";
//# sourceMappingURL=DirectoryObject.d.ts.map