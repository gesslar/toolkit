// Implementation: ../lib/FileObject.js

import DirectoryObject from './DirectoryObject.js'
import FS from './FS.js'

/**
 * Configuration for data loading parsers in loadData method.
 * Maps supported data types to their respective parser functions.
 */
export interface DataLoaderConfig {
  [type: string]: Array<{ parse: (content: string) => unknown }>
}

/**
 * FileObject encapsulates metadata and operations for a file, providing intelligent
 * path resolution, metadata extraction, and file system operations. This class serves
 * as the primary abstraction for file handling in the toolkit.
 *
 * FileObject automatically resolves relative paths, provides rich metadata without
 * requiring file system access, and integrates seamlessly with DirectoryObject for
 * hierarchical file operations. The class uses lazy evaluation for expensive operations
 * and provides both synchronous metadata access and asynchronous file operations.
 *
 * Key features include automatic path normalization, extension parsing, URI generation,
 * and parent directory integration. All path operations are cross-platform compatible.
 *
 * @example
 * ```typescript
 * import { FileObject } from '@gesslar/toolkit'
 *
 * // Basic file creation and metadata access
 * const config = new FileObject('./config.json')
 * console.log('Name:', config.name)           // 'config.json'
 * console.log('Module:', config.module)       // 'config' (without extension)
 * console.log('Extension:', config.extension) // '.json'
 * console.log('Path:', config.path)           // '/absolute/path/to/config.json'
 * console.log('URI:', config.uri)             // 'file:///absolute/path/to/config.json'
 *
 * // Working with different directory contexts
 * const srcDir = new DirectoryObject('./src')
 * const indexFile = new FileObject('index.js', srcDir)
 * const componentFile = new FileObject('components/Button.tsx', './src')
 *
 * // File existence and operations
 * if (await config.exists) {
 *   console.log('Config file exists')
 *   // File operations would go here using File utility
 * } else {
 *   console.log('Config file not found at:', config.path)
 * }
 *
 * // Integration with parent directory
 * console.log('Parent directory:', indexFile.directory.path)
 * console.log('Is in src?', indexFile.directory.name === 'src')
 * ```
 *
 * @example
 * ```typescript
 * // Advanced usage with different file types and paths
 * import { FileObject, DirectoryObject } from '@gesslar/toolkit'
 *
 * // Handle various file extensions and types
 * const files = [
 *   new FileObject('./docs/README.md'),
 *   new FileObject('package.json'),
 *   new FileObject('../lib/utils.ts'),
 *   new FileObject('/absolute/path/to/script.sh')
 * ]
 *
 * for (const fileItem of files) {
 *   console.log(`${fileItem.module}${fileItem.extension} -> ${fileItem.path}`)
 *
 *   // Type-based processing
 *   switch (fileItem.extension) {
 *     case '.json':
 *       console.log('JSON file detected')
 *       break
 *     case '.md':
 *       console.log('Markdown documentation')
 *       break
 *     case '.ts':
 *     case '.js':
 *       console.log('JavaScript/TypeScript source')
 *       break
 *     default:
 *       console.log('Other file type')
 *   }
 * }
 *
 * // Error handling for invalid paths
 * try {
 *   const badFile = new FileObject('')  // Empty path
 * } catch (error) {
 *   console.error('Invalid file path:', error.message)
 * }
 * ```
 *
 * @remarks
 * FileObject is designed for metadata extraction and path operations. For actual
 * file I/O operations (reading, writing, copying), use the File utility class
 * which accepts FileObject instances as parameters.
 *
 * The `exists` property returns a Promise and should always be awaited. Path
 * resolution happens synchronously during construction, making metadata access
 * immediate and efficient.
 *
 * When working with DirectoryObject parents, the FileObject automatically
 * inherits the directory's resolved path, ensuring consistency in hierarchical
 * file operations.
 */
export default class FileObject extends FS {
  /**
   * Configuration for data parsing in the loadData method.
   * Maps data type names to arrays of parser functions.
   */
  static readonly dataLoaderConfig: DataLoaderConfig

  /**
   * Create a new FileObject instance with intelligent path resolution.
   *
   * Constructs a FileObject from the provided filename and optional directory context.
   * Automatically resolves relative paths to absolute paths, normalizes path separators
   * for cross-platform compatibility, and establishes parent-child relationships with
   * DirectoryObject instances.
   *
   * @param fileName - The file path, which can be relative or absolute. Empty strings
   *                  and invalid paths will throw an error during construction.
   * @param directory - Optional parent directory context. Can be a DirectoryObject instance,
   *                   a string path that will be converted to a DirectoryObject, or null
   *                   to use the current working directory as the parent.
   *
   * @throws {Error} When fileName is empty or contains invalid path characters
   * @throws {Error} When the directory parameter is invalid or cannot be resolved
   *
   * @example
   * ```typescript
   * // Simple file in current directory - most common usage
   * const packageJson = new FileObject('package.json')
   * const readme = new FileObject('./README.md')  // Equivalent to above
   *
   * // File with string directory path
   * const configFile = new FileObject('app.config.js', './config')
   * const componentFile = new FileObject('Button.tsx', './src/components')
   *
   * // File with DirectoryObject parent for hierarchical operations
   * const srcDir = new DirectoryObject('./src')
   * const indexFile = new FileObject('index.js', srcDir)
   * const utilsFile = new FileObject('utils/helpers.js', srcDir)
   *
   * // Absolute paths (directory parameter ignored)
   * const systemFile = new FileObject('/etc/hosts')
   * const winFile = new FileObject('C:\\Windows\\System32\\drivers\\etc\\hosts')
   * ```
   *
   * @example
   * ```typescript
   * // Complex directory structures and nested files
   * const projectRoot = new DirectoryObject('./my-project')
   * const srcDir = new DirectoryObject('src', projectRoot)
   *
   * // Create files within nested directory structure
   * const mainApp = new FileObject('App.tsx', srcDir)
   * const stylesheet = new FileObject('styles/main.css', srcDir)
   * const testFile = new FileObject('__tests__/App.test.tsx', srcDir)
   *
   * console.log('Main app:', mainApp.path)     // /absolute/path/my-project/src/App.tsx
   * console.log('Stylesheet:', stylesheet.path) // /absolute/path/my-project/src/styles/main.css
   * console.log('Test file:', testFile.path)   // /absolute/path/my-project/src/__tests__/App.test.tsx
   *
   * // All files share the same parent directory reference
   * console.log('Same parent?', mainApp.directory === srcDir) // true
   * ```
   */
  constructor(fileName: string, directory?: DirectoryObject | string | null)

  /**
   * The original user-supplied path string used during construction.
   *
   * Preserves the exact path string passed to the constructor, including
   * any relative path indicators (./, ../) or path separators. Useful
   * for debugging, logging, or when you need to recreate the original
   * user input.
   *
   * @example
   * ```typescript
   * const file1 = new FileObject('./config.json')
   * const file2 = new FileObject('../package.json')
   *
   * console.log(file1.supplied) // './config.json'
   * console.log(file2.supplied) // '../package.json'
   * console.log(file1.path)     // '/absolute/path/to/config.json'
   * console.log(file2.path)     // '/absolute/path/package.json'
   * ```
   */
  readonly supplied: string

  /**
   * The fully resolved absolute file path with normalized separators.
   *
   * Automatically resolved during construction using Node.js path utilities.
   * Always uses forward slashes on Unix systems and backslashes on Windows.
   * This is the canonical path that should be used for all file operations.
   *
   * @example
   * ```typescript
   * // Different inputs, same resolved path
   * const file1 = new FileObject('./src/../config.json')
   * const file2 = new FileObject('config.json')
   *
   * console.log(file1.path) // '/absolute/path/config.json'
   * console.log(file2.path) // '/absolute/path/config.json'
   * console.log(file1.path === file2.path) // true
   * ```
   */
  readonly path: string

  /**
   * The file URI representation following RFC 3986 standard.
   *
   * Converts the absolute file path to a proper file:// URI scheme,
   * handling URL encoding for special characters and proper formatting
   * for cross-platform file URI access.
   *
   * @example
   * ```typescript
   * const file = new FileObject('./my project/config file.json')
   * console.log(file.uri)
   * // 'file:///absolute/path/my%20project/config%20file.json'
   *
   * // Can be used with URL constructor or file:// handlers
   * const url = new URL(file.uri)
   * console.log(url.pathname) // '/absolute/path/my project/config file.json'
   * ```
   */
  readonly uri: string

  /**
   * The complete filename including extension.
   *
   * Extracted from the resolved path using Node.js path utilities.
   * Includes the file extension but excludes any directory components.
   *
   * @example
   * ```typescript
   * const jsFile = new FileObject('./src/components/Button.tsx')
   * const configFile = new FileObject('../.env.production')
   *
   * console.log(jsFile.name)    // 'Button.tsx'
   * console.log(configFile.name) // '.env.production'
   * ```
   */
  readonly name: string

  /**
   * The filename without its extension, suitable for module identification.
   *
   * Useful for generating module names, import statements, or when you need
   * the base name without file type information. Handles complex extensions
   * and dotfiles appropriately.
   */
  readonly module: string

  /**
   * The file extension including the leading dot.
   *
   * Extracted using Node.js path utilities, always includes the dot prefix.
   * Returns an empty string for files without extensions. Handles multiple
   * extensions by returning only the last one.
   */
  readonly extension: string

  /** Type discriminator - always true for FileObject instances */
  readonly isFile: true

  /** Type discriminator - always false for FileObject instances */
  readonly isDirectory: false

  /**
   * The parent DirectoryObject containing this file.
   *
   * Automatically created during FileObject construction based on the resolved
   * file path. Provides access to parent directory operations and maintains
   * the hierarchical relationship between files and directories.
   */
  readonly directory: DirectoryObject

  /**
   * Promise that resolves to whether the file exists on the filesystem.
   *
   * Performs an asynchronous filesystem check to determine file existence.
   * The Promise will resolve to true if the file exists and is accessible,
   * false otherwise. Always await this property before using the result.
   */
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

  /** Check if a file can be read */
  canRead(): Promise<boolean>

  /** Check if a file can be written */
  canWrite(): Promise<boolean>

  /** Get the size of a file */
  size(): Promise<number | null>

  /** Get the last modification time of a file */
  modified(): Promise<Date | null>

  /** Read the content of a file */
  read(encoding?: string): Promise<string>

  /**
   * Write content to a file asynchronously.
   * Validates that the parent directory exists before writing.
   *
   * @param content - The content to write
   * @param encoding - The encoding in which to write (default: "utf8")
   * @throws {Sass} If the file path is invalid or the parent directory doesn't exist
   *
   * @example
   * ```typescript
   * const file = new FileObject('./output/data.json')
   * await file.write(JSON.stringify({key: 'value'}))
   *
   * // With custom encoding
   * await file.write('content', 'utf16le')
   * ```
   */
  write(content: string, encoding?: string): Promise<void>

  /**
   * Load and parse data from JSON5 or YAML file.
   * Attempts to parse content as JSON5 first, then falls back to YAML if type is "any".
   *
   * @param type - The expected data format: "json", "json5", "yaml", or "any" (default: "any")
   * @param encoding - The file encoding (default: "utf8")
   * @returns The parsed data object
   * @throws {Sass} If the content cannot be parsed or type is unsupported
   *
   * @example
   * ```typescript
   * // Load JSON5 config
   * const config = await configFile.loadData('json5')
   *
   * // Auto-detect format (tries JSON5, then YAML)
   * const data = await dataFile.loadData('any')
   *
   * // Load YAML explicitly
   * const yaml = await yamlFile.loadData('yaml')
   * ```
   */
  loadData(type?: 'json' | 'json5' | 'yaml' | 'any', encoding?: string): Promise<unknown>

  /**
   * Dynamically import the file using the resolved file URI.
   *
   * Uses Node.js' native dynamic `import()` under the hood, allowing consumers to load
   * ESM modules from disk with full path resolution handled by FileObject. The method
   * verifies the file exists before attempting the import to provide clearer error
   * messaging and prevent low-level loader failures.
   *
   * @typeParam TModule - Expected module shape. Defaults to a loose record to help with
   * module namespace typing.
   *
   * @returns The imported module namespace object.
   *
   * @throws {Error} When the file does not exist or the path cannot be converted to a URI.
   *
   * @example
   * ```typescript
   * const configModule = await file.import<{ default: Config }>()
   * const config = configModule.default
   * ```
   */
  import<TModule = Record<string, unknown>>(): Promise<TModule>
}
