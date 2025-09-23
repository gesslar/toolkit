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

  /** Append a string if it doesn't already end with it */
  static appendString(string: string, append: string): string

  /** Prepend a string if it doesn't already start with it */
  static prependString(string: string, prepend: string): string

  /** Check if all elements in an array are of a specified type */
  static isArrayUniform(arr: Array<unknown>, type?: string): boolean

  /** Remove duplicates from an array */
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
