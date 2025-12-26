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
   * This is an abstract base class - use subclasses like TempDirectoryObject
   * that define specific caps.
   *
   * @param {string?} name - Base name for the directory (if empty/null, uses cap root)
   * @param {string} cap - The root path that constrains this directory tree
   * @param {CappedDirectoryObject?} [parent] - Optional parent capped directory
   * @param {boolean} [temporary=false] - Whether this is a temporary directory
   * @throws {Sass} If name is absolute
   * @throws {Sass} If name is empty (when parent is provided)
   * @throws {Sass} If name contains path separators
   * @throws {Sass} If parent is not a capped directory
   * @throws {Sass} If parent's lineage does not trace back to the cap
   * @throws {Sass} If the resulting path would escape the cap
   */
  constructor(name, cap, parent=null, temporary=false) {
    Valid.type(cap, "String")

    // Validate parent using instanceof since TypeSpec doesn't understand inheritance
    if(parent !== null && !(parent instanceof CappedDirectoryObject)) {
      throw Sass.new(`Parent must be null or a CappedDirectoryObject instance, got ${Data.typeOf(parent)}`)
    }

    let dirPath

    // Special case: empty name with no parent means use cap root
    if(!name && !parent) {
      dirPath = cap
    } else {
      Valid.type(name, "String")

      // Security: Validate name before any processing
      Valid.assert(
        !path.isAbsolute(name),
        "Capped directory name must not be an absolute path.",
      )
      Valid.assert(
        name.length > 0,
        "Capped directory name must not be empty.",
      )
      Valid.assert(
        !name.includes("/") && !name.includes("\\") && !name.includes(path.sep),
        "Capped directory name must not contain path separators.",
      )

      if(parent) {
        // Ensure parent is capped
        Valid.assert(parent.capped, "Parent must be a capped DirectoryObject.")

        // Ensure parent has same cap
        Valid.assert(
          parent.cap === cap,
          "Parent must have the same cap as this directory.",
        )

        const parentPath = parent.path

        // Validate parent's lineage traces back to the cap
        let found = false
        if(parent.trail) {
          for(const p of parent.walkUp) {
            if(p.path === cap) {
              found = true
              break
            }
          }
        }

        Valid.assert(
          found,
          `The lineage of this directory must trace back to the cap '${cap}'.`,
        )

        dirPath = path.join(parentPath, name)
      } else {
        // No parent - this is a root-level capped directory
        dirPath = path.join(cap, name)
      }
    }

    // Call parent constructor with the path
    // Pass through the temporary flag (subclasses control this)
    super(dirPath, temporary)

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
    const resolved = path.resolve(this.path)
    const capResolved = path.resolve(cap)

    // Check if the resolved path starts with the cap directory
    if(!resolved.startsWith(capResolved)) {
      throw Sass.new(
        `Path '${this.path}' is not within the cap directory '${cap}'`
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
    if(this.path === capResolved) {
      return null
    }

    // Otherwise return the parent (plain DirectoryObject, not capped)
    return super.parent
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

    // Use super.walkUp but stop when we would go beyond the cap
    for(const dir of super.walkUp) {
      // Don't yield anything beyond the cap
      if(!dir.path.startsWith(capResolved)) {
        break
      }

      yield dir

      // Stop after yielding the cap
      if(dir.path === capResolved) {
        break
      }
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
   * Validates that the resulting path remains within the cap directory tree.
   *
   * @param {string} newPath - The path segment to append
   * @returns {CappedDirectoryObject} A new CappedDirectoryObject with the extended path
   * @throws {Sass} If the path would escape the cap directory
   * @throws {Sass} If the path is absolute
   * @throws {Sass} If the path contains traversal (..)
   * @example
   * const capped = new TempDirectoryObject("myapp")
   * const subDir = capped.getDirectory("data")
   * console.log(subDir.path) // "/tmp/myapp-ABC123/data"
   */
  getDirectory(newPath) {
    Valid.type(newPath, "String")

    // Prevent absolute paths
    if(path.isAbsolute(newPath)) {
      throw Sass.new("Absolute paths are not allowed in capped directories")
    }

    // Prevent path traversal attacks
    const normalized = path.normalize(newPath)
    if(normalized.includes("..")) {
      throw Sass.new("Path traversal (..) is not allowed in capped directories")
    }

    // Use the constructor of the current class (supports subclassing)
    // Pass this as parent so the child inherits the same cap
    return new this.constructor(newPath, this)
  }

  /**
   * Creates a new FileObject by extending this directory's path.
   *
   * Validates that the resulting path remains within the cap directory tree.
   *
   * @param {string} filename - The filename to append
   * @returns {FileObject} A new FileObject with the extended path
   * @throws {Sass} If the path would escape the cap directory
   * @throws {Sass} If the path is absolute
   * @throws {Sass} If the path contains traversal (..)
   * @example
   * const capped = new TempDirectoryObject("myapp")
   * const file = capped.getFile("config.json")
   * console.log(file.path) // "/tmp/myapp-ABC123/config.json"
   */
  getFile(filename) {
    Valid.type(filename, "String")

    // Prevent absolute paths
    if(path.isAbsolute(filename)) {
      throw Sass.new("Absolute paths are not allowed in capped directories")
    }

    // Prevent path traversal attacks
    const normalized = path.normalize(filename)
    if(normalized.includes("..")) {
      throw Sass.new("Path traversal (..) is not allowed in capped directories")
    }

    // Create the file path by joining this directory with the filename
    const filePath = path.join(this.path, filename)

    return new FileObject(filePath)
  }

  /**
   * Returns a string representation of the CappedDirectoryObject.
   *
   * @returns {string} string representation of the CappedDirectoryObject
   */
  toString() {
    return `[CappedDirectoryObject: ${this.path}]`
  }
}
