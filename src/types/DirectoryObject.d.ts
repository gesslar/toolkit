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

  /** The platform-specific path separator (e.g., '/' on Unix, '\\' on Windows) */
  readonly sep: string

  /** Array of directory path segments split by separator */
  readonly trail: string[]

  /** Always false for directories */
  readonly isFile: false

  /** Always true for directories */
  readonly isDirectory: true

  /** Whether the directory exists (async) */
  readonly exists: Promise<boolean>

  /**
   * Generator that walks up the directory tree, yielding parent directories.
   * Starts from the current directory and yields each parent until reaching the root.
   *
   * @example
   * ```typescript
   * const dir = new DirectoryObject('/path/to/deep/directory')
   * for (const parent of dir.walkUp) {
   *   console.log(parent.path)
   *   // /path/to/deep/directory
   *   // /path/to/deep
   *   // /path/to
   *   // /path
   *   // /
   * }
   * ```
   */
  readonly walkUp: Generator<DirectoryObject, void, unknown>

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

  /**
   * Lists the contents of this directory.
   * Returns FileObject instances for files and DirectoryObject instances for subdirectories.
   *
   * @returns Promise resolving to object with files and directories arrays
   * @throws {Error} If directory cannot be read
   *
   * @example
   * ```typescript
   * const dir = new DirectoryObject('./src')
   * const {files, directories} = await dir.read()
   *
   * console.log(`Found ${files.length} files`)
   * files.forEach(file => console.log(file.name))
   *
   * console.log(`Found ${directories.length} subdirectories`)
   * directories.forEach(subdir => console.log(subdir.name))
   * ```
   */
  read(): Promise<DirectoryListing>

  /**
   * Ensures this directory exists, creating it if necessary.
   * Gracefully handles the case where the directory already exists (EEXIST error).
   * Pass options to control directory creation behavior (e.g., recursive, mode).
   *
   * @param options - Options to pass to fs.mkdir (e.g., {recursive: true, mode: 0o755})
   * @returns Promise that resolves when directory exists or has been created
   * @throws {Sass} If directory creation fails for reasons other than already existing
   *
   * @example
   * ```typescript
   * const dir = new DirectoryObject('./build/output')
   *
   * // Create directory recursively
   * await dir.assureExists({recursive: true})
   *
   * // Now safe to write files
   * const file = new FileObject('result.json', dir)
   * await file.write(JSON.stringify(data))
   * ```
   */
  assureExists(options?: any): Promise<void>
}
