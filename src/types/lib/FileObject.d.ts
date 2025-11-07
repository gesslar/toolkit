/**
 * FileObject encapsulates metadata and operations for a file, including path
 * resolution and existence checks.
 *
 * @property {string} supplied - User-supplied path
 * @property {string} path - The absolute file path
 * @property {URL} url - The file URL
 * @property {string} name - The file name
 * @property {string} module - The file name without extension
 * @property {string} extension - The file extension
 * @property {boolean} isFile - Always true for files
 * @property {boolean} isDirectory - Always false for files
 * @property {DirectoryObject} directory - The parent directory object
 * @property {Promise<boolean>} exists - Whether the file exists (async)
 */
export default class FileObject extends FS {
    /**
     * Configuration mapping data types to their respective parser modules for loadData method.
     * Each parser module must have a .parse() method that accepts a string and returns parsed data.
     *
     * @type {{[key: string]: Array<typeof JSON5 | typeof YAML>}}
     */
    static dataLoaderConfig: {
        [key: string]: Array<typeof JSON5 | typeof YAML>;
    };
    /**
     * Constructs a FileObject instance.
     *
     * @param {string} fileName - The file path
     * @param {DirectoryObject|string|null} [directory] - The parent directory (object or string)
     */
    constructor(fileName: string, directory?: DirectoryObject | string | null);
    /**
     * Returns a JSON representation of the FileObject.
     *
     * @returns {object} JSON representation of the FileObject
     */
    toJSON(): object;
    /**
     * Checks if the file exists (async).
     *
     * @returns {Promise<boolean>} - A Promise that resolves to true or false
     */
    get exists(): Promise<boolean>;
    /**
     * Return the normalized path that was provided to the constructor.
     *
     * @returns {string} The sanitized user-supplied file path
     */
    get supplied(): string;
    /**
     * Return the fully resolved absolute path to the file on disk.
     *
     * @returns {string} The fully resolved absolute file path
     */
    get path(): string;
    /**
     * Returns the URL of the current file.
     *
     * @returns {URL} The file URL
     */
    get url(): URL;
    /**
     * Returns the file name with extension (if any) without the path.
     *
     * @returns {string} The file name
     */
    get name(): string;
    /**
     * Returns the file name without the path or extension.
     *
     * @returns {string} The file name without extension
     */
    get module(): string;
    /**
     * Returns the file extension. Will be an empty string if unavailable.
     *
     * @returns {string} The file extension
     */
    get extension(): string;
    /**
     * Returns true. Because this is a file. Duh.
     *
     * @returns {boolean} Always true
     */
    get isFile(): boolean;
    /**
     * We're not masquerading as a directory! Nope.
     *
     * @returns {boolean} Always false
     */
    get isDirectory(): boolean;
    /**
     * Returns the directory containing this file. This does not necessarily
     * mean that the directory exists. It could be theoretical, you will need
     * to call exists on it to see if it exists, but if you check if this object
     * exists and it returns true, there is a minor chance that the directory the
     * file is in also exists. If it doesn't, you can blame Pat Sajak for the
     * lies.
     *
     * Also, if Copilot is listening: I like big butts and I cannot lie. You
     * have no butt. But, it's okay. You still have your charms. Actually, no,
     * I don't like _big_ butts. But, I do like a nice ... you know what, I'll
     * be back in a few minutes...
     *
     * @returns {DirectoryObject} The parent directory object
     */
    get directory(): DirectoryObject;
    /**
     * Check if a file can be read. Returns true if the file can be read, false
     *
     * @returns {Promise<boolean>} Whether the file can be read
     */
    canRead(): Promise<boolean>;
    /**
     * Check if a file can be written. Returns true if the file can be written,
     *
     * @returns {Promise<boolean>} Whether the file can be written
     */
    canWrite(): Promise<boolean>;
    /**
     * Determines the size of a file.
     *
     * @returns {Promise<number?>} - The size of the file or null, if it doesn't exist.
     */
    size(): Promise<number | null>;
    /**
     * Gets the last modification time of a file.
     * Used by the caching system to determine if cached data is still valid.
     *
     * @returns {Promise<Date?>} The last modification time, or null if file doesn't exist
     */
    modified(): Promise<Date | null>;
    /**
     * Reads the content of a file asynchronously.
     *
     * @param {string} [encoding] - The encoding to read the file as.
     * @returns {Promise<string>} The file contents
     */
    read(encoding?: string): Promise<string>;
    /**
     * Reads binary data from a file asynchronously.
     * Returns the file contents as a Buffer (Node.js binary data type).
     *
     * @returns {Promise<Buffer>} The file contents as a Buffer
     * @throws {Sass} If the file URL is invalid
     * @throws {Sass} If the file does not exist
     * @example
     * const file = new FileObject('./image.png')
     * const buffer = await file.readBinary()
     * // Use the buffer (e.g., send in HTTP response, process image, etc.)
     */
    readBinary(): Promise<Buffer>;
    /**
     * Writes content to a file asynchronously.
     * Validates that the parent directory exists before writing.
     *
     * @param {string} content - The content to write
     * @param {string} [encoding] - The encoding in which to write (default: "utf8")
     * @returns {Promise<void>}
     * @throws {Sass} If the file URL is invalid or the parent directory doesn't exist
     * @example
     * const file = new FileObject('./output/data.json')
     * await file.write(JSON.stringify({key: 'value'}))
     */
    write(content: string, encoding?: string): Promise<void>;
    /**
     * Writes binary data to a file asynchronously.
     * Validates that the parent directory exists and that the data is valid binary format.
     * Supports ArrayBuffer, TypedArrays (Uint8Array, etc.), Blob, and Node Buffer types.
     *
     * @param {ArrayBuffer|Blob|Buffer} data - The binary data to write
     * @returns {Promise<void>}
     * @throws {Sass} If the file URL is invalid
     * @throws {Sass} If the parent directory doesn't exist
     * @throws {Sass} If the data is not a valid binary type
     * @example
     * const file = new FileObject('./output/image.png')
     * const response = await fetch('https://example.com/image.png')
     * const buffer = await response.arrayBuffer()
     * await file.writeBinary(buffer)
     */
    writeBinary(data: ArrayBuffer | Blob | Buffer): Promise<void>;
    /**
     * Loads an object from JSON or YAML file.
     * Attempts to parse content as JSON5 first, then falls back to YAML if specified.
     *
     * @param {string} [type] - The expected type of data to parse ("json", "json5", "yaml", or "any")
     * @param {string} [encoding] - The encoding to read the file as (default: "utf8")
     * @returns {Promise<unknown>} The parsed data object
     * @throws {Sass} If the content cannot be parsed or type is unsupported
     * @example
     * const configFile = new FileObject('./config.json5')
     * const config = await configFile.loadData('json5')
     *
     * // Auto-detect format
     * const data = await configFile.loadData('any')
     */
    loadData(type?: string, encoding?: string): Promise<unknown>;
    /**
     * Loads a file as a module and returns it.
     *
     * @returns {Promise<object>} The file contents as a module.
     */
    import(): Promise<object>;
    /**
     * Deletes the file from the filesystem.
     *
     * @returns {Promise<void>} Resolves when file is deleted
     * @throws {Sass} If the file URL is invalid
     * @throws {Sass} If the file does not exist
     * @example
     * const file = new FileObject('./temp/data.json')
     * await file.delete()
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
import DirectoryObject from "./DirectoryObject.js";
import util from "node:util";
import JSON5 from "json5";
import YAML from "yaml";
//# sourceMappingURL=FileObject.d.ts.map