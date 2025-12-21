/**
 * @file FS.js
 *
 * File system utilities for path manipulation, file discovery, and path resolution.
 * Provides glob-based file search, URI conversion, and intelligent path merging.
 */

import {globby} from "globby"
import path from "node:path"
import url from "node:url"
import fs from "node:fs/promises"
import os from "node:os"

import Collection from "../browser/lib/Collection.js"
import Sass from "./Sass.js"
import Valid from "./Valid.js"
import DirectoryObject from "./DirectoryObject.js"

/** @typedef {import("./FileObject.js").default} FileObject */
/** @typedef {import("./DirectoryObject.js").default} DirectoryObject */

const fdTypes = Object.freeze(["file", "directory"])
const upperFdTypes = Object.freeze(fdTypes.map(type => type.toUpperCase()))
const fdType = Object.freeze(
  await Collection.allocateObject(upperFdTypes, fdTypes)
)

/**
 * File system utility class for path operations and file discovery.
 */
export default class FS {
  static fdTypes = fdTypes
  static upperFdTypes = upperFdTypes
  static fdType = fdType

  /**
   * Fix slashes in a path
   *
   * @static
   * @param {string} pathName - The path to fix
   * @returns {string} The fixed path
   */
  static fixSlashes(pathName) {
    return pathName.replace(/\\/g, "/")
  }

  /**
   * Convert a path to a URI
   *
   * @static
   * @param {string} pathName - The path to convert
   * @returns {string} The URI
   */
  static pathToUri(pathName) {
    try {
      return url.pathToFileURL(pathName).href
    } catch(e) {
      void e // stfu linter

      return pathName
    }
  }

  /**
   * Convert a URI to a path
   *
   * @static
   * @param {string} pathName - The URI to convert
   * @returns {string} The path
   */
  static uriToPath(pathName) {
    try {
      return url.fileURLToPath(pathName)
    } catch(_) {
      return pathName
    }
  }

  /**
   * Retrieve all files matching a specific glob pattern.
   *
   * @static
   * @param {string|Array<string>} glob - The glob pattern(s) to search.
   * @returns {Promise<Array<FileObject>>} A promise that resolves to an array of file objects
   * @throws {Sass} If the input is not a string or array of strings.
   * @throws {Sass} If the glob pattern array is empty or for other search failures.
   */
  static async getFiles(glob) {
    const isString = typeof glob === "string"
    const isArray = Array.isArray(glob)
    const isStringArray = isArray && glob.every(item => typeof item === "string")

    Valid.assert(
      (isString && glob.length > 0) ||
      (isStringArray && glob.length > 0),
      "glob must be a non-empty string or array of strings.",
      1
    )

    const globbyArray = (
      isString
        ? glob.split("|").map(g => g.trim()).filter(Boolean)
        : glob
    ).map(g => FS.fixSlashes(g))

    if(isArray && !globbyArray.length)
      throw Sass.new(
        `Invalid glob pattern: Array cannot be empty. Got ${JSON.stringify(glob)}`,
      )

    // Use Globby to fetch matching files
    const {default: FileObject} = await import("./FileObject.js")

    const filesArray = await globby(globbyArray)
    const files = filesArray.map(file => new FileObject(file))

    // Flatten the result and remove duplicates
    return files
  }

  /**
   * Computes the relative path from one file or directory to another.
   *
   * If the target is outside the source (i.e., the relative path starts with ".."),
   * returns the absolute path to the target instead.
   *
   * @static
   * @param {FileObject|DirectoryObject} from - The source file or directory object
   * @param {FileObject|DirectoryObject} to - The target file or directory object
   * @returns {string} The relative path from `from` to `to`, or the absolute path if not reachable
   */
  static relativeOrAbsolutePath(from, to) {
    const fromBasePath = from.isDirectory
      ? from.path
      : from.directory?.path ?? path.dirname(from.path)

    const relative = path.relative(fromBasePath, to.path)

    return relative.startsWith("..")
      ? to.path
      : relative
  }

  /**
   * Merge two paths by finding overlapping segments and combining them efficiently
   *
   * @static
   * @param {string} path1 - The first path
   * @param {string} path2 - The second path to merge with the first
   * @param {string} [sep] - The path separator to use (defaults to system separator)
   * @returns {string} The merged path
   */
  static mergeOverlappingPaths(path1, path2, sep=path.sep) {
    const isAbsolutePath1 = path.isAbsolute(path1)
    const from = path1.split(sep).filter(Boolean)
    const to = path2.split(sep).filter(Boolean)

    // If they're the same, just return path1
    if(to.length === from.length && from.every((f, i) => to[i] === f)) {
      return path1
    }

    const overlapIndex = from.findLastIndex(curr => curr === to.at(0))

    // If overlap is found, slice and join
    if(overlapIndex !== -1) {
      const prefix = from.slice(0, overlapIndex)
      const result = path.join(...prefix, ...to)

      // If original path1 was absolute, ensure result is also absolute
      return isAbsolutePath1 && !path.isAbsolute(result)
        ? path.sep + result
        : result
    }

    // If no overlap, just join the paths
    return path.join(path1, path2)
  }

  /**
   * Resolve a path relative to another path using various strategies
   * Handles absolute paths, relative navigation, and overlap-based merging
   *
   * @static
   * @param {string} fromPath - The base path to resolve from
   * @param {string} toPath - The target path to resolve
   * @returns {string} The resolved path
   */
  static resolvePath(fromPath, toPath) {
    // Normalize inputs
    const from = fromPath?.trim() ?? ""
    const to = toPath?.trim() ?? ""

    // Handle empty cases
    if(!from && !to)
      return ""

    if(!from)
      return to

    if(!to)
      return from

    const normalizedTo = /^\.\//.test(to)
      ? path.normalize(to)
      : to

    // Strategy 1: If 'to' is absolute, it's standalone
    if(path.isAbsolute(normalizedTo))
      return normalizedTo

    // Strategy 2: If 'to' contains relative navigation
    if(to.startsWith("../"))
      return path.resolve(from, normalizedTo)

    // Strategy 3: Try overlap-based merging, which will default to a basic
    // join if no overlap
    return FS.mergeOverlappingPaths(from, normalizedTo)
  }

  /**
   * Creates a new temporary directory and wraps it in a DirectoryObject.
   *
   * When called without a parent, creates a new temporary directory in the OS
   * temp folder with a unique name. When called with a parent DirectoryObject,
   * creates a subdirectory within that parent.
   *
   * The parent directory (if provided) must:
   * - Be marked as temporary
   * - Actually exist on the filesystem
   * - Have lineage tracing back to the OS temp directory
   *
   * These validations ensure that only legitimately temporary directories can
   * be created and later removed with the remove() method.
   *
   * @static
   * @async
   * @param {string} name - The base name for the temporary directory. When creating a root temp directory, a random suffix will be appended for uniqueness.
   * @param {DirectoryObject|null} [parent] - Optional parent DirectoryObject to create this directory within. Must be a temporary directory itself.
   * @returns {Promise<DirectoryObject>} A DirectoryObject representing the created temporary directory, with the temporary flag set to true.
   * @throws {Sass} If name is not a string
   * @throws {Sass} If parent is provided but is not a DirectoryObject
   * @throws {Sass} If parent is not marked as temporary
   * @throws {Sass} If parent does not exist
   * @throws {Sass} If parent's lineage does not trace back to the OS temp directory
   * @example
   * // Create a standalone temporary directory
   * const tempDir = await FS.tempDirectory("my-temp")
   * console.log(tempDir.temporary) // true
   * console.log(tempDir.path) // /tmp/my-temp-abc123 (on Unix)
   *
   * @example
   * // Create nested temporary directories
   * const parent = await FS.tempDirectory("parent")
   * const child = await FS.tempDirectory("child", parent)
   * console.log(child.path.startsWith(parent.path)) // true
   * await parent.remove() // Removes both parent and child
   */
  static async tempDirectory(name, parent=null) {
    Valid.type(name, "String")
    Valid.type(parent, "Null|DirectoryObject")

    const temp = os.tmpdir()

    if(parent) {
      Valid.assert(parent.temporary, "Parent must be a temporary DirectoryObject.")
      Valid.assert(await parent.exists, "Parent must exist.")

      let found = false
      for(const p of parent.walkUp) {
        if(p.path === temp) {
          found = true
          break
        }
      }

      Valid.assert(found, "The lineage of this directory must be the OS temp directory.")

      // Security: Reject absolute paths, path traversal, and path separators
      Valid.assert(
        !path.isAbsolute(name),
        "Temporary directory name must not be an absolute path."
      )
      Valid.assert(
        !name.includes("/") && !name.includes("\\") && !name.includes(path.sep),
        "Temporary directory name must not contain path separators."
      )
      Valid.assert(
        name.length > 0,
        "Temporary directory name must not be empty."
      )

      const dir = new DirectoryObject(path.join(parent.path, name), true)
      await dir.assureExists()

      return dir
    }

    const prefix = name.endsWith("-") ? name : `${name}-`
    const dir = await fs.mkdtemp(path.join(temp, prefix))

    return new DirectoryObject(dir, true)
  }
}
