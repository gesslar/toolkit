/**
 * @file FS.js
 *
 * File system utilities for path manipulation, file discovery, and path resolution.
 * Provides glob-based file search, URI conversion, and intelligent path merging.
 */

import {globby} from "globby"
import path from "node:path"
import url from "node:url"

import Collection from "./Collection.js"
import DirectoryObject from "./DirectoryObject.js"
import FileObject from "./FileObject.js"
import Sass from "./Sass.js"
import Valid from "./Valid.js"

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
   * @param {string} pathName - The path to fix
   * @returns {string} The fixed path
   */
  static fixSlashes(pathName) {
    return pathName.replace(/\\/g, "/")
  }

  /**
   * Convert a path to a URI
   *
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
   * @param {string|Array<string>} glob - The glob pattern(s) to search.
   * @returns {Promise<Array<FileObject>>} A promise that resolves to an array of file objects
   * @throws {Sass} If the input is not a string or array of strings.
   * @throws {Sass} If the glob pattern array is empty or for other search failures.
   */
  static async getFiles(glob) {
    Valid.assert(
      (
        (typeof glob === "string" && glob.length > 0) ||
        (
          Collection.isArrayUniform(glob, "string") &&
          glob.length > 0
        )
      ),
      "glob must be a non-empty string or array of strings.",
      1
    )

    const globbyArray = (
      typeof glob === "string"
        ? glob
          .split("|")
          .map(g => g.trim())
          .filter(Boolean)
        : glob
    ).map(g => FS.fixSlashes(g))

    if(
      Array.isArray(globbyArray) &&
      Collection.isArrayUniform(globbyArray, "string") &&
      !globbyArray.length
    )
      throw Sass.new(
        `Invalid glob pattern: Array cannot be empty. Got ${JSON.stringify(glob)}`,
      )

    // Use Globby to fetch matching files
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
}
