// Implementation: ../lib/FS.js
// Type definitions for FS utilities

import FileObject from './FileObject.js'
import DirectoryObject from './DirectoryObject.js'

/**
 * Base filesystem utilities class. FileObject and DirectoryObject extend this class.
 */
export default class FS {
  /** Array of lowercase file descriptor types */
  static readonly fdTypes: readonly ['file', 'directory']

  /** Array of uppercase file descriptor types */
  static readonly upperFdTypes: readonly ['FILE', 'DIRECTORY']

  /** Mapping from uppercase to lowercase file descriptor types */
  static readonly fdType: Readonly<Record<'FILE' | 'DIRECTORY', 'file' | 'directory'>>

  /** Fix slashes in a path */
  static fixSlashes(pathName: string): string

  /** Convert a path to a URI */
  static pathToUri(pathName: string): string

  /** Convert a URI to a path */
  static uriToPath(pathName: string): string

  /** Retrieve files matching glob pattern(s) */
  static getFiles(glob: string | Array<string>): Promise<Array<FileObject>>

  /** Compute relative path between two file system objects */
  static relativeOrAbsolutePath(from: FileObject | DirectoryObject, to: FileObject | DirectoryObject): string

  /** Merge two paths by finding overlapping segments and combining them efficiently */
  static mergeOverlappingPaths(path1: string, path2: string, sep?: string): string

  /** Resolve a path relative to another path using various strategies. Handles absolute paths, relative navigation, and overlap-based merging */
  static resolvePath(fromPath: string, toPath: string): string
}
