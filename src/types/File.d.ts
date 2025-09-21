// Type definitions for File utilities

import FileObject from './FileObject.js'
import DirectoryObject from './DirectoryObject.js'

export interface FileParts {
  /** The file name with extension */
  base: string
  /** The directory path */
  dir: string
  /** The file extension (including dot) */
  ext: string
}

export interface DirectoryListing {
  /** Array of FileObject instances */
  files: FileObject[]
  /** Array of DirectoryObject instances */
  directories: DirectoryObject[]
}

/**
 * File system utilities for reading, writing, and manipulating files and directories.
 */
export default class File {
  /** Fix slashes in a path */
  static fixSlashes(pathName: string): string

  /** Convert a path to a URI */
  static pathToUri(pathName: string): string

  /** Convert a URI to a path */
  static uriToPath(pathName: string): string

  /** Check if a file can be read */
  static canReadFile(file: FileObject): Promise<boolean>

  /** Check if a file can be written */
  static canWriteFile(file: FileObject): Promise<boolean>

  /** Check if a file exists */
  static fileExists(file: FileObject): Promise<boolean>

  /** Get the size of a file */
  static fileSize(file: FileObject): Promise<number | null>

  /** Get the last modification time of a file */
  static fileModified(file: FileObject): Promise<Date | null>

  /** Check if a directory exists */
  static directoryExists(dirObject: DirectoryObject): Promise<boolean>

  /** Deconstruct a filename into parts */
  static deconstructFilenameToParts(fileName: string): FileParts

  /** Retrieve files matching glob pattern(s) */
  static getFiles(glob: string | string[]): Promise<FileObject[]>

  /** List the contents of a directory */
  static ls(directory: string): Promise<DirectoryListing>

  /** Read the content of a file */
  static readFile(fileObject: FileObject): Promise<string>

  /** Write content to a file */
  static writeFile(fileObject: FileObject, content: string): Promise<void>

  /** Load an object from JSON or YAML file */
  static loadDataFile(fileObject: FileObject): Promise<any>

  /** Ensure a directory exists, creating it if necessary */
  static assureDirectory(dirObject: DirectoryObject, options?: any): Promise<boolean>

  /** Compute relative path between two file system objects */
  static relativeOrAbsolutePath(from: FileObject | DirectoryObject, to: FileObject | DirectoryObject): string
}