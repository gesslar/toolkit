/**
 * @file FileObject.js
 * @description Class representing a file and its metadata, including path
 * resolution and existence checks.
 */

import JSON5 from "json5"
import fs from "node:fs/promises"
import path from "node:path"
import util from "node:util"
import YAML from "yaml"
import {URL} from "node:url"

import Data from "./Data.js"
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
 * @property {DirectoryObject} directory - The parent directory object
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
   * @property {DirectoryObject|null} directory - The parent directory object
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
    directory: null,
  })

  /**
   * Constructs a FileObject instance.
   *
   * @param {string} fileName - The file path
   * @param {DirectoryObject|string|null} [directory] - The parent directory (object or string)
   */
  constructor(fileName, directory=null) {
    super()

    if(!fileName || typeof fileName !== "string" || fileName.length === 0) {
      throw Sass.new("fileName must be a non-empty string")
    }

    const fixedFile = FS.fixSlashes(fileName)

    const {dir,base,ext} = this.#deconstructFilenameToParts(fixedFile)

    const directoryObject = (() => {
      switch(Data.typeOf(directory)) {
        case "String":
          return new DirectoryObject(directory)
        case "DirectoryObject":
          return directory
        default:
          return new DirectoryObject(dir)
      }
    })()

    const final = FS.resolvePath(directoryObject.path ?? ".", fixedFile)

    const resolved = final
    const url = new URL(FS.pathToUri(resolved))

    this.#meta.supplied = fixedFile
    this.#meta.path = resolved
    this.#meta.url = url
    this.#meta.name = base
    this.#meta.extension = ext
    this.#meta.module = path.basename(this.supplied, this.extension)
    this.#meta.directory = directoryObject

    Object.freeze(this.#meta)
  }

  /**
   * Returns a string representation of the FileObject.
   *
   * @returns {string} string representation of the FileObject
   */
  toString() {
    return `[FileObject: ${this.path}]`
  }

  /**
   * Returns a JSON representation of the FileObject.
   *
   * @returns {object} JSON representation of the FileObject
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
      directory: this.directory ? this.directory.path : null
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
   * Return the fully resolved absolute path to the file on disk.
   *
   * @returns {string} The fully resolved absolute file path
   */
  get path() {
    return this.#meta.path
  }

  /**
   * Returns the URL of the current file.
   *
   * @returns {URL} The file URL
   */
  get url() {
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
  get directory() {
    return this.#meta.directory
  }

  /**
   * Check if a file can be read. Returns true if the file can be read, false
   *
   * @returns {Promise<boolean>} Whether the file can be read
   */
  async canRead() {
    try {
      await fs.access(this.path, fs.constants.R_OK)

      return true
    } catch(_) {
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
      await fs.access(this.path, fs.constants.W_OK)

      return true
    } catch(_) {
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
      await fs.access(this.path, fs.constants.F_OK)

      return true
    } catch(_) {
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
      const stat = await fs.stat(this.path)

      return stat.size
    } catch(_) {
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
      const stat = await fs.stat(this.path)

      return stat.mtime
    } catch(_) {
      return null
    }
  }

  /**
   * @typedef {object} FileParts
   * @property {string} base - The file name with extension
   * @property {string} dir - The directory path
   * @property {string} ext - The file extension (including dot)
   */

  /**
   * Deconstruct a filename into parts
   *
   * @param {string} fileName - The filename to deconstruct
   * @returns {FileParts} The filename parts
   */
  #deconstructFilenameToParts(fileName) {
    Valid.assert(typeof fileName === "string" && fileName.length > 0,
      "file must be a non-zero length string", 1)

    return path.parse(fileName)
  }

  /**
   * Reads the content of a file asynchronously.
   *
   * @param {string} [encoding] - The encoding to read the file as.
   * @returns {Promise<string>} The file contents
   */
  async read(encoding="utf8") {
    const url = this.url

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
    const url = this.url

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
    if(!this.url)
      throw Sass.new("No URL in file")

    if(await this.directory.exists)
      await fs.writeFile(this.url, content, encoding)

    else
      throw Sass.new(`Invalid directory, ${this.directory.url.href}`)
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

    const exists = await this.directory.exists
    Valid.assert(exists, `Invalid directory, ${this.directory.url.href}`)

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
