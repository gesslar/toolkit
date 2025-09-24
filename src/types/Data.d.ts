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

  /**
   * Check if all elements in an array are of a specified type or all the same type.
   * 
   * Performs type checking on every element in the array using the toolkit's type
   * system. If no type is specified, checks that all elements are of the same type.
   * Useful for validating data structures and ensuring type consistency before processing.
   *
   * @param arr - The array to check for type uniformity. Can be empty (returns true).
   * @param type - Optional type name to check against. If not provided, checks that all
   *              elements have the same type. Must be a valid type from Data.dataTypes.
   * @returns True if all elements match the specified type or are all the same type,
   *         false if there's any type mismatch or if type parameter is invalid
   * 
   * @example
   * ```typescript
   * import { Data } from '@gesslar/toolkit'
   * 
   * // Check for specific type uniformity
   * const numbers = [1, 2, 3, 4, 5]
   * const strings = ['a', 'b', 'c']
   * const mixed = [1, 'a', true]
   * 
   * console.log(Data.isArrayUniform(numbers, 'number'))  // true
   * console.log(Data.isArrayUniform(strings, 'string'))  // true
   * console.log(Data.isArrayUniform(mixed, 'number'))    // false
   * 
   * // Check that all elements are the same type (any type)
   * console.log(Data.isArrayUniform(numbers))     // true (all numbers)
   * console.log(Data.isArrayUniform(strings))     // true (all strings) 
   * console.log(Data.isArrayUniform(mixed))       // false (mixed types)
   * console.log(Data.isArrayUniform([]))          // true (empty array)
   * 
   * // Useful for validation before processing
   * function processNumbers(data: unknown[]) {
   *   if (!Data.isArrayUniform(data, 'number')) {
   *     throw new Error('Array must contain only numbers')
   *   }
   *   return data.reduce((sum, num) => sum + num, 0)
   * }
   * ```
   */
  static isArrayUniform(arr: Array<unknown>, type?: string): boolean

  /**
   * Remove duplicate elements from an array, returning a new array with unique values.
   * 
   * Creates a new array containing only the first occurrence of each unique value,
   * preserving the original order of first appearances. Uses strict equality (===)
   * for primitive comparisons and shallow comparison for objects.
   *
   * @param arr - The array to remove duplicates from. Can be empty or contain any types.
   * @returns A new array with duplicate elements removed, preserving order of first occurrence
   * 
   * @example
   * ```typescript
   * import { Data } from '@gesslar/toolkit'
   * 
   * // Basic duplicate removal
   * const numbers = [1, 2, 2, 3, 3, 4]
   * const uniqueNumbers = Data.isArrayUnique(numbers)
   * console.log(uniqueNumbers) // [1, 2, 3, 4]
   * 
   * // Mixed types
   * const mixed = ['a', 1, 'a', 2, 1, 'b']
   * const uniqueMixed = Data.isArrayUnique(mixed)
   * console.log(uniqueMixed) // ['a', 1, 2, 'b']
   * 
   * // Object arrays (shallow comparison)
   * const users = [
   *   { id: 1, name: 'Alice' },
   *   { id: 2, name: 'Bob' },
   *   { id: 1, name: 'Alice' }  // Different object reference, not filtered
   * ]
   * const uniqueUsers = Data.isArrayUnique(users)
   * console.log(uniqueUsers.length) // 3 (objects compared by reference)
   * 
   * // Empty and single element arrays
   * console.log(Data.isArrayUnique([])) // []
   * console.log(Data.isArrayUnique(['single'])) // ['single']
   * 
   * // String array deduplication
   * const tags = ['javascript', 'node', 'javascript', 'typescript', 'node']
   * const uniqueTags = Data.isArrayUnique(tags)
   * console.log(uniqueTags) // ['javascript', 'node', 'typescript']
   * ```
   */
  static isArrayUnique<T>(arr: Array<T>): Array<T>

  /** Get the intersection of two arrays */
  static arrayIntersection<T>(arr1: Array<T>, arr2: Array<T>): Array<T>

  /** Check if two arrays have any elements in common */
  static arrayIntersects<T>(arr1: Array<T>, arr2: Array<T>): boolean

  /** Pad an array to a specified length */
  static arrayPad<T>(arr: Array<T>, length: number, value: T, position?: number): Array<T>

  /** Clone an object */
  static cloneObject<T extends Record<string, any>>(obj: T, freeze?: boolean): T

  /** Allocate an object from a source array and spec */
  static allocateObject(source: Array<unknown>, spec: Array<unknown> | ((source: Array<unknown>) => Promise<Array<unknown>> | Array<unknown>)): Promise<Record<string, unknown>>

  /** Map an object using a transformer function */
  static mapObject<T extends Record<string, any>, R>(
    original: T,
    transformer: (key: string, value: any) => R | Promise<R>,
    mutate?: boolean
  ): Promise<Record<string, R>>

  /** Check if an object is empty */
  static isObjectEmpty(obj: Record<string, any>): boolean

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

  /** Check if all elements in an array are strings */
  static uniformStringArray(arr: Array<unknown>): arr is Array<string>

  /** Filter an array asynchronously */
  static asyncFilter<T>(arr: Array<T>, predicate: (item: T) => Promise<boolean>): Promise<Array<T>>

  /** Ensures a value is within a specified range */
  static clamp(val: number, min: number, max: number): number

  /** Checks if a value is within a specified range (inclusive) */
  static clamped(val: number, min: number, max: number): boolean
}
