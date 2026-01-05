/**
 * DirectoryObject encapsulates metadata and operations for a directory,
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
 * @property {boolean} isFile - Always false (this is a directory)
 * @property {boolean} isDirectory - Always true
 * @property {DirectoryObject|null} parent - The parent directory (null if root)
 * @property {Promise<boolean>} exists - Whether the directory exists (async getter)
 * @property {Generator<DirectoryObject>} walkUp - Generator yielding parent directories up to root
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
     * @param {string?} [directory="."] - The directory path or DirectoryObject (defaults to current directory)
     */
    constructor(directory?: string | null);
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
     * Returns the directory name without the path or extension.
     *
     * @returns {string} The directory name without extension
     */
    get module(): string;
    /**
     * Returns the directory extension. Will be an empty string if unavailable.
     *
     * @returns {string} The directory extension
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
     * Returns false. Because this is a directory.
     *
     * @returns {boolean} Always false
     */
    get isFile(): boolean;
    /**
     * We're a directory!
     *
     * @returns {boolean} Always true
     */
    get isDirectory(): boolean;
    /**
     * Lists the contents of a directory, optionally filtered by a glob pattern.
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
    read(pat?: string): Promise<{
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
     * Uses intelligent path merging that detects overlapping segments to avoid
     * duplication (e.g., "/projects/toolkit" + "toolkit/src" = "/projects/toolkit/src").
     * The temporary flag is preserved from the parent directory.
     *
     * @param {string} dir - The subdirectory path to append (can be nested like "src/lib")
     * @returns {DirectoryObject} A new DirectoryObject instance with the combined path
     * @throws {Sass} If newPath is not a string
     * @example
     * const dir = new DirectoryObject("/projects/git/toolkit")
     * const subDir = dir.getDirectory("src/lib")
     * console.log(subDir.path) // "/projects/git/toolkit/src/lib"
     *
     * @example
     * // Handles overlapping segments intelligently
     * const dir = new DirectoryObject("/projects/toolkit")
     * const subDir = dir.getDirectory("toolkit/src")
     * console.log(subDir.path) // "/projects/toolkit/src" (not /projects/toolkit/toolkit/src)
     */
    getDirectory(dir: string): DirectoryObject;
    /**
     * Creates a new FileObject by extending this directory's path.
     *
     * Uses intelligent path merging that detects overlapping segments to avoid
     * duplication. The resulting FileObject can be used for reading, writing,
     * and other file operations.
     *
     * @param {string} file - The filename to append (can include subdirectories like "src/index.js")
     * @returns {FileObject} A new FileObject instance with the combined path
     * @throws {Sass} If filename is not a string
     * @example
     * const dir = new DirectoryObject("/projects/git/toolkit")
     * const file = dir.getFile("package.json")
     * console.log(file.path) // "/projects/git/toolkit/package.json"
     *
     * @example
     * // Can include nested paths
     * const file = dir.getFile("src/index.js")
     * const data = await file.read()
     */
    getFile(file: string): FileObject;
    #private;
}
import FS from "./FS.js";
import FileObject from "./FileObject.js";
//# sourceMappingURL=DirectoryObject.d.ts.map