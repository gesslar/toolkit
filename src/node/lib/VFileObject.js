/**
 * @file VFileObject.js
 * @description Class representing a virtual file within a capped directory tree.
 * Extends FileObject with virtual path support and real filesystem mapping.
 */

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
   * @param {string} fileName - The file path
   * @param {VDirectoryObject} parent - The parent virtual directory (required)
   */
  constructor(fileName, parent) {
    Valid.type(fileName, "String", {allowEmpty: false})
    Valid.type(parent, "VDirectoryObject")

    super(fileName, parent)

    const parentRealPath = this.parent.real.path
    const resolved = FS.resolvePath(this.parent.path, fileName)
    const {base} = FS.pathParts(resolved)

    this.#real = new FileObject(base, parentRealPath)
  }

  get isVirtual() {
    return true
  }

  get real() {
    return this.#real
  }
}
