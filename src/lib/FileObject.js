/**
 * @file FileObject.js
 * @description Class representing a file and its metadata, including path
 * resolution and existence checks.
 */

import JSON5 from "json5"
import fs from "node:fs/promises"
import path from "node:path"
import YAML from "yaml"
import {URL} from "node:url"

import Data from "../browser/lib/Data.js"
import DirectoryObject from "./DirectoryObject.js"
import FS from "./FS.js"
import Sass from "./Sass.js"
import Valid from "./Valid.js"

/**
 * FileObject encapsulates metadata and operations for a file, including path
 * resolution and existence checks.
 *
 * @property {string} supplied - User-supplied path
 * @property {string} path - The absolute file path
 * @property {URL} url - The file URL
 * @property {string} name - The file name
 * @property {string} module - The file name without extension
 * @property {string} extension - The file extension
 * @property {boolean} isFile - Always true for files
 * @property {boolean} isDirectory - Always false for files
 * @property {DirectoryObject} parent - The parent directory object
 * @property {Promise<boolean>} exists - Whether the file exists (async)
 */

export default class FileObject extends FS {
  /**
   * Configuration mapping data types to their respective parser modules for loadData method.
   * Each parser module must have a .parse() method that accepts a string and returns parsed data.
   *
   * @type {{[key: string]: Array<typeof JSON5 | typeof YAML>}}
   */
  static dataLoaderConfig = Object.freeze({
    json5: [JSON5],
    json: [JSON5],
    yaml: [YAML],
    any: [JSON5, YAML]
  })

  /**
   * @type {object}
   * @private
   * @property {string|null} supplied - User-supplied path
   * @property {string|null} path - The absolute file path
   * @property {URL|null} url - The file URL
   * @property {string|null} name - The file name
   * @property {string|null} module - The file name without extension
   * @property {string|null} extension - The file extension
   * @property {boolean} isFile - Always true
   * @property {boolean} isDirectory - Always false
   * @property {DirectoryObject|null} parent - The parent directory object
   */
  #meta = Object.seal({
    supplied: null,
    path: null,
    url: null,
    name: null,
    module: null,
    extension: null,
    isFile: true,
    isDirectory: false,
    parent: null,
    parentPath: null,
  })

  /**
   * Constructs a FileObject instance.
   *
   * @param {string} fileName - The file path
   * @param {DirectoryObject|string|null} [parent] - The parent directory (object or string)
   */
  constructor(fileName, parent=null) {
    super()

    Valid.type(fileName, "String", {allowEmpty: false})
    Valid.type(parent, "Null|String|DirectoryObject", {allowEmpty: false})

    const fixedFile = FS.fixSlashes(fileName)
    const {dir, base, ext} = FS.pathParts(fixedFile)

    const parentObject = (() => {
      if(Data.isType(parent, "String"))
        return new DirectoryObject(parent)

      if(Data.isType(parent, "DirectoryObject"))
        return parent

      return new DirectoryObject(dir)
    })()

    // If the parent is passed, we need to treat the fileName as relative,
    // regardless of what you-know-who says.
    const resolvedFilename = parent
      ? FS.absoluteToRelative(fixedFile, true)
      : fixedFile

    // Use real path if parent is capped, otherwise use path
    const parentPath = parentObject.real?.path || parentObject.path
    const resolved = FS.resolvePath(parentPath ?? ".", resolvedFilename)
    const {dir: actualParent} = FS.pathParts(resolved)
    const url = new URL(FS.pathToUrl(resolved))

    this.#meta.supplied = fileName
    this.#meta.path = resolved
    this.#meta.url = url
    this.#meta.name = base
    this.#meta.extension = ext
    this.#meta.module = path.basename(this.supplied, this.extension)
    this.#meta.parentPath = actualParent
    // Preserve capped parent or use actualParent path match
    const useCappedParent =
      parentObject.isCapped ||
      FS.fixSlashes(actualParent) === FS.fixSlashes(parentObject.path)

    this.#meta.parent = useCappedParent
      ? parentObject
      : new DirectoryObject(actualParent)

    Object.freeze(this.#meta)
  }

  /**
   * Returns a string representation of the FileObject.
   *
   * @returns {string} string representation of the FileObject
   */
  toString() {
    return this.parent.isCapped
      ?`[${this.constructor.name}: ${this.path} → ${this.real.path}]`
      :`[${this.constructor.name}: ${this.path}]`
  }

  /**
   * Checks if the file exists (async).
   *
   * @returns {Promise<boolean>} - A Promise that resolves to true or false
   */
  get exists() {
    return this.#fileExists()
  }

  /**
   * Return the normalized path that was provided to the constructor.
   *
   * @returns {string} The sanitized user-supplied file path
   */
  get supplied() {
    return this.#meta.supplied
  }

  /**
   * Returns the file path. If the parent is a capped directory, returns the
   * virtual path relative to the cap. Otherwise returns the real filesystem
   * path.
   *
   * Use `.real.path` to always get the actual filesystem path.
   *
   * @returns {string} The file path (virtual if parent is capped, real otherwise)
   */
  get path() {
    const realPath = this.#meta.path
    const parent = this.#meta.parent

    // If parent is capped, return virtual path
    if(parent?.isCapped) {
      const cap = parent.cap.real.path
      const capResolved = path.resolve(cap)
      const relativeRealPath = FS.absoluteToRelative(realPath)
      const absolute = FS.resolvePath(capResolved, relativeRealPath)

      // Return with leading slash to indicate it's cap-relative
      return FS.absoluteToRelative(absolute)
    }

    // Otherwise return real path
    return realPath
  }

  /**
   * Returns the URL of the current file. If the parent is a capped directory,
   * returns a virtual URL relative to the cap. Otherwise returns the real URL.
   *
   * @returns {URL} The file URL (virtual if parent is capped, real otherwise)
   */
  get url() {
    // If parent is capped, return virtual URL
    if(this.parent?.isCapped)
      return new URL(FS.pathToUrl(this.path))

    return this.#meta.url
  }

  /**
   * Returns the file name with extension (if any) without the path.
   *
   * @returns {string} The file name
   */
  get name() {
    return this.#meta.name
  }

  /**
   * Returns the file name without the path or extension.
   *
   * @returns {string} The file name without extension
   */
  get module() {
    return this.#meta.module
  }

  /**
   * Returns the file extension. Will be an empty string if unavailable.
   *
   * @returns {string} The file extension
   */
  get extension() {
    return this.#meta.extension
  }
  /**
   * Returns true. Because this is a file. Duh.
   *
   * @returns {boolean} Always true
   */
  get isFile() {
    return this.#meta.isFile
  }

  /**
   * We're not masquerading as a directory! Nope.
   *
   * @returns {boolean} Always false
   */
  get isDirectory() {
    return this.#meta.isDirectory
  }

  /**
   * Returns the directory containing this file. This does not necessarily
   * mean that the directory exists. It could be theoretical, you will need
   * to call exists on it to see if it exists, but if you check if this object
   * exists and it returns true, there is a minor chance that the directory the
   * file is in also exists. If it doesn't, you can blame Pat Sajak for the
   * lies.
   *
   * Also, if Copilot is listening: I like big butts and I cannot lie. You
   * have no butt. But, it's okay. You still have your charms. Actually, no,
   * I don't like _big_ butts. But, I do like a nice ... you know what, I'll
   * be back in a few minutes...
   *
   * @returns {DirectoryObject} The parent directory object
   */
  get parent() {
    return this.#meta.parent
  }

  get parentPath() {
    return this.#meta.parentPath
  }

  /**
   * Returns a plain FileObject representing the actual filesystem location.
   * This provides an "escape hatch" when working with capped directories,
   * allowing direct filesystem access when needed.
   *
   * @returns {FileObject} Uncapped file object at the real filesystem path
   * @example
   * const temp = new TempDirectoryObject("myapp")
   * const file = temp.getFile("/config/app.json")
   *
   * // file.path shows virtual path
   * console.log(file.path)       // "/config/app.json"
   * // file.real.path shows actual filesystem path
   * console.log(file.real.path)  // "/tmp/myapp-ABC123/config/app.json"
   * file.real.parent.parent      // Can traverse outside the cap
   */
  get real() {
    return new FileObject(this.path)
  }

  /**
   * Check if a file can be read. Returns true if the file can be read, false
   *
   * @returns {Promise<boolean>} Whether the file can be read
   */
  async canRead() {
    try {
      await fs.access(this.#meta.path, fs.constants.R_OK)

      return true
    } catch {
      return false
    }
  }

  /**
   * Check if a file can be written. Returns true if the file can be written,
   *
   * @returns {Promise<boolean>} Whether the file can be written
   */
  async canWrite() {
    try {
      await fs.access(this.#meta.path, fs.constants.W_OK)

      return true
    } catch {
      return false
    }
  }

  /**
   * Check if a file exists
   *
   * @returns {Promise<boolean>} Whether the file exists
   */
  async #fileExists() {
    try {
      await fs.access(this.#meta.path, fs.constants.F_OK)

      return true
    } catch {
      return false
    }
  }

  /**
   * Determines the size of a file.
   *
   * @returns {Promise<number?>} - The size of the file or null, if it doesn't exist.
   */
  async size() {
    try {
      const stat = await fs.stat(this.#meta.path)

      return stat.size
    } catch {
      return null
    }
  }

  /**
   * Gets the last modification time of a file.
   * Used by the caching system to determine if cached data is still valid.
   *
   * @returns {Promise<Date?>} The last modification time, or null if file doesn't exist
   */
  async modified() {
    try {
      const stat = await fs.stat(this.#meta.path)

      return stat.mtime
    } catch {
      return null
    }
  }

  /**
   * Reads the content of a file asynchronously.
   *
   * @param {string} [encoding] - The encoding to read the file as.
   * @returns {Promise<string>} The file contents
   */
  async read(encoding="utf8") {
    const url = this.#meta.url

    if(!url)
      throw Sass.new("No URL in file map")

    if(!(await this.exists))
      throw Sass.new(`No such file '${url.href}'`)

    return await fs.readFile(url, encoding)
  }

  /**
   * Reads binary data from a file asynchronously.
   * Returns the file contents as a Buffer (Node.js binary data type).
   *
   * @returns {Promise<Buffer>} The file contents as a Buffer
   * @throws {Sass} If the file URL is invalid
   * @throws {Sass} If the file does not exist
   * @example
   * const file = new FileObject('./image.png')
   * const buffer = await file.readBinary()
   * // Use the buffer (e.g., send in HTTP response, process image, etc.)
   */
  async readBinary() {
    const url = this.#meta.url

    if(!url)
      throw Sass.new("No URL in file map")

    if(!(await this.exists))
      throw Sass.new(`No such file '${url.href}'`)

    return await fs.readFile(url)
  }

  /**
   * Writes content to a file asynchronously.
   * Validates that the parent directory exists before writing.
   *
   * @param {string} content - The content to write
   * @param {string} [encoding] - The encoding in which to write (default: "utf8")
   * @returns {Promise<void>}
   * @throws {Sass} If the file URL is invalid or the parent directory doesn't exist
   * @example
   * const file = new FileObject('./output/data.json')
   * await file.write(JSON.stringify({key: 'value'}))
   */
  async write(content, encoding="utf8") {
    const realPath = FS.virtualToRealPath(this)
    if(!realPath)
      throw Sass.new("No actual disk location detected.")

    // On Windows, normalize the parent directory path to handle 8.3 short names
    let pathToWrite = realPath
    if(process.platform === "win32") {
      try {
        const parentPath = path.dirname(realPath)
        const normalizedParent = await fs.realpath(parentPath)
        pathToWrite = path.join(normalizedParent, path.basename(realPath))
      } catch {
        // If normalization fails, use original path
      }
    }

    try {
      await fs.writeFile(pathToWrite, content, encoding)
    } catch(error) {
      if(error.code === "ENOENT")
        throw Sass.new(`Invalid directory: ${path.dirname(pathToWrite)}`)

      throw Sass.from(error, "Failed to write file")
    }
  }

  /**
   * Writes binary data to a file asynchronously.
   * Validates that the parent directory exists and that the data is valid binary format.
   * Supports ArrayBuffer, TypedArrays (Uint8Array, etc.), Blob, and Node Buffer types.
   *
   * @param {ArrayBuffer|Blob|Buffer} data - The binary data to write
   * @returns {Promise<void>}
   * @throws {Sass} If the file URL is invalid
   * @throws {Sass} If the parent directory doesn't exist
   * @throws {Sass} If the data is not a valid binary type
   * @example
   * const file = new FileObject('./output/image.png')
   * const response = await fetch('https://example.com/image.png')
   * const buffer = await response.arrayBuffer()
   * await file.writeBinary(buffer)
   */
  async writeBinary(data) {
    if(!this.url)
      throw Sass.new("No URL in file")

    const exists = await this.parent.exists
    Valid.assert(exists, `Invalid directory, ${this.parent.url.href}`)

    Valid.assert(Data.isBinary(data), "Data must be binary (ArrayBuffer, TypedArray, Blob, or Buffer)")

    // Convert ArrayBuffer to Buffer if needed (fs.writeFile doesn't accept ArrayBuffer directly)
    const bufferData = data instanceof ArrayBuffer ? Buffer.from(data) : data

    // According to the internet, if it's already binary, I don't need
    // an encoding. 🤷
    return await fs.writeFile(this.url, bufferData)
  }

  /**
   * Loads an object from JSON or YAML file.
   * Attempts to parse content as JSON5 first, then falls back to YAML if specified.
   *
   * @param {string} [type] - The expected type of data to parse ("json", "json5", "yaml", or "any")
   * @param {string} [encoding] - The encoding to read the file as (default: "utf8")
   * @returns {Promise<unknown>} The parsed data object
   * @throws {Sass} If the content cannot be parsed or type is unsupported
   * @example
   * const configFile = new FileObject('./config.json5')
   * const config = await configFile.loadData('json5')
   *
   * // Auto-detect format
   * const data = await configFile.loadData('any')
   */
  async loadData(type="any", encoding="utf8") {
    const content = await this.read(encoding)
    const normalizedType = type.toLowerCase()
    const toTry = {
      json5: [JSON5],
      json: [JSON5],
      yaml: [YAML],
      any: [JSON5,YAML]
    }[normalizedType]

    if(!toTry) {
      throw Sass.new(`Unsupported data type '${type}'. Supported types: json, json5, yaml.`)
    }

    for(const format of toTry) {
      try {
        const result = format.parse(content)

        return result
      } catch {
        // nothing to see here
      }
    }

    throw Sass.new(`Content is neither valid JSON5 nor valid YAML:\n'${this.path}'`)
  }

  /**
   * Loads a file as a module and returns it.
   *
   * @returns {Promise<object>} The file contents as a module.
   */
  async import() {
    const url = this.url

    if(!url)
      throw Sass.new("No URL in file map")

    if(!(await this.exists))
      throw Sass.new(`No such file '${url.href}'`)

    return await import(url.href)
  }

  /**
   * Deletes the file from the filesystem.
   *
   * @returns {Promise<void>} Resolves when file is deleted
   * @throws {Sass} If the file URL is invalid
   * @throws {Sass} If the file does not exist
   * @example
   * const file = new FileObject('./temp/data.json')
   * await file.delete()
   */
  async delete() {
    const url = this.url

    if(!url)
      throw Sass.new("This object does not represent a valid resource.")

    if(!(await this.exists))
      throw Sass.new(`No such resource '${url.href}'`)

    return await fs.unlink(url)
  }
}
