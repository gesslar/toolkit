/**
 * @file DirectoryObject.js
 * @description Class representing a directory and its metadata, including path
 * resolution and existence checks.
 */

import fs from "node:fs/promises"
import path from "node:path"
import util from "node:util"
import {URL} from "node:url"

import FS from "./FS.js"
import FileObject from "./FileObject.js"
import Sass from "./Sass.js"

/**
 * DirectoryObject encapsulates metadata and operations for a directory,
 * including path resolution and existence checks.
 *
 * @property {string} supplied - The supplied directory
 * @property {string} path - The resolved path
 * @property {URL} url - The directory URL
 * @property {string} name - The directory name
 * @property {string} module - The directory name without extension
 * @property {string} extension - The directory extension (usually empty)
 * @property {boolean} isFile - Always false
 * @property {boolean} isDirectory - Always true
 * @property {Promise<boolean>} exists - Whether the directory exists (async)
 */
export default class DirectoryObject extends FS {
  /**
   * @type {object}
   * @private
   * @property {string|null} supplied - User-supplied path
   * @property {string|null} path - The absolute file path
   * @property {URL|null} url - The file URL
   * @property {string|null} name - The file name
   * @property {string|null} module - The file name without extension
   * @property {string|null} extension - The file extension
   * @property {boolean} isFile - Always false
   * @property {boolean} isDirectory - Always true
   */
  #meta = Object.seal({
    supplied: null,
    path: null,
    url: null,
    name: null,
    module: null,
    extension: null,
    isFile: false,
    isDirectory: true,
    trail: null,
    sep: null,
  })

  /**
   * Constructs a DirectoryObject instance.
   *
   * @param {string} directory - The directory path
   */
  constructor(directory) {
    super()

    const fixedDir = FS.fixSlashes(directory ?? ".")
    const resolved = path.resolve(fixedDir)
    const url = new URL(FS.pathToUri(resolved))
    const baseName = path.basename(resolved) || "."
    const trail = resolved.split(path.sep)
    const sep = path.sep

    this.#meta.supplied = fixedDir
    this.#meta.path = resolved
    this.#meta.url = url
    this.#meta.name = baseName
    this.#meta.extension = ""
    this.#meta.module = baseName
    this.#meta.trail = trail
    this.#meta.sep = sep

    Object.freeze(this.#meta)
  }

  /**
   * Returns a string representation of the DirectoryObject.
   *
   * @returns {string} string representation of the DirectoryObject
   */
  toString() {
    return `[DirectoryObject: ${this.path}]`
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
      isDirectory: this.isDirectory
    }
  }

  /**
   * Custom inspect method for Node.js console.
   *
   * @returns {object} JSON representation of this object.
   */
  [util.inspect.custom]() {
    return this.toJSON()
  }

  /**
   * Checks if the directory exists (async).
   *
   * @returns {Promise<boolean>} - A Promise that resolves to true or false
   */
  get exists() {
    return this.#directoryExists()
  }

  /**
   * Return the path as passed to the constructor.
   *
   * @returns {string} The directory path
   */
  get supplied() {
    return this.#meta.supplied
  }

  /**
   * Return the resolved path
   *
   * @returns {string} The directory path
   */
  get path() {
    return this.#meta.path
  }

  /**
   * Returns the URL of the current directory.
   *
   * @returns {URL} The directory URL
   */
  get url() {
    return this.#meta.url
  }

  /**
   * Returns the directory name with extension (if any) without the path.
   *
   * @returns {string} The directory name
   */
  get name() {
    return this.#meta.name
  }

  /**
   * Returns the directory name without the path or extension.
   *
   * @returns {string} The directory name without extension
   */
  get module() {
    return this.#meta.module
  }

  /**
   * Returns the directory extension. Will be an empty string if unavailable.
   *
   * @returns {string} The directory extension
   */
  get extension() {
    return this.#meta.extension
  }

  /**
   * Returns the platform-specific path separator.
   *
   * @returns {string} The path separator ('/' on Unix, '\\' on Windows)
   */
  get sep() {
    return this.#meta.sep
  }

  /**
   * Returns the directory path split into segments.
   *
   * @returns {Array<string>} Array of path segments
   * @example
   * const dir = new DirectoryObject('/path/to/directory')
   * console.log(dir.trail) // ['', 'path', 'to', 'directory']
   */
  get trail() {
    return this.#meta.trail
  }

  /**
   * Returns false. Because this is a directory.
   *
   * @returns {boolean} Always false
   */
  get isFile() {
    return this.#meta.isFile
  }

  /**
   * We're a directory!
   *
   * @returns {boolean} Always true
   */
  get isDirectory() {
    return this.#meta.isDirectory
  }

  /**
   * Check if a directory exists
   *
   * @returns {Promise<boolean>} Whether the directory exists
   */
  async #directoryExists() {
    try {
      (await fs.opendir(this.path)).close()

      return true
    } catch(_) {
      return false
    }
  }

  /**
   * Lists the contents of a directory.
   *
   * @returns {Promise<{files: Array<FileObject>, directories: Array<DirectoryObject>}>} The files and directories in the directory.
   */
  async read() {
    const found = await fs.readdir(this.url, {withFileTypes: true})

    const files = found
      .filter(dirent => dirent.isFile())
      .map(dirent => new FileObject(path.join(this.path, dirent.name)))

    const directories = found
      .filter(dirent => dirent.isDirectory())
      .map(dirent => new DirectoryObject(path.join(this.path, dirent.name)))

    return {files, directories}
  }

  /**
   * Ensures a directory exists, creating it if necessary.
   * Gracefully handles the case where the directory already exists.
   *
   * @async
   * @param {object} [options] - Options to pass to fs.mkdir (e.g., {recursive: true, mode: 0o755})
   * @returns {Promise<void>}
   * @throws {Sass} If directory creation fails for reasons other than already existing
   * @example
   * // Create directory recursively
   * const dir = new DirectoryObject('./build/output')
   * await dir.assureExists({recursive: true})
   */
  async assureExists(options = {}) {
    if(await this.exists)
      return

    try {
      await fs.mkdir(this.path, options)
    } catch(e) {
      if(e.code === "EEXIST") {
        // Directory already exists, ignore
        return
      }

      throw Sass.new(`Unable to create directory '${this.path}': ${e.message}`)
    }
  }

  /**
   * Private generator that walks up the directory tree.
   *
   * @private
   * @generator
   * @yields {DirectoryObject} Parent directory objects from current to root
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
        yield new DirectoryObject(this.sep)
        break
      }

      yield new DirectoryObject(joined)
      curr.pop()
    }
  }

  /**
   * Generator that walks up the directory tree, yielding each parent directory.
   * Starts from the current directory and yields each parent until reaching the root.
   *
   * @returns {object} Generator yielding parent DirectoryObject instances
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

  /**
   * Deletes an empty directory from the filesystem.
   *
   * Recursive deletion is intentionally not supported. If you need to delete
   * a directory with contents, you must imperatively decide your deletion
   * strategy and handle it explicitly.
   *
   * @returns {Promise<void>} Resolves when directory is deleted
   * @throws {Sass} If the directory URL is invalid
   * @throws {Sass} If the directory does not exist
   * @throws {Error} If the directory is not empty (from fs.rmdir)
   * @example
   * const dir = new DirectoryObject('./temp/cache')
   * await dir.delete() // Only works if directory is empty
   */
  async delete() {
    const dirPath = this.path

    if(!dirPath)
      throw Sass.new("This object does not represent a valid resource.")

    if(!(await this.exists))
      throw Sass.new(`No such resource '${this.url.href}'`)

    return await fs.rmdir(this.path)
  }
}
