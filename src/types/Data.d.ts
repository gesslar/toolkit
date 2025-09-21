// Type definitions for Data utilities

import Type from './Type.js'

/**
 * Data utility functions for type checking, object manipulation, and array operations.
 */
export default class Data {
  /** Array of JavaScript primitive type names */
  static readonly primitives: readonly string[]

  /** Array of JavaScript constructor names for built-in objects */
  static readonly constructors: readonly string[]

  /** Combined array of all supported data types */
  static readonly dataTypes: readonly string[]

  /** Array of type names that can be checked for emptiness */
  static readonly emptyableTypes: readonly string[]

  /** Append a string if it doesn't already end with it */
  static appendString(string: string, append: string): string

  /** Prepend a string if it doesn't already start with it */
  static prependString(string: string, prepend: string): string

  /** Check if all elements in an array are of a specified type */
  static isArrayUniform(arr: unknown[], type?: string): boolean

  /** Remove duplicates from an array */
  static isArrayUnique<T>(arr: T[]): T[]

  /** Get the intersection of two arrays */
  static arrayIntersection<T>(arr1: T[], arr2: T[]): T[]

  /** Check if two arrays have any elements in common */
  static arrayIntersects<T>(arr1: T[], arr2: T[]): boolean

  /** Pad an array to a specified length */
  static arrayPad<T>(arr: T[], length: number, value: T, position?: number): T[]

  /** Clone an object */
  static cloneObject<T extends Record<string, any>>(obj: T, freeze?: boolean): T

  /** Allocate an object from a source array and spec */
  static allocateObject(source: unknown[], spec: unknown[] | ((source: unknown[]) => unknown[])): Promise<Record<string, unknown>>

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
  static assureObjectPath(obj: Record<string, any>, keys: string[]): Record<string, any>

  /** Set a value in a nested object structure */
  static setNestedValue(obj: Record<string, any>, keys: string[], value: unknown): void

  /** Deeply merge objects */
  static mergeObject<T extends Record<string, any>>(...sources: T[]): T

  /** Check if all elements in an array are strings */
  static uniformStringArray(arr: unknown[]): arr is string[]

  /** Filter an array asynchronously */
  static asyncFilter<T>(arr: T[], predicate: (item: T) => Promise<boolean>): Promise<T[]>
}