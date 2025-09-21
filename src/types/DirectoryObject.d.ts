// Type definitions for DirectoryObject

/**
 * DirectoryObject encapsulates metadata and operations for a directory,
 * including path resolution and existence checks.
 */
export default class DirectoryObject {
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
}