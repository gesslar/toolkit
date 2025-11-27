/**
 * @file Data utility functions for type checking, object manipulation, and
 * array operations.
 *
 * Provides comprehensive utilities for working with JavaScript data types and
 * structures.
 */

import TypeSpec from "./TypeSpec.js"

export default class Data {
/**
 * Array of JavaScript primitive type names.
 * Includes basic types and object categories from the typeof operator.
 *
 * @type {Array<string>}
 */
  static primitives = Object.freeze([
  // Primitives
    "Bigint",
    "Boolean",
    "Class",
    "Null",
    "Number",
    "String",
    "Symbol",
    "Undefined",

    // Object Categories from typeof
    "Function",
    "Object",
  ])

  /**
   * Array of JavaScript constructor names for built-in objects.
   * Includes common object types and typed arrays.
   *
   * @type {Array<string>}
   */
  static constructors = Object.freeze([
  // Object Constructors
    "Array",
    "Date",
    "Error",
    "Float32Array",
    "Float64Array",
    "Function",
    "Int8Array",
    "Map",
    "Object",
    "Promise",
    "RegExp",
    "Set",
    "Uint8Array",
    "WeakMap",
    "WeakSet",
  ])

  /**
   * Combined array of all supported data types (primitives and constructors in
   * lowercase).
   *
   * Used for type validation throughout the utility functions.
   *
   * @type {Array<string>}
   */
  static dataTypes = Object.freeze([
    ...Data.primitives,
    ...Data.constructors
  ])

  /**
   * Array of type names that can be checked for emptiness.
   * These types have meaningful empty states that can be tested.
   *
   * @type {Array<string>}
   */
  static emptyableTypes = Object.freeze(["String", "Array", "Object"])

  /**
   * Appends a string to another string if it does not already end with it.
   *
   * @param {string} string - The string to append to
   * @param {string} append - The string to append
   * @returns {string} The appended string
   */
  static appendString(string, append) {
    return string.endsWith(append) ? string : `${string}${append}`
  }

  /**
   * Prepends a string to another string if it does not already start with it.
   *
   * @param {string} string - The string to prepend to
   * @param {string} prepend - The string to prepend
   * @returns {string} The prepended string
   */
  static prependString(string, prepend) {
    return string.startsWith(prepend) ? string : `${prepend}${string}`
  }

  /**
   * Creates a type spec from a string. A type spec is an array of objects
   * defining the type of a value and whether an array is expected.
   *
   * @param {string} string - The string to parse into a type spec.
   * @param {object} options - Additional options for parsing.
   * @returns {Array<object>} An array of type specs.
   */
  static newTypeSpec(string, options) {
    return new TypeSpec(string, options)
  }

  /**
   * Checks if a value is of a specified type
   *
   * @param {unknown} value The value to check
   * @param {string|TypeSpec} type The type to check for
   * @param {object} options Additional options for checking
   * @returns {boolean} Whether the value is of the specified type
   */
  static isType(value, type, options = {}) {
    const typeSpec = type instanceof TypeSpec
      ? type
      : Data.newTypeSpec(type, options)

    return typeSpec.matches(value, options)
  }

  /**
   * Checks if a type is valid
   *
   * @param {string} type - The type to check
   * @returns {boolean} Whether the type is valid
   */
  static isValidType(type) {
    // Allow built-in types
    if(Data.dataTypes.includes(type))
      return true

    // Allow custom classes (PascalCase starting with capital letter)
    return /^[A-Z][a-zA-Z0-9]*$/.test(type)
  }

  /**
   * Checks if a value is of a specified type. Unlike the type function, this
   * function does not parse the type string, and only checks for primitive
   * or constructor types.
   *
   * @param {unknown} value - The value to check
   * @param {string} type - The type to check for
   * @returns {boolean} Whether the value is of the specified type
   */
  static isBaseType(value, type) {
    if(!Data.isValidType(type))
      return false

    // We gotta do classes up front. Ugh.
    if(/^[Cc]lass$/.test(type)) {
      if(typeof value === "function" &&
      value.prototype &&
      value.prototype.constructor === value)

        return true
    }

    const valueType = Data.typeOf(value)

    // Special cases that need extra validation
    switch(valueType) {
      case "Number":
        return type === "Number" && !isNaN(value) // Excludes NaN
      default:
        return valueType === type
    }
  }

  /**
   * Returns the type of a value, whether it be a primitive, object, or function.
   *
   * @param {unknown} value - The value to check
   * @returns {string} The type of the value
   */
  static typeOf(value) {
    if(value === null)
      return "Null"

    const type = typeof value

    if(type === "object")
      return value.constructor.name

    const [first, ...rest] = Array.from(type)

    return `${first?.toLocaleUpperCase() ?? ""}${rest.join("")}`
  }

  /**
   * Checks a value is undefined or null.
   *
   * @param {unknown} value The value to check
   * @returns {boolean} Whether the value is undefined or null
   */
  static isNothing(value) {
    return value === undefined || value === null
  }

  /**
   * Checks if a value is empty. This function is used to check if an object,
   * array, or string is empty. Null and undefined values are considered empty.
   *
   * @param {unknown} value The value to check
   * @param {boolean} checkForNothing Whether to check for null or undefined
   *                                  values
   * @returns {boolean} Whether the value is empty
   */
  static isEmpty(value, checkForNothing = true) {
    if(checkForNothing && Data.isNothing(value))
      return true

    // When checkForNothing is false, null/undefined should not be treated as empty
    // They should be processed like regular values
    if(!checkForNothing && Data.isNothing(value))
      return false

    const type = Data.typeOf(value)

    if(!Data.emptyableTypes.includes(type))
      return false

    switch(type) {
      case "Array":
        return value.length === 0
      case "Object":
        // null was already handled above, so this should only be real objects
        return Object.keys(value).length === 0
      case "String":
        return value.trim().length === 0
      default:
        return false
    }
  }

  /**
   * Freezes an object and all of its properties recursively.
   *
   * @param {object} obj The object to freeze.
   * @returns {object} The frozen object.
   */
  static deepFreezeObject(obj) {
    if(obj === null || typeof obj !== "object")
      return obj // Skip null and non-objects

    // Retrieve and freeze properties
    const propNames = Object.getOwnPropertyNames(obj)

    for(const name of propNames) {
      const value = obj[name]

      // Recursively freeze nested objects
      if(typeof value === "object" && value !== null)
        Data.deepFreezeObject(value)
    }

    // Freeze the object itself
    return Object.freeze(obj)
  }

  /**
   * Ensures that a nested path of objects exists within the given object.
   * Creates empty objects along the path if they don't exist.
   *
   * @param {object} obj - The object to check/modify
   * @param {Array<string>} keys - Array of keys representing the path to ensure
   * @returns {object} Reference to the deepest nested object in the path
   */
  static assureObjectPath(obj, keys) {
    let current = obj  // a moving reference to internal objects within obj
    const len = keys.length

    for(let i = 0; i < len; i++) {
      const elem = keys[i]

      if(!current[elem])
        current[elem] = {}

      current = current[elem]
    }

    // Return the current pointer
    return current
  }

  /**
   * Sets a value in a nested object structure using an array of keys; creating
   * the structure if it does not exist.
   *
   * @param {object} obj - The target object to set the value in
   * @param {Array<string>} keys - Array of keys representing the path to the target property
   * @param {unknown} value - The value to set at the target location
   */
  static setNestedValue(obj, keys, value) {
    const nested = Data.assureObjectPath(obj, keys.slice(0, -1))

    nested[keys[keys.length-1]] = value
  }

  /**
   * Deeply merges two or more objects. Arrays are replaced, not merged.
   *
   * @param {...object} sources - Objects to merge (left to right)
   * @returns {object} The merged object
   */
  static mergeObject(...sources) {
    const isObject = obj => typeof obj === "object" && obj !== null && !Array.isArray(obj)

    return sources.reduce((acc, obj) => {
      if(!isObject(obj))
        return acc

      Object.keys(obj).forEach(key => {
        const accVal = acc[key]
        const objVal = obj[key]

        if(isObject(accVal) && isObject(objVal))
          acc[key] = Data.mergeObject(accVal, objVal)
        else
          acc[key] = objVal
      })

      return acc
    }, {})
  }

  /**
   * Filters an array asynchronously using a predicate function.
   * Applies the predicate to all items in parallel and returns filtered results.
   *
   * @param {Array<unknown>} arr - The array to filter
   * @param {(value: unknown) => Promise<boolean>} predicate - Async predicate function that returns a promise resolving to boolean
   * @returns {Promise<Array<unknown>>} Promise resolving to the filtered array
   */
  static async asyncFilter(arr, predicate) {
    const results = await Promise.all(arr.map(predicate))

    return arr.filter((_, index) => results[index])
  }

  /**
   * Ensures a value is within a specified range.
   *
   * @param {number} val - The value to check.
   * @param {number} min - The minimum value.
   * @param {number} max - The maximum value.
   * @returns {number} The value, constrained within the range of `min` to `max`.
   */
  static clamp(val, min, max) {
    return val >= min ? val <= max ? val : max : min
  }

  /**
   * Checks if a value is within a specified range (inclusive).
   *
   * @param {number} val - The value to check.
   * @param {number} min - The minimum value (inclusive).
   * @param {number} max - The maximum value (inclusive).
   * @returns {boolean} True if the value is within the range, false otherwise.
   */
  static clamped(val, min, max) {
    return val >= min && val <= max
  }

  /**
   * Checks if a value is a plain object - created with object literals {},
   * new Object(), or Object.create(null).
   *
   * Distinguishes plain objects from objects created by custom constructors, built-ins,
   * or primitives. Plain objects only have Object.prototype or null in their prototype chain.
   *
   * @param {unknown} value - The value to check
   * @returns {boolean} True if the value is a plain object, false otherwise
   *
   * @example
   * isPlainObject({}) // true
   * isPlainObject(new Object()) // true
   * isPlainObject(Object.create(null)) // true
   * isPlainObject([]) // false
   * isPlainObject(new Date()) // false
   * isPlainObject(null) // false
   * isPlainObject("string") // false
   * isPlainObject(class Person{}) // false
   */
  static isPlainObject(value) {
    // First, check if it's an object and not null
    if(typeof value !== "object" || value === null)
      return false

    // If it has no prototype, it's plain (created with Object.create(null))
    const proto = Object.getPrototypeOf(value)

    if(proto === null)
      return true

    // Check if the prototype chain ends at Object.prototype
    // This handles objects created with {} or new Object()
    let current = proto

    while(Object.getPrototypeOf(current) !== null)
      current = Object.getPrototypeOf(current)

    return proto === current
  }

  /**
   * Checks if a value is binary data.
   * Returns true for ArrayBuffer, TypedArrays (Uint8Array, Int16Array, etc.),
   * Blob, and Node Buffer instances.
   *
   * @param {unknown} value - The value to check
   * @returns {boolean} True if the value is binary data, false otherwise
   * @example
   * Data.isBinary(new Uint8Array([1, 2, 3])) // true
   * Data.isBinary(new ArrayBuffer(10)) // true
   * Data.isBinary(Buffer.from('hello')) // true
   * Data.isBinary(new Blob(['text'])) // true
   * Data.isBinary('string') // false
   * Data.isBinary({}) // false
   * Data.isBinary(undefined) // false
   */
  static isBinary(value) {
    return (value !== undefined) &&
           (
             ArrayBuffer.isView(value) ||
             Data.isType(value, "ArrayBuffer|Blob|Buffer")
           )
  }
}
