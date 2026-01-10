/**
 * @file VFileObject.js
 * @description Class representing a virtual file within a capped directory tree.
 * Extends FileObject with virtual path support and real filesystem mapping.
 */

/**
 * @typedef {import("./VDirectoryObject.js").default} VDirectoryObject
 */

import DirectoryObject from "./DirectoryObject.js"
import FileObject from "./FileObject.js"

export default class VFileObject extends FileObject {
}
