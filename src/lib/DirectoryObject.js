/**
 * @file DirectoryObject.js
 * @description Class representing a directory and its metadata, including path
 * resolution and existence checks.
 */

import {glob, mkdir, opendir, readdir, rmdir} from "node:fs/promises"
import path from "node:path"
import {URL} from "node:url"
import util from "node:util"

import {Data, Valid} from "../browser/index.js"
import FS from "./FS.js"
import FileObject from "./FileObject.js"
import Sass from "./Sass.js"

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
 * - Support for temporary directory management
 *
 * @property {string} supplied - The original directory path as supplied to constructor
 * @property {string} path - The absolute resolved directory path
 * @property {URL} url - The directory as a file:// URL
 * @property {string} name - The directory name (basename)
 * @property {string} module - The directory name without extension (same as name for directories)
 * @property {string} extension - The directory extension (typically empty string)
 * @property {string} sep - Platform-specific path separator ('/' or '\\')
 * @property {Array<string>} trail - Path segments split by separator
 * @property {boolean} temporary - Whether this is marked as a temporary directory
 * @property {boolean} isFile - Always false (this is a directory)
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
    temporary: null,
  })

  /**
   * Cached parent directory object
   *
   * @type {DirectoryObject|null|undefined}
   * @private
   */
  #parent = undefined

  /**
   * Constructs a DirectoryObject instance.
   *
   * @param {string? | DirectoryObject?} directory - The directory path or DirectoryObject
   * @param {boolean} [temporary] - Whether this is a temporary directory.
   */
  constructor(directory=null, temporary=false) {
    super()

    Valid.type(directory, "String|TempDirectoryObject|DirectoryObject|Null")

    // If passed a DirectoryObject, extract its path
    if(Data.isType(directory, "DirectoryObject") || Data.isType(directory, "TempDirectoryObject"))
      directory = directory.path

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
    this.#meta.temporary = temporary

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
      isDirectory: this.isDirectory,
      parent: this.parent ? this.parent.path : null
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
   * Returns whether this directory is marked as temporary.
   *
   * @returns {boolean} True if this is a temporary directory, false otherwise
   */
  get temporary() {
    return this.#meta.temporary
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
    if(this.#parent !== undefined) {
      return this.#parent
    }

    // Compute parent directory (null if we're at root)
    const parentPath = path.dirname(this.path)
    const isRoot = parentPath === this.path

    // Cache and return
    this.#parent = isRoot
      ? null
      : new DirectoryObject(parentPath, this.temporary)

    return this.#parent
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
    if(!this.temporary)
      throw Sass.new("This is not a temporary directory.")

    /** @type {{files: Array<FileObject>, directories: Array<DirectoryObject>}} */
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
      (await opendir(this.path)).close()

      return true
    } catch(_) {
      return false
    }
  }

  /**
   * Lists the contents of a directory, optionally filtered by a glob pattern.
   *
   * @async
   * @param {string} [pat=""] - Optional glob pattern to filter results (e.g., "*.txt", "test-*")
   * @returns {Promise<{files: Array<FileObject>, directories: Array<DirectoryObject>}>} Object containing arrays of files and directories
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
    const cwd = this.path, withFileTypes = true
    const found = !pat
      ? await readdir(this.url, {withFileTypes})
      : await Array.fromAsync(
        glob(pat, {
          cwd,
          withFileTypes,
          exclude: candidate => candidate.parentPath !== cwd
        })
      )

    const files = found
      .filter(dirent => dirent.isFile())
      .map(dirent => new FileObject(path.join(this.path, dirent.name)))

    const directories = found
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        const dirPath = path.join(this.path, dirent.name)

        return new DirectoryObject(dirPath, this.temporary)
      })

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
      await mkdir(this.path, options)
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

    return await rmdir(this.path)
  }

  /**
   * Checks if a file exists within this directory.
   *
   * @param {string} filename - The filename to check for
   * @returns {Promise<boolean>} True if the file exists, false otherwise
   */
  async hasFile(filename) {
    const file = new FileObject(filename, this)

    return await file.exists
  }

  /**
   * Checks if a subdirectory exists within this directory.
   *
   * @param {string} dirname - The directory name to check for
   * @returns {Promise<boolean>} True if the directory exists, false otherwise
   */
  async hasDirectory(dirname) {
    const resolved = FS.resolvePath(this.path, dirname)
    const directory = new DirectoryObject(resolved)

    return await directory.exists
  }

  /**
   * Creates a new DirectoryObject by extending this directory's path.
   *
   * Uses intelligent path merging that detects overlapping segments to avoid
   * duplication (e.g., "/projects/toolkit" + "toolkit/src" = "/projects/toolkit/src").
   * The temporary flag is preserved from the parent directory.
   *
   * @param {string} newPath - The subdirectory path to append (can be nested like "src/lib")
   * @returns {DirectoryObject} A new DirectoryObject instance with the combined path
   * @throws {Sass} If newPath is not a string
   * @example
   * const dir = new DirectoryObject("/projects/git/toolkit")
   * const subDir = dir.getDirectory("src/lib")
   * console.log(subDir.path) // "/projects/git/toolkit/src/lib"
   *
   * @example
   * // Handles overlapping segments intelligently
   * const dir = new DirectoryObject("/projects/toolkit")
   * const subDir = dir.getDirectory("toolkit/src")
   * console.log(subDir.path) // "/projects/toolkit/src" (not /projects/toolkit/toolkit/src)
   */
  getDirectory(newPath) {
    Valid.type(newPath, "String")

    const thisPath = this.path
    const merged = FS.mergeOverlappingPaths(thisPath, newPath)

    return new this.constructor(merged, this.temporary)
  }

  /**
   * Creates a new FileObject by extending this directory's path.
   *
   * Uses intelligent path merging that detects overlapping segments to avoid
   * duplication. The resulting FileObject can be used for reading, writing,
   * and other file operations.
   *
   * @param {string} filename - The filename to append (can include subdirectories like "src/index.js")
   * @returns {FileObject} A new FileObject instance with the combined path
   * @throws {Sass} If filename is not a string
   * @example
   * const dir = new DirectoryObject("/projects/git/toolkit")
   * const file = dir.getFile("package.json")
   * console.log(file.path) // "/projects/git/toolkit/package.json"
   *
   * @example
   * // Can include nested paths
   * const file = dir.getFile("src/index.js")
   * const data = await file.read()
   */
  getFile(filename) {
    Valid.type(filename, "String")

    const thisPath = this.path
    const merged = FS.mergeOverlappingPaths(thisPath, filename)

    return new FileObject(merged)
  }
}
