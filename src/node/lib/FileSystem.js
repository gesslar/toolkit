/**
 * @file FS.js
 *
 * File system utilities for path manipulation, file discovery, and path
 * resolution.
 *
 * Provides glob-based file search, URI conversion, and intelligent path
 * merging.
 */

import path from "node:path"
import url from "node:url"

import Collection from "../../browser/lib/Collection.js"
import Data from "../../browser/lib/Data.js"
import Valid from "./Valid.js"
import Sass from "./Sass.js"

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
export default class FileSystem {
  static fdTypes = fdTypes
  static upperFdTypes = upperFdTypes
  static fdType = fdType

  /**
   * Compute the relative path from another file or directory to this instance.
   *
   * If the target is outside the source (i.e., the relative path starts with ".."),
   * returns the absolute path to this instance instead.
   *
   * @param {FileObject|DirectoryObject} fileOrDirectoryObject - The source file or directory object
   * @returns {string} The relative path from the source to this instance, or the absolute path if not reachable
   * @throws {Sass} If the parameter is not a FileObject or DirectoryObject
   */
  relativeTo(fileOrDirectoryObject) {
    Valid.assert(
      typeof fileOrDirectoryObject?.path === "string",
      "fileOrDirectoryObject must be a FileObject or DirectoryObject with a path property",
      1
    )

    return FileSystem.relativeOrAbsolute(fileOrDirectoryObject, this)
  }

  /**
   * Fix slashes in a path
   *
   * @static
   * @param {string} pathName - The path to fix
   * @returns {string} The fixed path
   */
  static fixSlashes(pathName) {
    return path.normalize(pathName.replace(/\\/g, "/"))
  }

  /**
   * Convert a path to a URI
   *
   * @static
   * @param {string} pathName - The path to convert
   * @returns {string} The URI
   */
  static pathToUrl(pathName) {
    try {
      return url.pathToFileURL(pathName).href
    } catch {
      return pathName
    }
  }

  /**
   * Convert a file URL to a path.
   *
   * @static
   * @param {string} fileUrl - The file URL to convert (e.g., import.meta.url)
   * @returns {string} The file path
   * @example
   * const currentFile = FileSystem.urlToPath(import.meta.url)
   */
  static urlToPath(fileUrl) {
    try {
      return url.fileURLToPath(fileUrl)
    } catch {
      return fileUrl
    }
  }

  /**
   * Computes the relative path from one file or directory to another.
   *
   * If the target is outside the source (i.e., the relative path starts with
   * ".."), returns the absolute path to the target instead.
   *
   * @static
   * @param {FileObject|DirectoryObject} from - The source file or directory object
   * @param {FileObject|DirectoryObject} to - The target file or directory object
   * @returns {string} The relative path from `from` to `to`, or the absolute path if not reachable
   */
  static relativeOrAbsolute(from, to) {
    const fromBasePath = from.isDirectory
      ? from.path
      : from.parent?.path ?? path.dirname(from.path)

    const relative = path.relative(fromBasePath, to.path)

    return relative.startsWith("..")
      ? to.path
      : relative
  }

  /**
   * Computes the relative path from one file or directory to another.
   *
   * If the target is outside the source (i.e., the relative path starts with
   * ".."), returns the absolute path to the target instead.
   *
   * @static
   * @param {string} from - The source file or directory object
   * @param {string} to - The target file or directory object
   * @returns {string} The relative path from `from` to `to`, or the absolute path if not reachable
   */
  static relativeOrAbsolutePath(from, to) {
    const relative = path.relative(from, to)

    return relative.startsWith("..")
      ? to
      : relative
  }

  /**
   * Merge two paths by finding overlapping segments and combining them
   * efficiently
   *
   * @static
   * @param {string} path1 - The first path
   * @param {string} path2 - The second path to merge with the first
   * @param {string} [sep] - The path separator to use (defaults to system separator)
   * @returns {string} The merged path
   */
  static mergeOverlappingPaths(path1, path2, sep=path.sep) {
    const isAbsolutePath1 = path.isAbsolute(path1)
    const from = path.normalize(path1).split(sep).filter(Boolean)
    const to = path.normalize(path2).split(sep).filter(Boolean)

    // If they're the same, just return path1
    if(to.length === from.length && from.every((f, i) => to[i] === f))
      return path1

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
    Valid.type(fromPath, "String")
    Valid.type(toPath, "String")

    // Normalize inputs
    const from = this.fixSlashes(fromPath?.trim() ?? "")
    const to = this.fixSlashes(toPath?.trim() ?? "")

    // Are they the same? What's the resolve?
    if(from === to)
      return from

    // Handle empty cases
    if(!from && !to)
      return ""

    if(!from)
      return to

    if(!to)
      return from

    // Strategy 1: If 'to' is absolute, it's standalone
    if(path.isAbsolute(to))
      return path.resolve(to)

    // Strategy 2: If 'to' contains relative navigation (../ or ..)
    if(to.startsWith(this.fixSlashes("../")) || to === "..")
      return path.resolve(from, to)

    // Strategy 3: Try overlap-based merging, which will default to a basic
    // join if no overlap
    return FileSystem.mergeOverlappingPaths(from, to)
  }

  /**
   * Check if a candidate path is contained within a container path.
   *
   * @static
   * @param {string} container - The container path to check against
   * @param {string} candidate - The candidate path that might be contained
   * @returns {boolean} True if candidate is within container, false otherwise
   * @throws {Sass} If container is not a non-empty string
   * @throws {Sass} If candidate is not a non-empty string
   * @example
   * FS.pathContains("/home/user", "/home/user/docs") // true
   * FS.pathContains("/home/user", "/home/other") // false
   */
  static pathContains(container, candidate) {
    Valid.type(container, "String", {allowEmpty: false})
    Valid.type(candidate, "String", {allowEmpty: false})

    const realPath = Data.append(container, "/")  // bookend this mofo

    return candidate.startsWith(realPath)
  }

  /**
   * Convert an absolute path to a relative path by finding overlapping segments.
   * Returns the relative portion of the 'to' path after the last occurrence
   * of the final segment from the 'from' path.
   *
   * @static
   * @param {string} from - The base path to calculate relative from
   * @param {string} to - The target path to make relative
   * @param {string} [sep=path.sep] - The path separator to use (defaults to system separator)
   * @returns {string|null} The relative path, empty string if paths are identical, or null if no overlap found
   * @example
   * FS.toLocalRelativePath("/projects/toolkit", "/projects/toolkit/src") // "src"
   * FS.toLocalRelativePath("/home/user", "/home/user") // ""
   * FS.toLocalRelativePath("/projects/app", "/other/path") // null
   */
  static toLocalRelativePath(from, to, sep=path.sep) {
    // If they're the same, just return ""
    if(from === to)
      return ""

    const fromTrail = from.split(sep)
    const toTrail = to.split(sep)
    const overlapIndex = toTrail.findIndex(curr => curr === fromTrail.at(-1))

    // If overlap is found, slice and join
    if(overlapIndex !== -1) {
      const relative = toTrail.slice(overlapIndex+1)

      return relative.join(sep)
    }

    // If no overlap, we got nothing, soz.
    return null
  }

  /**
   * Computes the relative path from one path to another using Node's path.relative.
   *
   * Unlike toLocalRelativePath which uses overlap detection, this method uses
   * standard relative path calculation and may return paths with ".." segments.
   *
   * @static
   * @param {string} from - The base path to calculate relative from
   * @param {string} to - The target path to make relative
   * @returns {string} The relative path, or empty string if paths are identical
   * @example
   * FS.toRelativePath("/home/user", "/home/user/docs") // "docs"
   * FS.toRelativePath("/home/user", "/home/user") // ""
   * FS.toRelativePath("/home/user", "/home/other") // "../other"
   */
  static toRelativePath(from, to) {
    // If they're the same, just return ""
    if(from === to)
      return ""

    return path.relative(from, to)
  }

  /**
   * Find where a path's final segment appears in another path, returning the
   * portion of 'from' up to that overlap point.
   *
   * Looks for the last segment of `from` within `to`. If found, returns `from`
   * sliced to the index where that segment appears in `to`.
   *
   * @static
   * @param {string} from - The source path whose final segment to search for
   * @param {string} to - The target path to search within
   * @param {string} [sep=path.sep] - The path separator to use (defaults to system separator)
   * @returns {string|null} The sliced portion of from, the original path if identical, or null if no overlap
   * @throws {Sass} If from is not a non-empty string
   * @throws {Sass} If to is not a non-empty string
   * @example
   * FS.getCommonRootPath("/projects/toolkit", "/projects/toolkit/src") // "/projects/toolkit"
   * FS.getCommonRootPath("/home/user", "/home/user") // "/home/user"
   * FS.getCommonRootPath("/projects/app", "/other/path") // null (no overlap)
   */
  static getCommonRootPath(from, to, sep=path.sep) {
    Valid.type(from, "String", {allowEmpty: false})
    Valid.type(to, "String", {allowEmpty: false})

    // If they're the same, just return one or t'other, tis no mattah
    if(from === to)
      return from

    const fromTrail = from.split(sep)
    const toTrail = to.split(sep)
    const overlapIndex = toTrail.findLastIndex(
      curr => curr === fromTrail.at(-1)
    )

    // If overlap is found, slice and join
    if(overlapIndex !== -1) {
      const relative = fromTrail.slice(0, overlapIndex+1)

      return relative.join(sep)
    }

    // If no overlap, we got nothing, soz.
    return null
  }

  /**
   * @typedef {object} PathParts
   * @property {string} base - The file name with extension
   * @property {string} dir - The directory path
   * @property {string} ext - The file extension (including dot)
   * @property {string} root - The root of the path
   * @property {string} name - The file name without extension
   */

  /**
   * Deconstruct a file or directory name into parts.
   *
   * @static
   * @param {string} pathName - The file/directory name to deconstruct
   * @returns {PathParts} The filename parts
   * @throws {Sass} If not a string of more than 1 character
   */
  static pathParts(pathName) {
    Valid.type(pathName, "String", {allowEmpty: false})

    return path.parse(pathName)
  }

  /**
   * Returns the current working directory as a string.
   *
   * @returns {string} The current working directory
   */
  static get cwd() {
    return process.cwd()
  }
}
