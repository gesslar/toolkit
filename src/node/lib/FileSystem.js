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
import Glog from "./Glog.js"
import Valid from "./Valid.js"
import Watcher from "./Watcher.js"

/**
 * @import Sass from "./Sass.js"
 */

const fdTypes = Object.freeze(["file", "directory"])
const upperFdTypes = Object.freeze(fdTypes.map(type => type.toUpperCase()))
const fdType = Object.freeze(
  await Collection.allocateObject(upperFdTypes, fdTypes)
)

// Characters that are illegal in filenames on common operating systems.
// Windows is the strictest, forbidding < > : " / \ | ? * along with the
// control characters (0x00-0x1F); POSIX is a subset of these. Matching the
// strictest set keeps sanitized names portable everywhere.
const illegalFilenameChars = /[<>:"/\\|?*\u0000-\u001F]/
const illegalFilenameCharsGlobal = /[<>:"/\\|?*\u0000-\u001F]/g

// Windows trims trailing dots and spaces, silently changing the name, so a
// portable filename must not end with either. This also rejects the relative
// path indicators "." and "..", since both end with a dot. A name ends with a
// run of these characters exactly when its final character is one, so a
// single-character class (no `+`) detects the condition without the
// super-linear backtracking that an anchored `/[. ]+$/` exhibits on
// adversarial input. Stripping the whole run is handled by
// stripTrailingDotsSpaces, a linear scan, for the same reason.
const trailingDotOrSpace = /[. ]$/

// Device names reserved by Windows, illegal as a filename with or without an
// extension (e.g. "CON", "con.txt", "LPT1"). The match is case-insensitive.
const reservedFilenames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i

// Maximum length, in bytes, of a single path component. ext4, APFS, NTFS and
// exFAT all cap a name at 255 bytes — note bytes, not characters, so a single
// multi-byte UTF-8 codepoint counts for more than one against the budget.
const maxFilenameBytes = 255

/**
 * Truncate a string to at most `maxBytes` UTF-8 bytes without splitting a
 * multi-byte codepoint. When the byte limit lands in the middle of a
 * character, that whole character is dropped rather than left half-encoded.
 *
 * @private
 * @param {string} str - The string to truncate
 * @param {number} maxBytes - The maximum length in UTF-8 bytes
 * @returns {string} The truncated string, never exceeding `maxBytes` bytes
 */
function truncateToBytes(str, maxBytes) {
  const buf = Buffer.from(str, "utf8")

  if(buf.length <= maxBytes)
    return str

  // Back up over UTF-8 continuation bytes (0b10xxxxxx) so the cut never lands
  // inside a multi-byte sequence, dropping the straddling character entirely.
  let end = maxBytes

  while(end > 0 && (buf[end] & 0xC0) === 0x80)
    end--

  return buf.subarray(0, end).toString("utf8")
}

/**
 * Strip any trailing dots and spaces from a string. Windows trims these
 * silently, so a portable name must not end with them. Implemented as a linear
 * scan rather than an anchored `/[. ]+$/` replace, which can backtrack
 * super-linearly on adversarial input.
 *
 * @private
 * @param {string} str - The string to trim
 * @returns {string} The string with any trailing dots and spaces removed
 */
function stripTrailingDotsSpaces(str) {
  let end = str.length

  while(end > 0 && (str[end - 1] === "." || str[end - 1] === " "))
    end--

  return str.slice(0, end)
}

/**
 * File system utility class for path operations and file discovery.
 */
export default class FileSystem {
  static fdTypes = fdTypes
  static upperFdTypes = upperFdTypes
  static fdType = fdType

  #watcher = null

  /**
   * Compute the relative path from another file or directory to this instance.
   *
   * If the target is outside the source (i.e., the relative path starts with ".."),
   * returns the absolute path to this instance instead.
   *
   * @param {import("./FileObject.js").default|import("./DirectoryObject.js").default} fileOrDirectoryObject - The source file or directory object
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
   * Watch this file or directory for changes.
   *
   * @param {object} [options] - Watch options
   * @param {Function} [options.onChange] - Callback invoked on change
   * @param {number} [options.debounceMs] - Debounce interval in milliseconds
   * @param {boolean} [options.persistent] - Keep the process alive while watching
   * @returns {Promise<undefined>}
   */
  async watch(options={}) {
    Valid.type(options, "Object")

    const localOptions = Collection.cloneObject(options)

    const {onChange} = localOptions ?? {}
    Valid.type(onChange, "Undefined|Function")

    delete localOptions.onChange

    this.stopWatching()

    this.#watcher = new Watcher()

    await this.#watcher.watch(this, Object.assign({},
      localOptions,
      {
        onChange: onChange ?? (() => {
          Glog(`${this} changed somehow.`)
        })
      }
    ))
  }

  /**
   * Stop watching this file or directory for changes.
   */
  stopWatching() {
    this.#watcher?.stopWatching()
    this.#watcher = null
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
   * @param {import("./FileObject.js").default|import("./DirectoryObject.js").default} from - The source file or directory object
   * @param {import("./FileObject.js").default|import("./DirectoryObject.js").default} to - The target file or directory object
   * @returns {string} The relative path from `from` to `to`, or the absolute path if not reachable
   */
  static relativeOrAbsolute(from, to) {
    const fromBasePath = from.isDirectory
      ? from.path
      : from.parent?.path ?? path.dirname(from.path)

    const relative = path.relative(fromBasePath, to.path)

    return relative.startsWith("..")
      ? path.resolve(to.path)
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
      ? path.resolve(to)
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
      if(isAbsolutePath1 && !path.isAbsolute(result)) {
        const root = path.parse(path1).root || path.sep

        return path.join(root, result)
      }

      return result
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

    const realPath = Data.append(container, path.sep)  // bookend this mofo

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
   * Determine whether a string is safe to use as a filename on every common
   * operating system.
   *
   * A name is sane only when it would be legal everywhere, so the checks span
   * the union of platform rules rather than any single OS:
   *
   * - No characters that are illegal on common filesystems. Windows is the
   *   strictest, forbidding `< > : " / \ | ? *` and the control characters
   *   (0x00-0x1F); POSIX is a subset of these.
   * - No trailing dot or space (Windows silently trims them).
   * - Not a Windows reserved device name, with or without an extension
   *   (`CON`, `PRN`, `AUX`, `NUL`, `COM1`-`COM9`, `LPT1`-`LPT9`).
   * - Not the relative path indicators `.` or `..`.
   * - No longer than 255 bytes — the per-component limit on ext4, APFS, NTFS
   *   and exFAT. Length is counted in UTF-8 bytes, not characters, so a single
   *   multi-byte codepoint costs more than one toward the limit.
   *
   * @static
   * @param {string} str - The candidate filename to test
   * @returns {boolean} True if the string is a legal filename on every common OS
   * @throws {Sass} If str is not a non-empty string
   * @example
   * FS.sane("report.txt")  // true
   * FS.sane("a/b:c.txt")   // false (illegal character)
   * FS.sane("name ")       // false (trailing space)
   * FS.sane("CON")         // false (reserved on Windows)
   * FS.sane("x".repeat(256))  // false (exceeds 255 bytes)
   */
  static sane(str) {
    Valid.type(str, "String", {allowEmpty: false})

    return !illegalFilenameChars.test(str)
      && !trailingDotOrSpace.test(str)
      && !reservedFilenames.test(str)
      && Buffer.byteLength(str) <= maxFilenameBytes
  }

  /**
   * Rewrite a string into a filename that is legal on every common operating
   * system.
   *
   * Applies the union of platform rules (see {@link FileSystem.sane}) so the
   * result is portable regardless of where it is used:
   *
   * - Every character illegal on common filesystems is replaced with
   *   `replacement` (defaults to an underscore).
   * - Trailing dots and spaces are stripped (Windows trims them anyway).
   * - Windows reserved device names are suffixed with `replacement` so they
   *   are no longer reserved (e.g. `CON` becomes `CON_`, `CON.txt` becomes
   *   `CON_.txt`).
   * - Names longer than 255 bytes are truncated to fit that limit. The base
   *   name is shortened while the extension is preserved where it fits, and
   *   truncation never splits a multi-byte UTF-8 codepoint.
   *
   * A custom `replacement` is itself validated: it must contain no illegal
   * characters, otherwise the result could remain unsafe.
   *
   * Note that degenerate inputs can sanitize to an empty string — for example
   * an empty `replacement` applied to a name of only illegal characters, or a
   * relative indicator such as `"."` or `".."` whose trailing dots are
   * stripped. The empty string is not itself a legal filename, so callers that
   * need a guaranteed-usable name should treat an empty result as a signal to
   * fall back to a default of their own.
   *
   * @static
   * @param {string} str - The filename to sanitize
   * @param {string} [replacement] - The substitute for illegal characters (defaults to "_")
   * @returns {string} A filename legal on every common OS, or "" when the input sanitizes to nothing
   * @throws {Sass} If str is not a non-empty string
   * @throws {Sass} If replacement is not a string, or itself contains OS-illegal characters
   * @example
   * FS.sanitize("a/b:c.txt")        // "a_b_c.txt"
   * FS.sanitize("a/b:c.txt", "-")   // "a-b-c.txt"
   * FS.sanitize("name. ")           // "name"
   * FS.sanitize("CON.txt")          // "CON_.txt"
   * FS.sanitize("..")               // "" (caller should supply a fallback)
   */
  static sanitize(str, replacement="_") {
    Valid.type(str, "String", {allowEmpty: false})
    Valid.type(replacement, "String")

    Valid.assert(
      !illegalFilenameChars.test(replacement),
      `replacement must not contain OS-illegal characters, got: ${replacement}`
    )

    // Swap illegal characters, then drop trailing dots/spaces that Windows
    // would silently strip.
    const cleaned = stripTrailingDotsSpaces(
      str.replace(illegalFilenameCharsGlobal, replacement)
    )

    // Defuse Windows reserved device names by suffixing the reserved portion,
    // preserving any extension (e.g. "CON" -> "CON_"). A replacement that
    // cannot actually change the name -- an empty string, or dots/spaces that
    // get stripped straight back off -- leaves it reserved; like any other
    // input that cannot be made safe, fall back to the empty string.
    let defused = cleaned

    if(reservedFilenames.test(cleaned)) {
      defused = stripTrailingDotsSpaces(
        cleaned.replace(/^([^.]*)/, `$1${replacement}`)
      )

      if(reservedFilenames.test(defused))
        return ""
    }

    // Enforce the 255-byte component limit. Truncate the base name while
    // keeping the extension where it fits; a cut can re-expose a trailing dot
    // or space, so strip those again before reattaching the extension.
    if(Buffer.byteLength(defused) <= maxFilenameBytes)
      return defused

    const dot = defused.lastIndexOf(".")
    const ext = dot > 0 ? defused.slice(dot) : ""
    const extBytes = Buffer.byteLength(ext)

    // An extension that alone blows the budget cannot be preserved; truncate
    // the whole name instead. The cut can land on a dot or space, so strip any
    // the same way the base-truncation path below does.
    if(extBytes >= maxFilenameBytes)
      return stripTrailingDotsSpaces(truncateToBytes(defused, maxFilenameBytes))

    const base = dot > 0 ? defused.slice(0, dot) : defused
    const truncatedBase = stripTrailingDotsSpaces(
      truncateToBytes(base, maxFilenameBytes - extBytes)
    )

    return truncatedBase + ext
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
