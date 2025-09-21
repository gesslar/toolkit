// Type definitions for FileObject

import DirectoryObject from './DirectoryObject.js'

/**
 * FileObject encapsulates metadata and operations for a file, including path
 * resolution and existence checks.
 */
export default class FileObject {
  /**
   * Create a new FileObject instance.
   * @param fileName - The file path
   * @param directory - The parent directory (object or string)
   */
  constructor(fileName: string, directory?: DirectoryObject | string | null)

  /** User-supplied path */
  readonly supplied: string

  /** The absolute file path */
  readonly path: string

  /** The file URI */
  readonly uri: string

  /** The file name */
  readonly name: string

  /** The file name without extension */
  readonly module: string

  /** The file extension */
  readonly extension: string

  /** Always true for files */
  readonly isFile: true

  /** Always false for files */
  readonly isDirectory: false

  /** The parent directory object */
  readonly directory: DirectoryObject

  /** Whether the file exists (async) */
  readonly exists: Promise<boolean>

  /** Returns a JSON representation of the FileObject */
  toJSON(): {
    supplied: string
    path: string
    uri: string
    name: string
    module: string
    extension: string
    isFile: boolean
    isDirectory: boolean
    directory: string | null
  }
}