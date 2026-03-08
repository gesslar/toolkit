/**
 * @import FileObject from "./FileObject.js"
 */
/**
 * @typedef {"raw" | "structured"} CacheDataType
 */
/**
 * @typedef {{modified: Date, raw: string|null, structured: unknown}} CacheData
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
    #private;
}
export type CacheDataType = "raw" | "structured";
export type CacheData = {
    modified: Date;
    raw: string | null;
    structured: unknown;
};
import type FileObject from "./FileObject.js";
//# sourceMappingURL=Cache.d.ts.map