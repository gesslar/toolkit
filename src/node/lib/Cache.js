import Valid from "./Valid.js"
import Data from "./Data.js"
import Sass from "./Sass.js"

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
  /** @type {Map<string, CacheData>} Map of file paths to cached data */
  #cache = new Map()

  /**
   * In-flight reads, keyed by file path, generation, encoding and
   * modification time, so that concurrent callers coalesce onto one read
   * instead of racing each other.
   *
   * @type {Map<string, Promise<CacheData>>}
   */
  #reading = new Map()

  /**
   * Invalidation counter per file path, bumped on every reset. A read that
   * began before a reset carries the older generation, and so knows not to
   * publish itself over the top of that reset.
   *
   * @type {Map<string, number>}
   */
  #generation = new Map()

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
    this.#generation.set(file.path, (this.#generation.get(file.path) ?? 0) + 1)
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

    const rec = await this.#record(
      fileObject, lastModified, options.encoding ?? "utf8")

    if(kind === "raw")
      return rec.raw

    // Parsing is synchronous, so a record can never be observed with raw
    // content from one revision and structured data from another.
    rec.structured ??= Data.textAsData(rec.raw, options.type)

    return rec.structured
  }

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
  async #record(fileObject, lastModified, encoding) {
    const path = fileObject.path
    const cached = this.#cache.get(path)

    if(cached &&
       cached.modified.getTime() === lastModified.getTime() &&
       cached.encoding === encoding)
      return cached

    const generation = this.#generation.get(path) ?? 0
    const key = [path, generation, encoding, lastModified.getTime()]
      .join("\u0000")

    let reading = this.#reading.get(key)

    if(!reading) {
      reading = this.#read(fileObject, lastModified, encoding, generation)
        .finally(() => this.#reading.delete(key))

      this.#reading.set(key, reading)
    }

    return await reading
  }

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
  async #read(fileObject, lastModified, encoding, generation) {
    const path = fileObject.path
    const raw = await fileObject.read({encoding, skipCache: true})
    const rec = Object.seal({
      modified: lastModified,
      encoding,
      raw,
      structured: null,
    })

    const cached = this.#cache.get(path)

    // The caller gets this record either way, but it only goes in the map if
    // no reset landed while the read was in flight, and it wouldn't clobber a
    // newer revision that a faster read already published.
    if((this.#generation.get(path) ?? 0) === generation &&
       (!cached || cached.modified.getTime() <= lastModified.getTime()))
      this.#cache.set(path, rec)

    return rec
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
