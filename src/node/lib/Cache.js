import Valid from "../../browser/lib/Valid.js"
import Data from "./Data.js"
import Sass from "./Sass.js"

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
  /** @type {Map<string, CacheData>} Map of file paths to cached data */
  #cache = new Map()

  /**
   * Removes cached data for a specific file from the #cache map.
   * Used when files are modified or when cache consistency needs to be
   * maintained.
   *
   * @private
   * @param {FileObject} file - The file object to remove from cache
   * @returns {undefined}
   */
  #cleanup(file) {
    this.#cache.delete(file.path)
  }

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
  async #loadFromCache(fileObject, kind, options={}) {
    Valid.assert(kind === "raw" || kind === "structured",
      "Cache data type must be 'raw' or 'structured'.")

    const lastModified = await fileObject.modified()

    if(lastModified === null)
      throw Sass.new(`No such file '${fileObject}'`)

    const rec = this.#cache.get(fileObject.path) ?? Object.seal({
      modified: new Date(0),
      raw: null,
      structured: null,
    })

    if(lastModified.getTime() === rec.modified.getTime()) {
      if(kind === "raw" && rec.raw !== null)
        return rec.raw

      if(kind === "structured" && rec.structured !== null)
        return rec.structured
    }

    this.#cache.set(fileObject.path, rec)
    rec.modified = lastModified
    rec.raw = await fileObject.read({
      encoding: options.encoding,
      skipCache: true,
    })
    rec.structured = null

    if(kind === "raw")
      return rec.raw

    rec.structured = Data.textAsData(rec.raw, options.type)

    return rec.structured
  }

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
  async loadDataFromCache(fileObject, options={}) {
    Valid.type(fileObject, "FileObject")

    return await this.#loadFromCache(
      fileObject, "structured", options)
  }

  /**
   * Loads and caches raw file content with automatic mtime-based
   * invalidation.
   *
   * @param {FileObject} fileObject - The file object to read and cache
   * @returns {Promise<string>} The raw file content
   * @throws {Sass} If the file cannot be found or accessed
   */
  async loadFromCache(fileObject, options={}) {
    Valid.type(fileObject, "FileObject")

    return await this.#loadFromCache(
      fileObject, "raw", options)
  }

  /**
   * Clears cached data for a specific file from both time and data maps.
   *
   * @param {import("./FileObject.js").default} file - The file object to clear from cache
   */
  resetCache(file) {
    Valid.type(file, "FileObject")

    this.#cleanup(file)
  }
}
