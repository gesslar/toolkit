/**
 * @file TempDirectoryObject.js
 * @description Class representing a temporary directory that is constrained
 * to the OS's temporary directory tree.
 */

import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import CappedDirectoryObject from "./CappedDirectoryObject.js"
import Sass from "./Sass.js"

/**
 * TempDirectoryObject extends CappedDirectoryObject with the cap set to
 * the OS's temporary directory. Temporary directories are created
 * synchronously during construction and exist immediately.
 *
 * All path operations are validated to ensure they remain within the temp
 * directory hierarchy for security.
 *
 * @augments CappedDirectoryObject
 */
export default class TempDirectoryObject extends CappedDirectoryObject {

  /**
   * Constructs a TempDirectoryObject instance and creates the directory.
   *
   * The directory is created synchronously during construction, so it will
   * exist immediately after the constructor returns.
   *
   * If no name is provided, uses the OS temp directory directly. If a name
   * is provided without a parent, creates a new directory with a unique suffix.
   * If a parent is provided, creates a subdirectory within that parent.
   *
   * @param {string?} [name] - Base name for the temp directory (if empty/null, uses OS temp dir)
   * @param {TempDirectoryObject?} [parent] - Optional parent temporary directory
   * @throws {Sass} If name is absolute
   * @throws {Sass} If name is empty (when parent is provided)
   * @throws {Sass} If name contains path separators
   * @throws {Sass} If parent is provided but not a temporary directory
   * @throws {Sass} If parent's lineage does not trace back to the OS temp directory
   * @throws {Sass} If directory creation fails
   * @example
   * // Use OS temp directory directly
   * const temp = new TempDirectoryObject()
   * console.log(temp.path) // "/tmp"
   *
   * @example
   * // Create with unique name
   * const temp = new TempDirectoryObject("myapp")
   * console.log(temp.path) // "/tmp/myapp-ABC123"
   *
   * @example
   * // Nested temp directories
   * const parent = new TempDirectoryObject("parent")
   * const child = new TempDirectoryObject("child", parent)
   * await parent.remove() // Removes both parent and child
   */
  constructor(name, parent=null) {
    let dirPath
    let cappedParent = parent

    if(!parent) {
      // No parent: need to create a capped parent at tmpdir first
      cappedParent = new CappedDirectoryObject(os.tmpdir(), null, true)

      if(name) {
        // Check if name is a simple name (no separators, not absolute)
        const isSimpleName = !path.isAbsolute(name) &&
                             !name.includes("/") &&
                             !name.includes("\\") &&
                             !name.includes(path.sep)

        if(isSimpleName) {
          // Simple name: add unique suffix
          const prefix = name.endsWith("-") ? name : `${name}-`
          const uniqueSuffix =
            Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase()
          dirPath = `${prefix}${uniqueSuffix}`
        } else {
          // Complex path: use as-is, let CappedDirectoryObject handle coercion
          dirPath = name
        }
      } else {
        // No name: use tmpdir itself (no parent)
        dirPath = os.tmpdir()
        cappedParent = null
      }
    } else {
      // With parent: validate it's a proper temp directory parent
      if(!(parent instanceof CappedDirectoryObject)) {
        throw Sass.new(
          "Parent must be a CappedDirectoryObject or TempDirectoryObject."
        )
      }

      // SECURITY: Ensure parent's cap is tmpdir (prevent escape to other caps)
      const tmpdir = os.tmpdir()
      if(parent.cap !== tmpdir) {
        throw Sass.new(
          `Parent must be capped to OS temp directory (${tmpdir}), ` +
          `got cap: ${parent.cap}`
        )
      }

      dirPath = name || ""
      if(!dirPath) {
        throw Sass.new("Name must not be empty when parent is provided.")
      }
    }

    // Call parent constructor with new signature
    super(dirPath, cappedParent, true)

    // Temp-specific behavior: create directory immediately
    this.#createDirectory()
  }

  /**
   * Creates the directory synchronously on the filesystem.
   *
   * @private
   * @throws {Sass} If directory creation fails
   */
  #createDirectory() {
    try {
      // Use recursive: true to create parent directories as needed
      fs.mkdirSync(this.realPath, {recursive: true})
    } catch(e) {
      // EEXIST is fine - directory already exists
      if(e.code !== "EEXIST") {
        throw Sass.new(
          `Unable to create temporary directory '${this.realPath}': ${e.message}`
        )
      }
    }
  }

  /**
   * Creates a new TempDirectoryObject by extending this directory's path.
   *
   * Validates that the resulting path remains within the temp directory tree.
   *
   * @param {string} newPath - The path segment to append
   * @returns {TempDirectoryObject} A new TempDirectoryObject with the extended path
   * @throws {Sass} If the path would escape the temp directory
   * @throws {Sass} If the path is absolute
   * @throws {Sass} If the path contains traversal (..)
   * @example
   * const temp = new TempDirectoryObject("myapp")
   * const subDir = temp.getDirectory("data")
   * console.log(subDir.path) // "/tmp/myapp-ABC123/data"
   */
  getDirectory(newPath) {
    // Delegate to base class getDirectory() which will call TempDirectoryObject constructor
    return super.getDirectory(newPath)
  }

  /**
   * Creates a new FileObject by extending this directory's path.
   *
   * Validates that the resulting path remains within the temp directory tree.
   *
   * @param {string} filename - The filename to append
   * @returns {FileObject} A new FileObject with the extended path
   * @throws {Sass} If the path would escape the temp directory
   * @throws {Sass} If the path is absolute
   * @throws {Sass} If the path contains traversal (..)
   * @example
   * const temp = new TempDirectoryObject("myapp")
   * const file = temp.getFile("config.json")
   * console.log(file.path) // "/tmp/myapp-ABC123/config.json"
   */
  getFile(filename) {
    // Delegate to base class getFile() which handles security checks
    return super.getFile(filename)
  }

  /**
   * Returns a string representation of the TempDirectoryObject.
   *
   * @returns {string} string representation of the TempDirectoryObject
   */
  toString() {
    return `[TempDirectoryObject: ${this.path}]`
  }
}
