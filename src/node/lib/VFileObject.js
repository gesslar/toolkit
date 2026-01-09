/**
 * @file VFileObject.js
 * @description Class representing a virtual file within a capped directory tree.
 * Extends FileObject with virtual path support and real filesystem mapping.
 */

import DirectoryObject from "./DirectoryObject.js"
import FileObject from "./FileObject.js"
import FS from "./FileSystem.js"
import Valid from "./Valid.js"

/**
 * VFileObject extends FileObject with virtual path support, maintaining both
 * a virtual path (relative to cap) and a real filesystem path.
 *
 * Virtual files must have a VDirectoryObject parent and cannot exist independently.
 * All file operations use the real filesystem path while exposing clean virtual paths.
 *
 * @property {string} supplied - User-supplied path
 * @property {string} path - The virtual file path (relative to cap)
 * @property {URL} url - The file URL
 * @property {string} name - The file name
 * @property {string} module - The file name without extension
 * @property {string} extension - The file extension
 * @property {boolean} isFile - Always true for files
 * @property {boolean} isVirtual - Always true for VFileObject instances
 * @property {VDirectoryObject} parent - The parent virtual directory object
 * @property {FileObject} real - The real filesystem FileObject
 * @property {Promise<boolean>} exists - Whether the file exists (async)
 */

export default class VFileObject extends FileObject {
  #real

  /**
   * Constructs a VFileObject instance.
   *
   * @param {string} virtualPath - The virtual file path (already resolved, can be nested like "/path/to/file.ext")
   * @param {VDirectoryObject} parent - The parent virtual directory (required, used for cap reference)
   */
  constructor(virtualPath, parent) {
    Valid.type(virtualPath, "String", {allowEmpty: false})
    Valid.type(parent, "VDirectoryObject")

    // Normalize the virtual path
    const normalizedVirtual = FS.fixSlashes(virtualPath)

    // Extract the directory and filename from the virtual path
    const {dir: virtualDir, base} = FS.pathParts(normalizedVirtual)

    // Determine the virtual parent directory
    // If virtualDir is "/" or empty or equals cap path, use the cap root
    // Otherwise, construct the parent directory path relative to cap
    let virtualParent
    if(!virtualDir || virtualDir === "/" || virtualDir === parent.cap.path) {
      virtualParent = parent.cap
    } else {
      // virtualDir is something like "/path/to" - we need to create a VDirectoryObject for it
      // Strip leading "/" if present to make it relative to cap
      const dirRelativeToCap = virtualDir.startsWith("/") ? virtualDir.slice(1) : virtualDir
      // Use the VDirectoryObject constructor to create the parent directory
      virtualParent = new parent.constructor(dirRelativeToCap, parent.cap)
    }

    // Call super with just the filename and the virtual parent
    // This ensures FileObject sets up the virtual path correctly
    super(base, virtualParent)

    // Convert virtual path to real path
    // The virtual path is relative to the cap root, so we resolve it relative to cap's real path
    const capRealPath = parent.cap.real.path

    // Strip leading "/" from virtual path if present to make it relative
    const relativeFromCap = normalizedVirtual.startsWith("/")
      ? normalizedVirtual.slice(1)
      : normalizedVirtual

    // Resolve the real filesystem path
    const realPath = FS.resolvePath(capRealPath, relativeFromCap)

    // Create FileObject with the full real path
    // Extract directory and filename parts
    const {dir: realDir, base: realBase} = FS.pathParts(realPath)
    const realParentDir = new DirectoryObject(realDir)

    this.#real = new FileObject(realBase, realParentDir)
  }

  get isVirtual() {
    return true
  }

  get real() {
    return this.#real
  }
}
