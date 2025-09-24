// Implementation: ../lib/DirectoryObject.js
// Type definitions for DirectoryObject

import FS from './FS.js'
import FileObject from './FileObject.js'

export interface DirectoryListing {
  /** Array of FileObject instances */
  files: Array<FileObject>
  /** Array of DirectoryObject instances */
  directories: Array<DirectoryObject>
}

/**
 * DirectoryObject encapsulates metadata and operations for a directory,
 * including path resolution and existence checks.
 */
export default class DirectoryObject extends FS {
  /**
   * Create a new DirectoryObject instance.
   * @param directory - The directory path
   */
  constructor(directory: string)

  /** User-supplied path */
  readonly supplied: string

  /** The absolute directory path */
  readonly path: string

  /** The directory URI */
  readonly uri: string

  /** The directory name */
  readonly name: string

  /** The directory name without extension */
  readonly module: string

  /** The directory extension (usually empty) */
  readonly extension: string

  /** Always false for directories */
  readonly isFile: false

  /** Always true for directories */
  readonly isDirectory: true

  /** Whether the directory exists (async) */
  readonly exists: Promise<boolean>

  /** Returns a string representation of the DirectoryObject */
  toString(): string

  /** Returns a JSON representation of the DirectoryObject */
  toJSON(): {
    supplied: string
    path: string
    uri: string
    name: string
    module: string
    extension: string
    isFile: boolean
    isDirectory: boolean
  }

  /** List the contents of this directory */
  read(): Promise<DirectoryListing>

  /** Ensure this directory exists, creating it if necessary */
  assureExists(options?: any): Promise<void>
}
