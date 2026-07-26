import type FileObject from "./FileObject.js";
export type CacheDataType = "raw" | "structured";
export type CacheData = {
    modified: Date;
    encoding: string;
    raw: string | null;
    structured: unknown;
};
/**
 * @import FileObject from "./FileObject.js"
 */
/**
 * @typedef {"raw" | "structured"} CacheDataType
 */
/**
 * @typedef {{modified: Date, encoding: string, raw: string|null, structured: unknown}} CacheData
 */
/**
 * File system cache with automatic invalidation based on modification time.
 * Provides intelligent caching of parsed JSON5/YAML files with mtime-based
 * cache invalidation to optimize performance for repeated file access.
 *
 * The cache eliminates redundant file reads and parsing when multiple
 * processes access the same dependency files, while ensuring data freshness
 * through modification time checking.
 */
export default class Cache {
    #private;
    /**
     * Removes cached data for a specific file from the #cache map.
     * Used when files are modified or when cache consistency needs to be
     * maintained.
     *
     * @private
     * @param {FileObject} file - The file object to remove from cache
     * @returns {undefined}
     */
    private #cleanup;
    /**
     * Internal cache loader that reads raw content via FileObject and
     * optionally parses it, using mtime-based invalidation to serve cached
     * results when possible.
     *
     * @private
     * @param {FileObject} fileObject - The file object to load
     * @param {CacheDataType} kind - Whether to return "raw" text or
     *   "structured" parsed data
     * @param {object} [options] - Options forwarded to read/parse
     * @param {string} [options.encoding="utf8"] - File encoding
     * @param {string} [options.type="any"] - Data format for parsing
     * @returns {Promise<unknown>} The cached or freshly loaded data
     * @throws {Sass} If the file does not exist
     */
    private #loadFromCache;
    /**
     * Resolves the cache record for a file at a given modification time,
     * reading from disk when no record exists or the existing one is stale.
     *
     * Concurrent callers asking for the same file at the same mtime and
     * encoding share a single read, and a record only enters the map once its
     * contents are in hand. Without both of those, a second caller arriving
     * while the first is still awaiting the read would find a record already
     * stamped with the new mtime but still holding the previous revision's
     * data, and happily return it as fresh.
     *
     * @private
     * @param {FileObject} fileObject - The file object to resolve
     * @param {Date} lastModified - The file's current modification time
     * @param {string} encoding - The encoding to read the file with
     * @returns {Promise<CacheData>} The populated cache record
     */
    private #record;
    /**
     * Reads a file from disk and publishes it as a cache record.
     *
     * @private
     * @param {FileObject} fileObject - The file object to read
     * @param {Date} lastModified - The modification time the read represents
     * @param {string} encoding - The encoding to read the file with
     * @param {number} generation - The invalidation generation this read began in
     * @returns {Promise<CacheData>} The freshly populated cache record
     */
    private #read;
    /**
     * Loads and caches parsed file data with automatic invalidation based on
     * modification time.
     *
     * Implements a sophisticated caching strategy that checks file modification
     * times to determine whether cached data is still valid, ensuring data
     * freshness while optimizing performance for repeated file access during
     * parallel processing.
     *
     * @param {FileObject} fileObject - The file object to load and cache
     * @returns {Promise<unknown>} The parsed file data (JSON5 or YAML)
     * @throws {Sass} If the file cannot be found or accessed
     */
    loadDataFromCache(fileObject: FileObject, options?: {}): Promise<unknown>;
    /**
     * Loads and caches raw file content with automatic mtime-based
     * invalidation.
     *
     * @param {FileObject} fileObject - The file object to read and cache
     * @returns {Promise<string>} The raw file content
     * @throws {Sass} If the file cannot be found or accessed
     */
    loadFromCache(fileObject: FileObject, options?: {}): Promise<string>;
    /**
     * Clears cached data for a specific file from both time and data maps.
     *
     * @param {import("./FileObject.js").default} file - The file object to clear from cache
     */
    resetCache(file: import("./FileObject.js").default): void;
}
//# sourceMappingURL=Cache.d.ts.map