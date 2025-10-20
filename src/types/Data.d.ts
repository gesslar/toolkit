// Implementation: ../lib/Data.js
// Type definitions for Data utilities

import Type from './Type.js'

/**
 * Data utility functions for type checking, object manipulation, and array operations.
 */
export default class Data {
  /** Array of JavaScript primitive type names */
  static readonly primitives: ReadonlyArray<string>

  /** Array of JavaScript constructor names for built-in objects */
  static readonly constructors: ReadonlyArray<string>

  /** Combined array of all supported data types */
  static readonly dataTypes: ReadonlyArray<string>

  /** Array of type names that can be checked for emptiness */
  static readonly emptyableTypes: ReadonlyArray<string>

  /**
   * Append a suffix string to the end of a string if it doesn't already end with it.
   *
   * Useful for ensuring strings have consistent endings like file extensions,
   * URL paths, or punctuation. Performs case-sensitive comparison and only appends
   * if the string doesn't already end with the specified suffix.
   *
   * @param string - The base string to potentially append to. Can be empty string.
   * @param append - The suffix to append if not already present. Cannot be empty.
   * @returns The string with the suffix appended, or the original string if suffix already present
   *
   * @throws {Error} When append parameter is empty or undefined
   *
   * @example
   * ```typescript
   * import { Data } from '@gesslar/toolkit'
   *
   * // Basic usage with file extensions
   * const filename = Data.appendString('config', '.json')
   * console.log(filename) // 'config.json'
   *
   * // No double-appending
   * const alreadyHasExt = Data.appendString('package.json', '.json')
   * console.log(alreadyHasExt) // 'package.json' (unchanged)
   *
   * // URL path handling
   * const apiPath = Data.appendString('/api/users', '/')
   * console.log(apiPath) // '/api/users/'
   *
   * // Works with empty strings
   * const fromEmpty = Data.appendString('', '.txt')
   * console.log(fromEmpty) // '.txt'
   * ```
   */
  static appendString(string: string, append: string): string

  /**
   * Prepend a prefix string to the beginning of a string if it doesn't already start with it.
   *
   * Useful for ensuring strings have consistent beginnings like protocol prefixes,
   * path separators, or formatting markers. Performs case-sensitive comparison and
   * only prepends if the string doesn't already start with the specified prefix.
   *
   * @param string - The base string to potentially prepend to. Can be empty string.
   * @param prepend - The prefix to prepend if not already present. Cannot be empty.
   * @returns The string with the prefix prepended, or the original string if prefix already present
   *
   * @throws {Error} When prepend parameter is empty or undefined
   *
   * @example
   * ```typescript
   * import { Data } from '@gesslar/toolkit'
   *
   * // Basic usage with protocols
   * const url = Data.prependString('example.com', 'https://')
   * console.log(url) // 'https://example.com'
   *
   * // No double-prepending
   * const alreadyHasProtocol = Data.prependString('https://api.example.com', 'https://')
   * console.log(alreadyHasProtocol) // 'https://api.example.com' (unchanged)
   *
   * // File path handling
   * const absolutePath = Data.prependString('home/user/docs', '/')
   * console.log(absolutePath) // '/home/user/docs'
   *
   * // CSS class prefixing
   * const className = Data.prependString('button-primary', 'css-')
   * console.log(className) // 'css-button-primary'
   * ```
   */
  static prependString(string: string, prepend: string): string


  /** Create a type spec from a string */
  static newTypeSpec(string: string, options?: any): Type

  /** Check if a value is of a specified type */
  static isType(value: unknown, type: string | Type, options?: { allowEmpty?: boolean }): boolean

  /** Check if a type is valid */
  static isValidType(type: string): boolean

  /** Check if a value is of a base type (primitive or constructor) */
  static isBaseType(value: unknown, type: string): boolean

  /** Get the type of a value */
  static typeOf(value: unknown): string

  /** Check if a value is undefined or null */
  static isNothing(value: unknown): value is null | undefined

  /** Check if a value is empty */
  static isEmpty(value: unknown, checkForNothing?: boolean): boolean

  /** Recursively freeze an object */
  static deepFreezeObject<T>(obj: T): T

  /** Ensure a nested path of objects exists */
  static assureObjectPath(obj: Record<string, any>, keys: Array<string>): Record<string, any>

  /** Set a value in a nested object structure */
  static setNestedValue(obj: Record<string, any>, keys: Array<string>, value: unknown): void

  /** Deeply merge objects */
  static mergeObject<T extends Record<string, any>>(...sources: Array<T>): T

  /** Filter an array asynchronously */
  static asyncFilter<T>(arr: Array<T>, predicate: (item: T) => Promise<boolean>): Promise<Array<T>>

  /** Ensures a value is within a specified range */
  static clamp(val: number, min: number, max: number): number

  /** Checks if a value is within a specified range (inclusive) */
  static clamped(val: number, min: number, max: number): boolean

  /**
   * Checks if a value is a plain object - created with object literals {},
   * new Object(), or Object.create(null).
   *
   * Distinguishes plain objects from objects created by custom constructors, built-ins,
   * or primitives. Plain objects only have Object.prototype or null in their prototype chain.
   * Useful for validating configuration objects or data structures that should be plain objects.
   *
   * @param value - The value to check for plain object status
   * @returns True if the value is a plain object, false otherwise
   *
   * @example
   * ```typescript
   * import { Data } from '@gesslar/toolkit'
   *
   * // Plain objects return true
   * console.log(Data.isPlainObject({})) // true
   * console.log(Data.isPlainObject(new Object())) // true
   * console.log(Data.isPlainObject(Object.create(null))) // true
   *
   * // Non-plain objects return false
   * console.log(Data.isPlainObject([])) // false
   * console.log(Data.isPlainObject(new Date())) // false
   * console.log(Data.isPlainObject(/regex/)) // false
   * console.log(Data.isPlainObject(null)) // false
   * console.log(Data.isPlainObject('string')) // false
   *
   * // Useful for validating config objects
   * function processConfig(config: unknown) {
   *   if (!Data.isPlainObject(config)) {
   *     throw new Error('Config must be a plain object')
   *   }
   *   // Safe to treat as object with string keys
   *   return Object.entries(config)
   * }
   * ```
   */
  static isPlainObject(value: unknown): boolean
}
