/**
 * @file DirectoryObject.js
 * @description Class representing a directory and its metadata, including path
 * resolution and existence checks.
 */

import {glob, mkdir, opendir, readdir, rmdir} from "node:fs/promises"
import path from "node:path"
import {URL} from "node:url"

import Data from "../../browser/lib/Data.js"
import FileObject from "./FileObject.js"
import FS from "./FileSystem.js"
import Sass from "./Sass.js"
import Valid from "./Valid.js"
import VFileObject from "./VFileObject.js"

/**
 * DirectoryObject encapsulates metadata and operations for a directory,
 * providing immutable path resolution, existence checks, and content enumeration.
 *
 * Features:
 * - Immutable metadata (path, name, URL) sealed on construction
 * - Async existence checking and directory creation
 * - Pattern-based content filtering with glob support
 * - Path traversal via walkUp generator
 * - Intelligent path merging for subdirectories and files
 *
 * @property {string} supplied - The original directory path as supplied to constructor
 * @property {string} path - The absolute resolved directory path
 * @property {URL} url - The directory as a file:// URL
 * @property {string} name - The directory name (basename)
 * @property {string} module - The directory name without extension (same as name for directories)
 * @property {string} extension - The directory extension (typically empty string)
 * @property {string} sep - Platform-specific path separator ('/' or '\\')
 * @property {Array<string>} trail - Path segments split by separator
 * @property {boolean} isDirectory - Always true
 * @property {DirectoryObject|null} parent - The parent directory (null if root)
 * @property {Promise<boolean>} exists - Whether the directory exists (async getter)
 * @property {Generator<DirectoryObject>} walkUp - Generator yielding parent directories up to root
 *
 * @example
 * // Basic usage
 * const dir = new DirectoryObject("/projects/myapp")
 * console.log(dir.path) // "/projects/myapp"
 * console.log(await dir.exists) // true/false
 *
 * @example
 * // Read directory contents
 * const {files, directories} = await dir.read()
 * const {files: jsFiles} = await dir.read("*.js")
 *
 * @example
 * // Path traversal
 * for(const parent of dir.walkUp) {
 *   console.log(parent.path)
 * }
 *
 * @example
 * // Working with subdirectories and files
 * const subDir = dir.getDirectory("src/lib")
 * const file = dir.getFile("package.json")
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
   * @property {boolean} isDirectory - Always true
   */
  #meta = Object.seal({
    isDirectory: true,
    name: null,
    parent: undefined,
    parentPath: undefined,
    path: null,
    sep: null,
    supplied: null,
    trail: null,
    url: null,
  })

  // Not in the meta, because it gets frozen, and these are lazily
  // set.
  #parent = undefined

  /**
   * Constructs a DirectoryObject instance.
   *
   * @param {string?} [supplied="."] - The directory path (defaults to current directory)
   * @param {DirectoryObject?} [parent] - Optional parent directory (ignored by DirectoryObject, used by subclasses)
   */
  constructor(supplied) {
    super()

    const fixedDir = supplied || "."

    Valid.type(fixedDir, "String")

    const normalizedDir = FS.fixSlashes(fixedDir)
    const resolved = FS.resolvePath(DirectoryObject.cwd, normalizedDir)
    const {dir, name, root} = FS.pathParts(resolved)
    const url = new URL(FS.pathToUrl(resolved))
    const trail = resolved.split(path.sep)

    this.#meta.name = name
    this.#meta.parentPath = dir == root
      ? null
      : dir
    this.#meta.path = resolved
    this.#meta.sep = path.sep
    this.#meta.supplied = supplied
    this.#meta.trail = trail
    this.#meta.url = url

    Object.freeze(this.#meta)
  }

  /**
   * Creates a DirectoryObject from the current working directory.
   * Useful when working with pnpx or other tools where the project root
   * needs to be determined at runtime.
   *
   * @returns {DirectoryObject} A DirectoryObject representing the current working directory
   * @example
   * const projectRoot = DirectoryObject.fromCwd()
   * console.log(projectRoot.path) // process.cwd()
   */
  static fromCwd() {
    return new this(FS.cwd)
  }

  /**
   * Returns a string representation of the DirectoryObject.
   *
   * @returns {string} string representation of the DirectoryObject
   */
  toString() {
    return `[${this.constructor.name}: ${this.path}]`
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
   * Returns the parent directory of this directory.
   * Returns null if this directory is the root directory.
   * Computed lazily on first access and cached.
   *
   * @returns {DirectoryObject|null} The parent directory or null if root
   * @example
   * const dir = new DirectoryObject('/path/to/directory')
   * console.log(dir.parent.path) // '/path/to'
   *
   * const root = new DirectoryObject('/')
   * console.log(root.parent) // null
   */
  get parent() {
    // Return cached value if available
    if(this.#parent !== undefined)
      return this.#parent

    if(this.#meta.parentPath === null) {
      this.#parent = null

      return this.#parent
    }

    this.#parent = new this.constructor(this.#meta.parentPath)

    return this.#parent
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
    const path = this.real?.path ?? this.path

    try {
      (await opendir(path)).close()

      return true
    } catch {
      return false
    }
  }

  /**
   * Lists the contents of a directory, optionally filtered by a glob pattern.
   *
   * Returns FileObject and DirectoryObject instances for regular directories.
   * Returns VFileObject and VDirectoryObject instances when called on virtual directories.
   *
   * @async
   * @param {string} [pat=""] - Optional glob pattern to filter results (e.g., "*.txt", "test-*")
   * @returns {Promise<{files: Array<FileObject|VFileObject>, directories: Array<DirectoryObject|VDirectoryObject>}>} Object containing arrays of files and directories
   * @example
   * const dir = new DirectoryObject("./src")
   * const {files, directories} = await dir.read()
   * console.log(files) // All files in ./src
   *
   * @example
   * // Filter for specific files
   * const {files} = await dir.read("*.js")
   * console.log(files) // Only .js files in ./src
   */
  async read(pat="") {
    const withFileTypes = true
    const url = this.isVirtual
      ? this.real?.url
      : this.url

    Valid.type(url, "URL")
    // const href = url.href

    const found = !pat
      ? await readdir(url, {withFileTypes})
      : await Array.fromAsync(
        glob(pat, {
          cwd: this.isVirtual ? this.real?.path : this.path,
          withFileTypes,
        })
      )

    const files = found
      .filter(dirent => dirent.isFile())
      .map(dirent => this.getFile(dirent.name))

    const directories = found
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        const dirPath = FS.resolvePath(this.path, dirent.name)

        return new this.constructor(dirPath, this)
      })

    return {files, directories}
  }

  /**
   * Recursively searches directory tree for files and directories matching a glob pattern.
   * Unlike read(), this method searches recursively through subdirectories.
   *
   * Returns FileObject and DirectoryObject instances for regular directories.
   * Returns VFileObject and VDirectoryObject instances when called on virtual directories.
   *
   * @async
   * @param {string} [pat=""] - Glob pattern to filter results
   * @returns {Promise<{files: Array<FileObject|VFileObject>, directories: Array<DirectoryObject|VDirectoryObject>}>} Object containing arrays of matching files and directories
   * @throws {Sass} If an entry is neither a file nor directory
   * @example
   * const dir = new DirectoryObject("./src")
   * const {files} = await dir.glob("**\/*.test.js")
   * console.log(files) // All .test.js files in ./src and subdirectories
   *
   * @example
   * // Find all package.json files recursively
   * const {files} = await dir.glob("**\/package.json")
   */
  async glob(pat="") {
    const withFileTypes = true
    const found = await Array.fromAsync(
      glob(pat, {
        cwd: this.isVirtual ? this.real?.path : this.path,
        withFileTypes,
      })
    )

    const files = [], directories = []
    const virtual = this.isVirtual

    for(const e of found) {
      if(e.isFile()) {
        const {name, parentPath} = e
        const resolved = FS.resolvePath(parentPath, name)

        const file = virtual
          ? new VFileObject(path.relative(this.real.path, resolved), this)
          : new FileObject(resolved, this)

        files.push(file)
      } else if(e.isDirectory()) {
        const {name, parentPath} = e
        const resolved = FS.resolvePath(parentPath, name)
        const relativePath = virtual
          ? path.relative(this.real.path, resolved)
          : resolved
        const directory = new this.constructor(relativePath, this)

        directories.push(directory)
      } else {
        throw Sass.new(`wtf is this? ${e}`)
      }
    }

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

    const path = this.real?.path ?? this.path

    try {
      await mkdir(path, options)
    } catch(e) {
      if(e.code === "EEXIST") {
        // Directory already exists, ignore
        return
      }

      throw Sass.new(`Unable to create directory '${path}': ${e.message}`)
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
    const {root, base, dir} = FS.pathParts(this.path)
    const sep = path.sep
    // Remove the root and then re-add it every loop, because that's fun!
    const choppedDir = Data.chopLeft(dir, root)
    const trail = [...choppedDir.split(sep).filter(Boolean), base]

    if(trail.length === 0)
      return yield this

    do
      yield new this.constructor(path.join(root, ...trail), this.cap)

    while(trail.pop())
  }

  /**
   * Generator that walks up the directory tree, yielding each parent directory.
   * Starts from the current directory and yields each parent until reaching the root.
   *
   * @returns {DirectoryObject} Generator yielding parent DirectoryObject instances
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
    const dirPath = this.real?.path ?? this.path

    if(!dirPath)
      throw Sass.new("This object does not represent a valid resource.")

    if(!(await this.exists))
      throw Sass.new(`No such resource '${this.url.href}'`)

    return await rmdir(dirPath)
  }

  /**
   * Checks if a file exists within this directory.
   *
   * @param {string} filename - The filename to check for
   * @returns {Promise<boolean>} True if the file exists, false otherwise
   */
  async hasFile(filename) {
    const file = this.isVirtual
      ? new VFileObject(filename, this)
      : new FileObject(filename, this)

    return await file.exists
  }

  /**
   * Checks if a subdirectory exists within this directory.
   *
   * @param {string} dirname - The directory name to check for
   * @returns {Promise<boolean>} True if the directory exists, false otherwise
   */
  async hasDirectory(dirname) {
    const dir = FS.resolvePath(this.real?.path ?? this.path, dirname)
    const directory = new DirectoryObject(dir)

    return await directory.exists
  }

  /**
   * Creates a new DirectoryObject by extending this directory's path.
   *
   * Uses overlapping path segment detection to intelligently combine paths.
   * Preserves the temporary flag from the current directory.
   *
   * @param {string} newPath - The path to append to this directory's path.
   * @returns {DirectoryObject} A new DirectoryObject with the extended path.
   * @example
   * const dir = new DirectoryObject("/projects/git/toolkit")
   * const subDir = dir.addDirectory("src/lib")
   * console.log(subDir.path) // "/projects/git/toolkit/src/lib"
   */
  getDirectory(newPath) {
    Valid.type(newPath, "String")

    const thisPath = this.path
    const merged = FS.mergeOverlappingPaths(thisPath, newPath)

    return new this.constructor(merged)
  }

  /**
   * Creates a new FileObject by extending this directory's path.
   *
   * Uses overlapping path segment detection to intelligently combine paths.
   *
   * @param {string} filename - The filename to append to this directory's path.
   * @returns {FileObject} A new FileObject with the extended path.
   * @example
   * const dir = new DirectoryObject("/projects/git/toolkit")
   * const file = dir.addFile("package.json")
   * console.log(file.path) // "/projects/git/toolkit/package.json"
   */
  getFile(filename) {
    Valid.type(filename, "String", {allowEmpty: false})

    const thisPath = this.path
    const merged = FS.mergeOverlappingPaths(thisPath, filename)

    return new FileObject(merged)
  }
}
