/**
 * DirectoryObject encapsulates metadata and operations for a directory,
 * including path resolution and existence checks.
 *
 * @property {string} supplied - The supplied directory
 * @property {string} path - The resolved path
 * @property {URL} url - The directory URL
 * @property {string} name - The directory name
 * @property {string} module - The directory name without extension
 * @property {string} extension - The directory extension (usually empty)
 * @property {boolean} isFile - Always false
 * @property {boolean} isDirectory - Always true
 * @property {Promise<boolean>} exists - Whether the directory exists (async)
 */
export default class DirectoryObject extends FS {
    /**
     * Constructs a DirectoryObject instance.
     *
     * @param {string} directory - The directory path
     */
    constructor(directory: string);
    /**
     * Returns a JSON representation of the DirectoryObject.
     *
     * @returns {object} JSON representation of the DirectoryObject
     */
    toJSON(): object;
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
     * Lists the contents of a directory.
     *
     * @returns {Promise<{files: Array<FileObject>, directories: Array<DirectoryObject>}>} The files and directories in the directory.
     */
    read(): Promise<{
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
     * @returns {object} Generator yielding parent DirectoryObject instances
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
    get walkUp(): object;
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
     * Custom inspect method for Node.js console.
     *
     * @returns {object} JSON representation of this object.
     */
    [util.inspect.custom](): object;
    #private;
}
import FS from "./FS.js";
import { URL } from "node:url";
import FileObject from "./FileObject.js";
import util from "node:util";
//# sourceMappingURL=DirectoryObject.d.ts.map