import FileObject from "./FileObject.js"
import Sass from "./Sass.js"

/**
 * File system cache with automatic invalidation based on modification time.
 * Provides intelligent caching of parsed JSON5/YAML files with mtime-based
 * cache invalidation to optimize performance for repeated file access.
 *
 * The cache eliminates redundant file reads and parsing when multiple processes
 * access the same dependency files, while ensuring data freshness through
 * modification time checking.
 */
export default class Cache {
  /** @type {Map<string, Date>} Map of file paths to last modification times */
  #modifiedTimes = new Map()
  /** @type {Map<string, object>} Map of file paths to parsed file data */
  #dataCache = new Map()

  /**
   * Removes cached data for a specific file from both time and data maps.
   * Used when files are modified or when cache consistency needs to be
   * maintained.
   *
   * @private
   * @param {FileObject} file - The file object to remove from cache
   * @returns {void}
   */
  #cleanup(file) {
    this.#modifiedTimes.delete(file.path)
    this.#dataCache.delete(file.path)
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
  async loadCachedData(fileObject) {
    const lastModified = await fileObject.modified()

    if(lastModified === null)
      throw Sass.new(`Unable to find file '${fileObject.path}'`)

    if(this.#modifiedTimes.has(fileObject.path)) {
      const lastCached = this.#modifiedTimes.get(fileObject.path)

      if(lastModified > lastCached) {
        this.#cleanup(fileObject)
      } else {
        if(!(this.#dataCache.has(fileObject.path)))
          this.#cleanup(fileObject)
        else {
          return this.#dataCache.get(fileObject.path)
        }
      }
    }

    const data = await fileObject.loadData()

    this.#modifiedTimes.set(fileObject.path, lastModified)
    this.#dataCache.set(fileObject.path, data)

    return data
  }
}
