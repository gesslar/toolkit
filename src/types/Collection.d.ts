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
}
