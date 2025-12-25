/**
 * @file TempDirectoryObject.js
 * @description Class representing a temporary directory that is constrained
 * to the OS's temporary directory tree.
 */

import fs from "node:fs"
import os from "node:os"

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
    let finalName = name

    // Only generate unique suffix if we have a name and no parent
    if(name && !parent) {
      const prefix = name.endsWith("-") ? name : `${name}-`
      const uniqueSuffix =
        Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()
      finalName = `${prefix}${uniqueSuffix}`
    }

    // Call parent constructor with the cap set to OS temp directory
    // Mark as temporary=true so remove() works
    super(finalName, os.tmpdir(), parent, true)

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
      fs.mkdirSync(this.path)
    } catch(e) {
      // EEXIST is fine - directory already exists
      if(e.code !== "EEXIST") {
        throw Sass.new(
          `Unable to create temporary directory '${this.path}': ${e.message}`
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
