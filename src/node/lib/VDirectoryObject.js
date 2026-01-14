/**
 * @file VDirectoryObject.js
 * @description Abstract base class for directory objects that are constrained
 * to a specific directory tree (the "cap"). This provides security by ensuring
 * all operations remain within the capped directory hierarchy.
 *
 * This class is not intended to be instantiated directly. Use subclasses like
 * TempDirectoryObject that define specific caps.
 */

import path from "node:path"

import Sass from "./Sass.js"
import DirectoryObject from "./DirectoryObject.js"
import FileSystem from "./FileSystem.js"
import Valid from "./Valid.js"

/**
 * VDirectoryObject extends DirectoryObject with constraints that ensure
 * all operations are restricted to a specific directory tree (the "cap").
 *
 * All path operations are validated to ensure they remain within the
 * cap directory hierarchy for security.
 *
 * @augments DirectoryObject
 */
export default class VDirectoryObject extends DirectoryObject {
  #real
  #cap
  #cappedParentPath
  #cappedParent

  /**
   * Constructs a VDirectoryObject instance.
   *
   * Without a parent, creates a new cap at the specified real directory location
   * with virtual path "/". With a parent, the path is resolved relative to the
   * parent's virtual path (absolute paths treated as cap-relative).
   *
   * @param {string} [directory="."] - Real directory path when no parent (becomes cap), or relative/absolute virtual path when parent provided
   * @param {VDirectoryObject?} [parent] - Optional parent capped directory
   * @throws {Sass} If parent is provided but not a VDirectoryObject
   * @example
   * // Create new capped directory at current directory
   * const cwd = new VDirectoryObject()
   * // Virtual path: "/", Real path: process.cwd(), Cap: itself
   *
   * @example
   * // Create new capped directory
   * const cache = new VDirectoryObject("/home/user/.cache")
   * // Virtual path: "/", Real path: /home/user/.cache, Cap: itself
   *
   * @example
   * // Create subdirectory with parent
   * const data = new VDirectoryObject("data", cache)
   * // Virtual path: /data, Real path: /home/user/.cache/data, Cap: cache
   *
   * @example
   * // Virtual absolute path with parent (treated as cap-relative)
   * const config = new VDirectoryObject("/etc/config", cache)
   * // Virtual path: /etc/config, Real path: /home/user/.cache/etc/config, Cap: cache
   */
  constructor(directory, source=null) {
    Valid.type(source, "Null|VDirectoryObject")

    directory ||= "."

    const baseLocalPath = source?.path ?? "/"
    const baseRealPath = source?.real.path ?? directory

    if(source && directory.startsWith("/"))
      directory = directory.slice(1)

    // Find out what directory means to the basePath
    const realResolved = FileSystem.resolvePath(baseRealPath, directory)
    const localResolved = source
      ? FileSystem.resolvePath(baseLocalPath, directory)
      : path.parse(path.resolve("")).root

    super(localResolved)

    this.#real = new DirectoryObject(realResolved)
    this.#cap = source?.cap ?? this

    if(source) {
      this.#cappedParent = source
      this.#cappedParentPath = source.path
    } else {
      this.#cappedParent = null
      this.#cappedParentPath = null
    }
  }

  /**
   * Creates a VDirectoryObject from the current working directory.
   * This is useful when working with pnpx or other tools where you need to
   * cap at the project's root directory determined at runtime.
   *
   * @returns {VDirectoryObject} A VDirectoryObject capped at the current working directory
   * @example
   * // When using pnpx or similar tools
   * const projectRoot = VDirectoryObject.fromCwd()
   * const srcDir = projectRoot.getDirectory("src")
   * // srcDir is capped at the project root
   */
  static fromCwd() {
    return new this(process.cwd())
  }

  /**
   * Indicates whether this directory is capped (constrained to a specific tree).
   * Always returns true for VDirectoryObject instances.
   *
   * @returns {boolean} True for all VDirectoryObject instances
   * @example
   * const capped = new TempDirectoryObject("myapp")
   * console.log(capped.isVirtual) // true
   *
   * const regular = new DirectoryObject("/tmp")
   * console.log(regular.isVirtual) // false
   */
  get isVirtual() {
    return true
  }

  /**
   * Returns the cap (root) of the capped directory tree.
   * For root VDirectoryObject instances, returns itself.
   * For children, returns the inherited cap from the parent chain.
   *
   * @returns {VDirectoryObject} The cap directory object (root of the capped tree)
   * @example
   * const temp = new TempDirectoryObject("myapp")
   * console.log(temp.cap === temp) // true (root is its own cap)
   *
   * const subdir = temp.getDirectory("data")
   * console.log(subdir.cap === temp) // true (child inherits parent's cap)
   */
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
   * Note: The returned parent is a VDirectoryObject with the same cap.
   * This maintains the capping behavior throughout the directory hierarchy.
   *
   * @returns {VDirectoryObject|null} Parent directory or null if at cap root
   * @example
   * const capped = new TempDirectoryObject("myapp")
   * const subdir = capped.getDirectory("data")
   * console.log(subdir.parent.path) // Returns parent VDirectoryObject
   * console.log(capped.parent) // null (at cap root)
   */
  get parent() {
    return this.#cappedParent
  }

  /**
   * Returns the path of the parent directory.
   * Returns null if this directory is at the cap root (no parent).
   *
   * @returns {string|null} The parent directory path, or null if at cap root
   * @example
   * const temp = new TempDirectoryObject("myapp")
   * console.log(temp.parentPath) // null (at cap root)
   *
   * const subdir = temp.getDirectory("data")
   * console.log(subdir.parentPath) // "/" (parent's virtual path)
   */
  get parentPath() {
    return this.#cappedParentPath
  }

}
