/**
 * @file TempDirectoryObject.js
 * @description Class representing a temporary directory that is constrained
 * to the OS's temporary directory tree.
 */

import fs, {mkdirSync, mkdtempSync} from "node:fs"
import os from "node:os"
import path from "node:path"

import Data from "../browser/lib/Data.js"
import CappedDirectoryObject from "./CappedDirectoryObject.js"
import DirectoryObject from "./DirectoryObject.js"
import FS from "./FS.js"
import Sass from "./Sass.js"
import Valid from "./Valid.js"

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
  #tmpReal
  #tmpCap

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
   * @param {string?} [directory] - Base name for the temp directory (if empty/null, uses OS temp dir)
   * @param {TempDirectoryObject?} [parent] - Optional parent temporary directory
   * @throws {Sass} If name is absolute
   * @throws {Sass} If name is empty (when parent is provided)
   * @throws {Sass} If name contains path separators
   * @throws {Sass} If parent is provided but not a temporary directory
   * @throws {Sass} If parent's lineage does not trace back to the OS temp directory
   * @throws {Sass} If directory creation fails
   * @example
   * // Create with unique name
   * const temp = new TempDirectoryObject("myapp")
   * console.log(temp.path) // "/"
   * console.log(temp.real.path) // "/tmp/myapp-ABC123"
   */
  constructor(directory, source=null) {
    Valid.type(source, "Null|TempDirectoryObject")

    directory ||= "temp"
    directory = Data.append(directory, source ? "" : "-")

    const parentRealPath = source?.real.path ?? os.tmpdir()

    if(source && path.isAbsolute(directory)) {
      const {root} = FS.pathParts(directory)

      directory = Data.chopLeft(directory, root)
    }

    let realTempDirectoryPath, toSuper

    if(source) {
      toSuper = `/${directory}`
      realTempDirectoryPath =
        FS.mergeOverlappingPaths(parentRealPath, directory)
      if(!fs.existsSync(realTempDirectoryPath))
        mkdirSync(realTempDirectoryPath)
    } else {
      realTempDirectoryPath =
        mkdtempSync(FS.mergeOverlappingPaths(os.tmpdir(), directory))
      toSuper = path.resolve(path.sep)
    }

    super(toSuper, source)

    this.#tmpReal = new DirectoryObject(realTempDirectoryPath)
    this.#tmpCap = source?.cap ?? this
  }

  get isTemporary() {
    return true
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
    return this.#tmpReal
  }

  get cap() {
    return this.#tmpCap
  }

  /**
   * Recursively removes a temporary directory and all its contents.
   *
   * This method will delete all files and subdirectories within this directory,
   * then delete the directory itself. It only works on directories explicitly
   * marked as temporary for safety.
   *
   * @async
   * @returns {Promise<void>}
   * @throws {Sass} If the directory is not marked as temporary
   * @throws {Sass} If the directory deletion fails
   * @example
   * const tempDir = new TempDirectoryObject("my-temp")
   * await tempDir.assureExists()
   * // ... use the directory ...
   * await tempDir.remove() // Recursively deletes everything
   */
  async remove() {
    await this.#recurseDelete(this.real)
  }

  async #recurseDelete(directory) {
    const {files, directories} = await directory.read()

    // files first
    for(const file of files)
      await file.delete()

    // now dir-ty dirs
    for(const dir of directories)
      await this.#recurseDelete(dir)

    // byebyebyeeee 🕺🏾
    await directory.delete()
  }

  /**
   * TempDirectoryObject does not support fromCwd() since it is specifically
   * designed to work within the OS temporary directory tree.
   *
   * @throws {Sass} Always throws an error
   */
  static fromCwd() {
    throw Sass.new("TempDirectoryObject.fromCwd() is not supported.")
  }
}
