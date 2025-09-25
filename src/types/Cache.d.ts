// Implementation: ../lib/Cache.js
import FileObject from './FileObject.js'

/**
 * File system cache for theme compilation data with automatic invalidation.
 * Provides intelligent caching of parsed JSON5/YAML files with mtime-based
 * cache invalidation to optimize parallel theme compilation performance.
 *
 * The cache eliminates redundant file reads and parsing when multiple themes
 * import the same dependency files, while ensuring data freshness through
 * modification time checking.
 */
declare class Cache {
  /**
   * Loads and caches parsed file data with automatic invalidation based on
   * modification time.
   *
   * Implements a sophisticated caching strategy that checks file modification
   * times to determine whether cached data is still valid, ensuring data
   * freshness while optimizing performance for repeated file access during
   * parallel theme compilation.
   *
   * @param fileObject - The file object to load and cache
   * @returns The parsed file data (JSON5 or YAML)
   * @throws If the file cannot be found or accessed
   */
  loadCachedData(fileObject: FileObject): Promise<unknown>
}

export default Cache
