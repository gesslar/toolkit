// Implementation: ../lib/Collection.js
// Type definitions for Collection utilities

/**
 * Collection utility functions for evaluating and manipulating arrays, objects, sets, and maps.
 * Provides functional programming patterns for collection processing with consistent error handling.
 */
export default class Collection {
  /**
   * Evaluates an array with a predicate function, returning the first truthy result.
   *
   * @param collection - The array to evaluate
   * @param predicate - Function called for each element: (element, index, array) => result
   * @param forward - Whether to iterate forward (true) or backward (false). Default: true
   * @returns The first truthy result from the predicate, or undefined if none found
   *
   * @throws {Sass} If collection is not an Array or predicate is not a Function
   *
   * @example
   * ```typescript
   * import { Collection } from '@gesslar/toolkit'
   *
   * const numbers = [1, 2, 3, 4, 5]
   * const result = Collection.evalArray(numbers, (n, i) => n > 3 ? n * 2 : null)
   * console.log(result) // 8 (first element > 3, doubled)
   * ```
   */
  static evalArray<T, R>(
    collection: T[],
    predicate: (element: T, index: number, array: T[]) => R | null | undefined,
    forward?: boolean
  ): R | undefined

  /**
   * Evaluates an object with a predicate function, returning the first truthy result.
   *
   * @param collection - The object to evaluate
   * @param predicate - Function called for each property: (value, key, object) => result
   * @returns The first truthy result from the predicate, or undefined if none found
   *
   * @throws {Sass} If collection is not an Object or predicate is not a Function
   *
   * @example
   * ```typescript
   * import { Collection } from '@gesslar/toolkit'
   *
   * const obj = {a: 1, b: 2, c: 3}
   * const result = Collection.evalObject(obj, (value, key) => value > 2 ? `${key}:${value}` : null)
   * console.log(result) // "c:3"
   * ```
   */
  static evalObject<T, R>(
    collection: Record<string, T>,
    predicate: (value: T, key: string, object: Record<string, T>) => R | null | undefined
  ): R | undefined

  /**
   * Evaluates a Set with a predicate function, returning the first truthy result.
   *
   * @param collection - The Set to evaluate
   * @param predicate - Function called for each element: (element, set) => result
   * @returns The first truthy result from the predicate, or undefined if none found
   *
   * @throws {Sass} If collection is not a Set or predicate is not a Function
   *
   * @example
   * ```typescript
   * import { Collection } from '@gesslar/toolkit'
   *
   * const set = new Set([1, 2, 3, 4, 5])
   * const result = Collection.evalSet(set, (n, s) => n > 3 ? n * 2 : null)
   * console.log(result) // 8
   * ```
   */
  static evalSet<T, R>(
    collection: Set<T>,
    predicate: (element: T, set: Set<T>) => R | null | undefined
  ): R | undefined

  /**
   * Evaluates a Map with a predicate function, returning the first truthy result.
   *
   * @param collection - The Map to evaluate
   * @param predicate - Function called for each entry: (value, key, map) => result
   * @param forward - Whether to iterate forward (true) or backward (false). Default: true
   * @returns The first truthy result from the predicate, or undefined if none found
   *
   * @throws {Sass} If collection is not a Map or predicate is not a Function
   *
   * @example
   * ```typescript
   * import { Collection } from '@gesslar/toolkit'
   *
   * const map = new Map([['a', 1], ['b', 2], ['c', 3]])
   * const result = Collection.evalMap(map, (value, key) => value > 2 ? `${key}:${value}` : null)
   * console.log(result) // "c:3"
   * ```
   */
  static evalMap<K, V, R>(
    collection: Map<K, V>,
    predicate: (value: V, key: K, map: Map<K, V>) => R | null | undefined,
    forward?: boolean
  ): R | undefined

  /**
   * Zips two arrays together into an array of pairs.
   *
   * @param array1 - The first array
   * @param array2 - The second array
   * @returns Array of [element1, element2] pairs, length of shorter input array
   *
   * @example
   * ```typescript
   * import { Collection } from '@gesslar/toolkit'
   *
   * const result = Collection.zip([1, 2, 3], ['a', 'b', 'c'])
   * console.log(result) // [[1, 'a'], [2, 'b'], [3, 'c']]
   * ```
   */
  static zip<T, U>(array1: T[], array2: U[]): [T, U][]

  /**
   * Unzips an array of arrays into separate arrays.
   *
   * @param array - Array of arrays to unzip
   * @returns Array of separate arrays, one for each position
   *
   * @example
   * ```typescript
   * import { Collection } from '@gesslar/toolkit'
   *
   * const zipped = [[1, 'a'], [2, 'b'], [3, 'c']]
   * const result = Collection.unzip(zipped)
   * console.log(result) // [[1, 2, 3], ['a', 'b', 'c']]
   * ```
   */
  static unzip<T>(array: T[][]): T[][]

  /**
   * Maps an array through an async function, executing operations sequentially.
   *
   * Unlike Promise.all(array.map(fn)), this executes each async operation
   * one at a time, maintaining order and preventing overwhelming external resources.
   *
   * @param array - The array to map over
   * @param asyncFn - Async function called for each element: (element) => Promise<result>
   * @returns Promise resolving to array of mapped results
   *
   * @throws {Sass} If array is not an Array or asyncFn is not a Function
   *
   * @example
   * ```typescript
   * import { Collection } from '@gesslar/toolkit'
   *
   * // Sequential API calls (won't overwhelm server)
   * const urls = ['url1', 'url2', 'url3']
   * const responses = await Collection.asyncMap(urls, async (url) => {
   *   return await fetch(url).then(r => r.json())
   * })
   * console.log(responses) // [data1, data2, data3]
   *
   * // Works with sync functions too
   * const numbers = [1, 2, 3]
   * const doubled = await Collection.asyncMap(numbers, async (n) => n * 2)
   * console.log(doubled) // [2, 4, 6]
   * ```
   */
  static asyncMap<T, R>(array: T[], asyncFn: (element: T) => Promise<R> | R): Promise<R[]>

  /** Check if all elements in an array are of a specified type or all the same type */
  static isArrayUniform(arr: Array<unknown>, type?: string): boolean

  /** Remove duplicate elements from an array, returning a new array with unique values */
  static isArrayUnique<T>(arr: Array<T>): Array<T>

  /** Get the intersection of two arrays */
  static intersection<T>(arr1: Array<T>, arr2: Array<T>): Array<T>

  /** Check if two arrays have any elements in common */
  static intersects<T>(arr1: Array<T>, arr2: Array<T>): boolean

  /** Pad an array to a specified length */
  static arrayPad<T>(arr: Array<T>, length: number, value: T, position?: number): Array<T>

  /** Filter an array asynchronously */
  static asyncFilter<T>(arr: Array<T>, predicate: (item: T) => Promise<boolean>): Promise<Array<T>>

  /** Clone an object */
  static cloneObject<T extends Record<string, any>>(obj: T, freeze?: boolean): T

  /** Check if an object is empty */
  static isObjectEmpty(obj: Record<string, any>): boolean

  /** Ensure a nested path of objects exists */
  static assureObjectPath(obj: Record<string, any>, keys: Array<string>): Record<string, any>

  /** Set a value in a nested object structure */
  static setNestedValue(obj: Record<string, any>, keys: Array<string>, value: unknown): void

  /** Deeply merge objects */
  static mergeObject<T extends Record<string, any>>(...sources: Array<T>): T

  /** Recursively freeze an object */
  static deepFreezeObject<T>(obj: T): T

  /** Map an object using a transformer function */
  static mapObject<T extends Record<string, any>, R>(
    original: T,
    transformer: (key: string, value: any) => R | Promise<R>,
    mutate?: boolean
  ): Promise<Record<string, R>>

  /** Allocate an object from a source array and spec */
  static allocateObject(
    source: Array<unknown>,
    spec:
      | Array<unknown>
      | ((source: Array<unknown>) => Promise<Array<unknown>> | Array<unknown>)
  ): Promise<Record<string, unknown>>

  /**
   * Flattens one level of an array of plain objects, transposing values so each
   * key maps to the collected values from every object.
   *
   * Accepts either a simple array of objects or an array that mixes objects and
   * nested object arrays (one level deep). Nested arrays are flattened before
   * transposition.
   *
   * @param input - Array of plain objects (optionally containing nested arrays)
   * @returns Object with keys mapped to arrays of values from all input objects
   *
   * @throws {Sass} If input is not an Array or if any element is not a plain object after flattening
   *
   * @example
   * ```typescript
   * import { Collection } from '@gesslar/toolkit'
   *
   * const objects = [
   *   [{ name: 'Alice', age: 25 }],
   *   { name: 'Bob', age: 30 }
   * ]
   *
   * const result = Collection.flattenObjectArray(objects)
   * // result: { name: ['Alice', 'Bob'], age: [25, 30] }
   * ```
   */
  static flattenObjectArray(
    input: Array<Record<string, unknown> | Array<Record<string, unknown>>>
  ): Record<string, Array<unknown>>

  /**
   * Transposes an array of plain objects into an object of arrays, keyed by the
   * original object keys.
   *
   * @param objects - Array of plain objects to transpose
   * @returns Object with keys mapped to arrays of values from the input objects
   *
   * @throws {Sass} If objects is not an Array or if any element is not a plain object
   */
  static transposeObjects(objects: Array<Record<string, unknown>>): Record<string, Array<unknown>>

  /**
   * Trims falsy values from both ends of an array.
   *
   * @param arr - The array to trim
   * @param except - Array of values to exclude from trimming (default: [])
   * @returns The trimmed array (modified in place)
   *
   * @throws {Sass} If arr or except is not an Array
   *
   * @example
   * ```typescript
   * import { Collection } from '@gesslar/toolkit'
   *
   * const arr = [null, 0, 1, 2, "", undefined]
   * Collection.trimArray(arr)
   * console.log(arr) // [1, 2]
   * ```
   */
  static trimArray<T>(arr: Array<T>, except?: Array<T>): Array<T>

  /**
   * Trims falsy values from the right end of an array.
   *
   * @param arr - The array to trim
   * @param except - Array of values to exclude from trimming (default: [])
   * @returns The trimmed array (modified in place)
   *
   * @throws {Sass} If arr or except is not an Array
   *
   * @example
   * ```typescript
   * import { Collection } from '@gesslar/toolkit'
   *
   * const arr = [1, "", undefined]
   * Collection.trimArrayRight(arr)
   * console.log(arr) // [1]
   * ```
   */
  static trimArrayRight<T>(arr: Array<T>, except?: Array<T>): Array<T>

  /**
   * Trims falsy values from the left end of an array.
   *
   * @param arr - The array to trim
   * @param except - Array of values to exclude from trimming (default: [])
   * @returns The trimmed array (modified in place)
   *
   * @throws {Sass} If arr or except is not an Array
   *
   * @example
   * ```typescript
   * import { Collection } from '@gesslar/toolkit'
   *
   * const arr = [null, undefined, "value"]
   * Collection.trimArrayLeft(arr)
   * console.log(arr) // ["value"]
   * ```
   */
  static trimArrayLeft<T>(arr: Array<T>, except?: Array<T>): Array<T>
}
