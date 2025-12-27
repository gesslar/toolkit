/**
 * @file CappedDirectoryObject.js
 * @description Abstract base class for directory objects that are constrained
 * to a specific directory tree (the "cap"). This provides security by ensuring
 * all operations remain within the capped directory hierarchy.
 *
 * This class is not intended to be instantiated directly. Use subclasses like
 * TempDirectoryObject that define specific caps.
 */

import path from "node:path"

import {Data, Valid} from "../browser/index.js"
import DirectoryObject from "./DirectoryObject.js"
import FileObject from "./FileObject.js"
import FS from "./FS.js"
import Sass from "./Sass.js"

/**
 * CappedDirectoryObject extends DirectoryObject with constraints that ensure
 * all operations are restricted to a specific directory tree (the "cap").
 *
 * All path operations are validated to ensure they remain within the
 * cap directory hierarchy for security.
 *
 * @augments DirectoryObject
 */
export default class CappedDirectoryObject extends DirectoryObject {
  #cap

  /**
   * Constructs a CappedDirectoryObject instance.
   *
   * Without a parent, the path becomes both the directory location and the cap
   * (virtual root). With a parent, the path is resolved relative to the parent's
   * cap using virtual path semantics (absolute paths treated as cap-relative).
   *
   * @param {string} dirPath - Directory path (becomes cap if no parent, else relative to parent's cap)
   * @param {CappedDirectoryObject?} [parent] - Optional parent capped directory
   * @param {boolean} [temporary=false] - Whether this is a temporary directory
   * @throws {Sass} If path is empty
   * @throws {Sass} If parent is provided but not a CappedDirectoryObject
   * @throws {Sass} If the resulting path would escape the cap
   * @example
   * // Create new capped directory
   * const cache = new CappedDirectoryObject("/home/user/.cache")
   * // path: /home/user/.cache, cap: /home/user/.cache
   *
   * @example
   * // Create subdirectory with parent
   * const data = new CappedDirectoryObject("data", cache)
   * // path: /home/user/.cache/data, cap: /home/user/.cache
   *
   * @example
   * // Virtual absolute path with parent
   * const config = new CappedDirectoryObject("/etc/config", cache)
   * // path: /home/user/.cache/etc/config, cap: /home/user/.cache
   */
  constructor(dirPath, parent=null, temporary=false) {
    Valid.type(dirPath, "String")
    Valid.assert(dirPath.length > 0, "Path must not be empty.")

    // Validate parent using instanceof since TypeSpec doesn't understand inheritance
    if(parent !== null && !(parent instanceof CappedDirectoryObject)) {
      throw Sass.new(`Parent must be null or a CappedDirectoryObject instance, got ${Data.typeOf(parent)}`)
    }

    let cap
    let resolvedPath

    if(!parent) {
      // No parent: dirPath becomes both the directory and the cap
      cap = path.resolve(dirPath)
      resolvedPath = cap
    } else {
      // With parent: inherit cap and resolve dirPath relative to it
      cap = parent.#cap

      // Use real path for filesystem operations
      const parentPath = parent.realPath || parent.path
      const capResolved = path.resolve(cap)

      let targetPath

      // If absolute, treat as virtual path relative to cap (strip leading /)
      if(path.isAbsolute(dirPath)) {
        const relative = dirPath.replace(/^[/\\]+/, "")
        targetPath = relative ? path.join(capResolved, relative) : capResolved
      } else {
        // Relative path - resolve from parent directory
        targetPath = FS.resolvePath(parentPath, dirPath)
      }

      // Resolve to absolute path (handles .. and .)
      const resolved = path.resolve(targetPath)

      // Clamp to cap boundary - cannot escape above cap
      if(!resolved.startsWith(capResolved)) {
        // Path tried to escape - clamp to cap root
        resolvedPath = capResolved
      } else {
        resolvedPath = resolved
      }
    }

    // Call parent constructor with the path
    super(resolvedPath, temporary)

    // Store the cap AFTER calling super()
    this.#cap = cap

    // Validate that this path is within the cap
    this.#validateCapPath()
  }

  /**
   * Validates that the directory path is within the cap directory tree.
   *
   * @private
   * @throws {Sass} If the path is not within the cap directory
   */
  #validateCapPath() {
    const cap = this.#cap
    const resolved = path.resolve(this.#realPath)
    const capResolved = path.resolve(cap)

    // Check if the resolved path starts with the cap directory
    if(!resolved.startsWith(capResolved)) {
      throw Sass.new(
        `Path '${this.#realPath}' is not within the cap directory '${cap}'`
      )
    }
  }

  /**
   * Returns the cap path for this directory.
   *
   * @returns {string} The cap directory path
   */
  get cap() {
    return this.#cap
  }

  /**
   * Returns whether this directory is capped.
   *
   * @returns {boolean} Always true for CappedDirectoryObject instances
   */
  get capped() {
    return true
  }

  /**
   * Returns the real filesystem path (for internal and subclass use).
   *
   * @protected
   * @returns {string} The actual filesystem path
   */
  get realPath() {
    return super.path
  }

  /**
   * Private alias for realPath (for use in private methods).
   *
   * @private
   * @returns {string} The actual filesystem path
   */
  get #realPath() {
    return this.realPath
  }

  /**
   * Returns the virtual path relative to the cap.
   * This is the default path representation in the capped environment.
   * Use `.real.path` to access the actual filesystem path.
   *
   * @returns {string} Path relative to cap, or "/" if at cap root
   * @example
   * const temp = new TempDirectoryObject("myapp")
   * const subdir = temp.getDirectory("data/cache")
   * console.log(subdir.path)       // "/data/cache" (virtual, relative to cap)
   * console.log(subdir.real.path)  // "/tmp/myapp-ABC123/data/cache" (actual filesystem)
   */
  get path() {
    const capResolved = path.resolve(this.#cap)
    const relative = path.relative(capResolved, this.#realPath)

    // If at cap root or empty, return "/"
    if(!relative || relative === ".") {
      return "/"
    }

    // Return with leading slash to indicate it's cap-relative
    return "/" + relative.split(path.sep).join("/")
  }

  /**
   * Returns a plain DirectoryObject representing the actual filesystem location.
   * This provides an "escape hatch" from the capped environment to interact
   * with the real filesystem when needed.
   *
   * @returns {DirectoryObject} Uncapped directory object at the real filesystem path
   * @example
   * const temp = new TempDirectoryObject("myapp")
   * const subdir = temp.getDirectory("data")
   *
   * // Work within the capped environment (virtual paths)
   * console.log(subdir.path)        // "/data" (virtual)
   * subdir.getFile("config.json")   // Stays within cap
   *
   * // Break out to real filesystem when needed
   * console.log(subdir.real.path)   // "/tmp/myapp-ABC123/data" (real)
   * subdir.real.parent              // Can traverse outside the cap
   */
  get real() {
    return new DirectoryObject(this.#realPath)
  }

  /**
   * Returns the parent directory of this capped directory.
   * Returns null only if this directory is at the cap (the "root" of the capped tree).
   *
   * Note: The returned parent is a plain DirectoryObject (not capped).
   * Use getDirectory() for creating capped subdirectories.
   *
   * @returns {DirectoryObject|null} Parent directory or null if at cap root
   * @example
   * const capped = new TempDirectoryObject("myapp")
   * const subdir = capped.getDirectory("data")
   * console.log(subdir.parent.path) // Returns parent DirectoryObject
   * console.log(capped.parent) // null (at cap root)
   */
  get parent() {
    const capResolved = path.resolve(this.#cap)

    // If we're at the cap, return null (cap is the "root")
    if(this.#realPath === capResolved) {
      return null
    }

    // Otherwise return the parent using real path (plain DirectoryObject, not capped)
    const parentPath = path.dirname(this.#realPath)
    const isRoot = parentPath === this.#realPath

    return isRoot
      ? null
      : new DirectoryObject(parentPath, this.temporary)
  }

  /**
   * Generator that walks up the directory tree, stopping at the cap.
   * Yields parent directories from current up to (and including) the cap root.
   *
   * @returns {Generator<DirectoryObject>} Generator yielding parent DirectoryObject instances
   * @example
   * const capped = new TempDirectoryObject("myapp")
   * const deep = capped.getDirectory("data").getDirectory("files")
   * for(const parent of deep.walkUp) {
   *   console.log(parent.path)
   *   // .../myapp-ABC123/data/files
   *   // .../myapp-ABC123/data
   *   // .../myapp-ABC123 (stops at cap)
   * }
   */
  *#walkUpCapped() {
    const capResolved = path.resolve(this.#cap)

    // Build trail from real path
    const trail = this.#realPath.split(path.sep).filter(Boolean)
    const curr = [...trail]

    while(curr.length > 0) {
      const joined = path.sep + curr.join(path.sep)

      // Don't yield anything beyond the cap
      if(!joined.startsWith(capResolved)) {
        break
      }

      // Yield plain DirectoryObject with real path
      yield new DirectoryObject(joined, this.temporary)

      // Stop after yielding the cap
      if(joined === capResolved) {
        break
      }

      curr.pop()
    }
  }

  /**
   * Returns a generator that walks up to the cap.
   *
   * @returns {Generator<DirectoryObject>} Generator yielding parent directories
   */
  get walkUp() {
    return this.#walkUpCapped()
  }

  /**
   * Creates a new CappedDirectoryObject by extending this directory's path.
   *
   * All paths are coerced to remain within the cap directory tree:
   * - Absolute paths (e.g., "/foo") are treated as relative to the cap
   * - Parent traversal ("..") is allowed but clamped at the cap boundary
   * - The cap acts as the virtual root directory
   *
   * @param {string} newPath - The path to resolve (can be absolute or contain ..)
   * @returns {CappedDirectoryObject} A new CappedDirectoryObject with the coerced path
   * @example
   * const capped = new TempDirectoryObject("myapp")
   * const subDir = capped.getDirectory("data")
   * console.log(subDir.path) // "/tmp/myapp-ABC123/data"
   *
   * @example
   * // Absolute paths are relative to cap
   * const abs = capped.getDirectory("/foo/bar")
   * console.log(abs.path) // "/tmp/myapp-ABC123/foo/bar"
   *
   * @example
   * // Excessive .. traversal clamps to cap
   * const up = capped.getDirectory("../../../etc/passwd")
   * console.log(up.path) // "/tmp/myapp-ABC123" (clamped to cap)
   */
  getDirectory(newPath) {
    Valid.type(newPath, "String")

    // Fast path: if it's a simple name (no separators, not absolute, no ..)
    // use the subclass constructor directly to preserve type
    const isSimpleName = !path.isAbsolute(newPath) &&
                         !newPath.includes("/") &&
                         !newPath.includes("\\") &&
                         !newPath.includes("..")

    if(isSimpleName) {
      // Both CappedDirectoryObject and subclasses use same signature now
      return new this.constructor(newPath, this, this.temporary)
    }

    // Complex path - handle coercion
    const capResolved = path.resolve(this.#cap)
    let targetPath

    // If absolute, treat as relative to cap (virtual root)
    if(path.isAbsolute(newPath)) {
      // Strip leading slashes to make relative
      const relative = newPath.replace(/^[/\\]+/, "")

      // Join with cap (unless empty, which means cap root)
      targetPath = relative ? path.join(capResolved, relative) : capResolved
    } else {
      // Relative path - resolve from current directory
      targetPath = FS.resolvePath(this.#realPath, newPath)
    }

    // Resolve to absolute path (handles .. and .)
    const resolved = path.resolve(targetPath)

    // Coerce: if path escaped cap, clamp to cap boundary
    const coerced = resolved.startsWith(capResolved)
      ? resolved
      : capResolved

    // Compute path relative to cap for reconstruction
    const relativeToCap = path.relative(capResolved, coerced)

    // If we're at the cap root, return cap root directory
    if(!relativeToCap || relativeToCap === ".") {
      return this.#createCappedAtRoot()
    }

    // Build directory by traversing segments from cap
    return this.#buildDirectoryFromRelativePath(relativeToCap)
  }

  /**
   * Creates a CappedDirectoryObject at the cap root.
   * Can be overridden by subclasses that have different root semantics.
   *
   * @private
   * @returns {CappedDirectoryObject} Directory object at cap root
   */
  #createCappedAtRoot() {
    // Create a base CappedDirectoryObject at the cap path
    // This works for direct usage of CappedDirectoryObject
    // Subclasses may need to override if they have special semantics
    return new CappedDirectoryObject(this.#cap, null, this.temporary)
  }

  /**
   * Builds a directory by traversing path segments from cap.
   *
   * @private
   * @param {string} relativePath - Path relative to cap
   * @returns {CappedDirectoryObject} The directory at the final path
   */
  #buildDirectoryFromRelativePath(relativePath) {
    const segments = relativePath.split(path.sep).filter(Boolean)

    // Start at cap root
    let current = this.#createCappedAtRoot()

    // Traverse each segment, creating CappedDirectoryObject instances
    // (not subclass instances, to avoid constructor signature issues)
    for(const segment of segments) {
      current = new CappedDirectoryObject(segment, current, this.temporary)
    }

    return current
  }

  /**
   * Creates a new FileObject by extending this directory's path.
   *
   * All paths are coerced to remain within the cap directory tree:
   * - Absolute paths (e.g., "/config.json") are treated as relative to the cap
   * - Parent traversal ("..") is allowed but clamped at the cap boundary
   * - The cap acts as the virtual root directory
   *
   * @param {string} filename - The filename to resolve (can be absolute or contain ..)
   * @returns {FileObject} A new FileObject with the coerced path
   * @example
   * const capped = new TempDirectoryObject("myapp")
   * const file = capped.getFile("config.json")
   * console.log(file.path) // "/tmp/myapp-ABC123/config.json"
   *
   * @example
   * // Absolute paths are relative to cap
   * const abs = capped.getFile("/data/config.json")
   * console.log(abs.path) // "/tmp/myapp-ABC123/data/config.json"
   *
   * @example
   * // Excessive .. traversal clamps to cap
   * const up = capped.getFile("../../../etc/passwd")
   * console.log(up.path) // "/tmp/myapp-ABC123/passwd" (clamped to cap)
   */
  getFile(filename) {
    Valid.type(filename, "String")

    // Fast path: if it's a simple filename (no separators, not absolute, no ..)
    // use this as the parent directly
    const isSimpleName = !path.isAbsolute(filename) &&
                         !filename.includes("/") &&
                         !filename.includes("\\") &&
                         !filename.includes("..")

    if(isSimpleName) {
      // Simple filename - create directly with this as parent
      return new FileObject(filename, this)
    }

    // Complex path - handle coercion
    const capResolved = path.resolve(this.#cap)
    let targetPath

    // If absolute, treat as relative to cap (virtual root)
    if(path.isAbsolute(filename)) {
      // Strip leading slashes to make relative
      const relative = filename.replace(/^[/\\]+/, "")

      // Join with cap
      targetPath = path.join(capResolved, relative)
    } else {
      // Relative path - resolve from current directory
      targetPath = FS.resolvePath(this.#realPath, filename)
    }

    // Resolve to absolute path (handles .. and .)
    const resolved = path.resolve(targetPath)

    // Coerce: if path escaped cap, clamp to cap boundary
    const coerced = resolved.startsWith(capResolved)
      ? resolved
      : capResolved

    // Extract directory and filename parts
    let fileDir = path.dirname(coerced)
    let fileBasename = path.basename(coerced)

    // Special case: if coerced is exactly the cap (file tried to escape),
    // the file should be placed at the cap root with just the filename
    if(coerced === capResolved) {
      // Extract just the filename from the original path
      fileBasename = path.basename(resolved)
      fileDir = capResolved
    }

    // Get or create the parent directory
    const relativeToCap = path.relative(capResolved, fileDir)
    const parentDir = !relativeToCap || relativeToCap === "."
      ? this.#createCappedAtRoot()
      : this.#buildDirectoryFromRelativePath(relativeToCap)

    // Create FileObject with parent directory
    return new FileObject(fileBasename, parentDir)
  }

  /**
   * Override exists to use real filesystem path.
   *
   * @returns {Promise<boolean>} Whether the directory exists
   */
  get exists() {
    return this.real.exists
  }

  /**
   * Override read to use real filesystem path and return capped objects.
   *
   * @param {string} [pat=""] - Optional glob pattern
   * @returns {Promise<{files: Array<FileObject>, directories: Array}>} Directory contents
   */
  async read(pat="") {
    const {files, directories} = await this.real.read(pat)

    // Convert plain DirectoryObjects to CappedDirectoryObjects with same cap
    const cappedDirectories = directories.map(dir => {
      const name = dir.name

      return new this.constructor(name, this)
    })

    return {files, directories: cappedDirectories}
  }

  /**
   * Override assureExists to use real filesystem path.
   *
   * @param {object} [options] - Options for mkdir
   * @returns {Promise<void>}
   */
  async assureExists(options = {}) {
    return await this.real.assureExists(options)
  }

  /**
   * Override delete to use real filesystem path.
   *
   * @returns {Promise<void>}
   */
  async delete() {
    return await this.real.delete()
  }

  /**
   * Override remove to preserve temporary flag check.
   *
   * @returns {Promise<void>}
   */
  async remove() {
    if(!this.temporary)
      throw Sass.new("This is not a temporary directory.")

    const {files, directories} = await this.read()

    // Remove subdirectories recursively
    for(const dir of directories)
      await dir.remove()

    // Remove files
    for(const file of files)
      await file.delete()

    // Delete the now-empty directory
    await this.delete()
  }

  /**
   * Returns a string representation of the CappedDirectoryObject.
   *
   * @returns {string} string representation of the CappedDirectoryObject
   */
  toString() {
    return `[CappedDirectoryObject: ${this.path} (real: ${this.#realPath})]`
  }
}
