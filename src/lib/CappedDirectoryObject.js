/**
 * @file CappedDirectoryObject.js
 * @description Abstract base class for directory objects that are constrained
 * to a specific directory tree (the "cap"). This provides security by ensuring
 * all operations remain within the capped directory hierarchy.
 *
 * This class is not intended to be instantiated directly. Use subclasses like
 * TempDirectoryObject that define specific caps.
 */

import DirectoryObject from "./DirectoryObject.js"
import FS from "./FS.js"
import Valid from "./Valid.js"

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
  #real
  #cap

  /**
   * Constructs a CappedDirectoryObject instance.
   *
   * Without a parent, the path becomes both the directory location and the cap
   * (virtual root). With a parent, the path is resolved relative to the parent's
   * cap using virtual path semantics (absolute paths treated as cap-relative).
   *
   * @param {string} [directory="."] - Directory path (becomes cap if no parent, else relative to parent's cap, defaults to current directory)
   * @param {CappedDirectoryObject?} [parent] - Optional parent capped directory
   * @throws {Sass} If parent is provided but not a CappedDirectoryObject
   * @throws {Sass} If the resulting path would escape the cap
   * @example
   * // Create new capped directory at current directory
   * const cwd = new CappedDirectoryObject()
   * // path: process.cwd(), cap: process.cwd()
   *
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
  constructor(directory, source=null) {
    Valid.type(source, "Null|CappedDirectoryObject")

    directory ||= "."

    const baseLocalPath = source?.path ?? "/"
    const baseRealPath = source?.real.path ?? process.cwd()

    if(source && directory.startsWith("/"))
      directory = directory.slice(1)

    // Find out what directory means to the basePath
    const realResolved = FS.resolvePath(baseRealPath, directory)
    const localResolved = FS.resolvePath(baseLocalPath, directory)

    super(localResolved)

    this.#real = new DirectoryObject(realResolved)
    this.#cap = source?.cap ?? this
  }

  /**
   * Creates a CappedDirectoryObject from the current working directory.
   * This is useful when working with pnpx or other tools where you need to
   * cap at the project's root directory determined at runtime.
   *
   * @returns {CappedDirectoryObject} A CappedDirectoryObject capped at the current working directory
   * @example
   * // When using pnpx or similar tools
   * const projectRoot = CappedDirectoryObject.fromCwd()
   * const srcDir = projectRoot.getDirectory("src")
   * // srcDir is capped at the project root
   */
  static fromCwd() {
    return new this(process.cwd())
  }

  get isCapped() {
    return true
  }

  get cap() {
    return this.#cap
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
    return this.#real
  }

  /**
   * Returns the parent directory of this capped directory.
   * Returns null only if this directory is at the cap (the "root" of the capped tree).
   *
   * Note: The returned parent is a CappedDirectoryObject with the same cap.
   * This maintains the capping behavior throughout the directory hierarchy.
   *
   * @returns {CappedDirectoryObject|null} Parent directory or null if at cap root
   * @example
   * const capped = new TempDirectoryObject("myapp")
   * const subdir = capped.getDirectory("data")
   * console.log(subdir.parent.path) // Returns parent CappedDirectoryObject
   * console.log(capped.parent) // null (at cap root)
   */
  get parent() {
    if(this.path === "/")
      return null

    return this.getDirectory("..")
  }

  /**
   * Returns a JSON representation of the DirectoryObject.
   *
   * @returns {object} JSON representation of the DirectoryObject
   */
  toJSON() {
    return {
      supplied: this.supplied,
      path: this.path,
      url: this.url.toString(),
      name: this.name,
      module: this.module,
      extension: this.extension,
      isFile: this.isFile,
      isDirectory: this.isDirectory,
      parent: this.parent?.path ?? null,
      capped: this.isCapped,
      cap: this.cap,
      real: this.real
    }
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
  async read(...arg) {
    const {files, directories} = await this.real.read(...arg)

    // we need to re-cast
    const recastDirs = directories.map(e => this.getDirectory(e.name))
    const recastFiles = files.map(f => new FileObject(f.name, this))

    return {files: recastFiles, directories: recastDirs}
  }

  /**
   * Override hasDirectory to use real filesystem path.
   *
   * @param {string} dirname - Directory name to check
   * @returns {Promise<boolean>} True if directory exists
   */
  async hasDirectory(dirname) {
    return await this.real.hasDirectory(dirname)
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
   * Returns a string representation of the CappedDirectoryObject.
   *
   * @returns {string} string representation of the CappedDirectoryObject
   */
  toString() {
    return `[CappedDirectoryObject: ${this.path} (real: ${this.real.path})]`
  }

  /**
   * Private generator that walks up the directory tree.
   *
   * @override
   * @private
   * @generator
   * @yields {CappedDirectoryObject} Parent directory objects from current to root
   */
  *#walkUp() {
    if(!Array.isArray(this.trail))
      return

    const curr = structuredClone(this.trail)

    while(curr.length > 0) {
      const joined = curr.join(this.sep)

      // Stop if we've reached an empty path (which would resolve to CWD)
      if(joined === "" || joined === this.sep) {
        // Yield the root and stop
        yield new this.constructor(this.sep, this.cap)
        break
      }

      yield new this.constructor(joined, this.cap)
      curr.pop()
    }
  }

  /**
   * Generator that walks up the directory tree, yielding each parent directory.
   * Starts from the current directory and yields each parent until reaching the root.
   *
   * @override
   * @returns {CappedDirectoryObject} Generator yielding parent DirectoryObject instances
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
  get walkUp() {
    return this.#walkUp()
  }
}
