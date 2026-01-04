/**
 * @file FS.js
 *
 * File system utilities for path manipulation, file discovery, and path resolution.
 * Provides glob-based file search, URI conversion, and intelligent path merging.
 */

import {globby} from "globby"
import path from "node:path"
import url from "node:url"

import Collection from "../browser/lib/Collection.js"
import Data from "../browser/lib/Data.js"
import Sass from "./Sass.js"
import Valid from "./Valid.js"

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

    return FS.relativeOrAbsolutePath(fileOrDirectoryObject, this)
  }

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
  static pathToUrl(pathName) {
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
      : from.parent?.path ?? path.dirname(from.path)

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

  static pathContains(container, candidate) {
    Valid.type(container, "String", {allowEmpty: false})
    Valid.type(candidate, "String", {allowEmpty: false})

    const realPath = Data.append(container, "/")  // bookend this mofo

    return candidate.startsWith(realPath)
  }

  static toRelativePath(from, to, sep=path.sep) {
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

  static getCommonRootPath(from, to, sep=path.sep) {
    // If they're the same, just return one or t'other, tis no mattah
    if(from === to)
      return from

    const fromTrail = from.split(sep)
    const toTrail = to.split(sep)
    const overlapIndex = fromTrail.findIndex(curr => curr === toTrail.at(0))

    // If overlap is found, slice and join
    if(overlapIndex !== -1) {
      const relative = fromTrail.slice(0, overlapIndex - 1)

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
}
