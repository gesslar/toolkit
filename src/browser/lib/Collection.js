/**
 * @file Collection.js
 *
 * Provides utility functions for working with collections (arrays, objects, sets, maps).
 * Includes methods for iteration, transformation, validation, and manipulation of
 * various collection types.
 */

import Data from "./Data.js"
import Valid from "./Valid.js"
import Sass from "./Sass.js"
import Util from "./Util.js"

/**
 * Utility class for collection operations.
 * Provides static methods for working with arrays, objects, sets, and maps.
 */
export default class Collection {
  /**
   * Evaluates an array with a predicate function, optionally in reverse order.
   * Returns the first truthy result from the predicate.
   *
   * @param {Array<unknown>} collection - The array to evaluate
   * @param {(value: unknown, index: number, array: Array<unknown>) => unknown} predicate - Function to evaluate each element
   * @param {boolean} [forward] - Whether to iterate forward (true) or backward (false). Defaults to true
   * @returns {unknown|undefined} The first truthy result from the predicate, or undefined
   * @throws {Sass} If collection is not an array or predicate is not a function
   */
  static evalArray(collection, predicate, forward=true) {
    const req = "Array"
    const type = Data.typeOf(collection)

    Valid.type(collection, req, `Invalid collection. Expected '${req}, got ${type}`)
    Valid.type(predicate, "Function",
      `Invalid predicate, expected 'Function', got ${Data.typeOf(predicate)}`)

    const work = forward
      ? Array.from(collection)
      : Array.from(collection).toReversed()

    for(let i = 0; i < work.length; i++) {
      const result = predicate(work[i], i, collection) ?? null

      if(result)
        return result
    }
  }

  /**
   * Evaluates an object with a predicate function.
   * Returns the first truthy result from the predicate.
   *
   * @param {object} collection - The object to evaluate
   * @param {(value: unknown, key: string, object: object) => unknown} predicate - Function to evaluate each property
   * @returns {unknown|undefined} The first truthy result from the predicate, or undefined
   * @throws {Sass} If collection is not an object or predicate is not a function
   */
  static evalObject(collection, predicate) {
    const req = "Object"
    const type = Data.typeOf(collection)

    Valid.type(collection, req, `Invalid collection. Expected '${req}, got ${type}`)
    Valid.type(predicate, "Function",
      `Invalid predicate, expected 'Function', got ${Data.typeOf(predicate)}`)

    const work = Object.entries(collection)

    for(let i = 0; i < work.length; i++) {
      const result = predicate(work[i][1], work[i][0], collection)

      if(result)
        return result
    }
  }

  /**
   * Evaluates a Set with a predicate function.
   * Returns the first truthy result from the predicate.
   *
   * @param {Set<unknown>} collection - The Set to evaluate
   * @param {(value: unknown, set: Set<unknown>) => unknown} predicate - Function to evaluate each element
   * @returns {unknown|undefined} The first truthy result from the predicate, or undefined
   * @throws {Sass} If collection is not a Set or predicate is not a function
   */
  static evalSet(collection, predicate) {
    const req = "Set"
    const type = Data.typeOf(collection)

    Valid.type(collection, req, `Invalid collection. Expected '${req}, got ${type}`)
    Valid.type(predicate, "Function",
      `Invalid predicate, expected 'Function', got ${Data.typeOf(predicate)}`)

    const work = Array.from(collection)

    for(let i = 0; i < work.length; i++) {
      const result = predicate(work[i], collection)

      if(result)
        return result
    }
  }

  /**
   * Evaluates a Map with a predicate function, optionally in reverse order.
   * Returns the first truthy result from the predicate.
   *
   * @param {Map<unknown, unknown>} collection - The Map to evaluate
   * @param {(value: unknown, key: unknown, map: Map<unknown, unknown>) => unknown} predicate - Function to evaluate each entry
   * @param {boolean} [forward] - Whether to iterate forward (true) or backward (false). Defaults to true
   * @returns {unknown|undefined} The first truthy result from the predicate, or undefined
   * @throws {Sass} If collection is not a Map or predicate is not a function
   */
  static evalMap(collection, predicate, forward=true) {
    const req = "Map"
    const type = Data.typeOf(collection)

    Valid.type(collection, req, `Invalid collection. Expected '${req}, got ${type}`)
    Valid.type(predicate, "Function",
      `Invalid predicate, expected 'Function', got ${Data.typeOf(predicate)}`)

    const work = forward
      ? Array.from(collection)
      : Array.from(collection).toReversed()

    for(let i = 0; i < work.length; i++) {
      const result = predicate(work[i][1], work[i][0], collection) ?? null

      if(result)
        return result
    }
  }

  /**
   * Zips two arrays together into an array of pairs.
   * The resulting array length equals the shorter input array.
   *
   * @param {Array<unknown>} array1 - The first array
   * @param {Array<unknown>} array2 - The second array
   * @returns {Array<[unknown, unknown]>} Array of paired elements
   */
  static zip(array1, array2) {
    const minLength = Math.min(array1.length, array2.length)

    return Array.from({length: minLength}, (_, i) => [array1[i], array2[i]])
  }

  /**
   * Unzips an array of pairs into separate arrays.
   * Transposes a 2D array structure.
   *
   * @param {Array<Array<unknown>>} array - Array of arrays to unzip
   * @returns {Array<Array<unknown>>} Array of unzipped arrays, or empty array for invalid input
   */
  static unzip(array) {
    if(!Array.isArray(array) || array.length === 0) {
      return [] // Handle empty or invalid input
    }

    // Determine the number of "unzipped" arrays needed
    // This assumes all inner arrays have the same length, or we take the max length
    const numUnzippedArrays = Math.max(...array.map(arr => arr.length))

    // Initialize an array of empty arrays to hold the unzipped results
    const unzipped = Array.from({length: numUnzippedArrays}, () => [])

    // Iterate through the zipped array and populate the unzipped arrays
    for(let i = 0; i < array.length; i++) {
      for(let j = 0; j < numUnzippedArrays; j++) {
        unzipped[j].push(array[i][j])
      }
    }

    return unzipped
  }

  /**
   * Maps an array using an async function, processing items sequentially.
   * Unlike Promise.all(array.map()), this processes one item at a time.
   *
   * @param {Array<unknown>} array - The array to map
   * @param {(item: unknown) => Promise<unknown>} asyncFn - Async function to apply to each element
   * @returns {Promise<Array<unknown>>} Promise resolving to the mapped array
   * @throws {Sass} If array is not an Array or asyncFn is not a function
   */
  static async asyncMap(array, asyncFn) {
    const req = "Array"
    const type = Data.typeOf(array)

    Valid.type(array, req, `Invalid array. Expected '${req}', got '${type}'`)
    Valid.type(asyncFn, "Function",
      `Invalid mapper function, expected 'Function', got '${Data.typeOf(asyncFn)}'`)

    const results = []

    for(const item of array) {
      results.push(await asyncFn(item))
    }

    return results
  }

  /**
   * Checks if all elements in an array are of a specified type
   *
   * @param {Array<unknown>} arr - The array to check
   * @param {string} [type] - The type to check for (optional, defaults to the type of the first element)
   * @returns {boolean} Whether all elements are of the specified type
   */
  static isArrayUniform(arr, type) {
    const req = "Array"
    const arrType = Data.typeOf(arr)

    Valid.type(arr, req, `Invalid array. Expected '${req}', got '${arrType}'`)

    // Validate type parameter if provided
    if(type !== undefined) {
      Valid.type(type, "string", `Invalid type parameter. Expected 'string', got '${Data.typeOf(type)}'`)
    }

    const checkType = type ? Util.capitalize(type) : null

    return arr.every(
      (item, _index, arr) =>
        Data.typeOf(item) === (checkType || Data.typeOf(arr[0])),
    )
  }

  /**
   * Checks if an array is unique
   *
   * @param {Array<unknown>} arr - The array of which to remove duplicates
   * @returns {Array<unknown>} The unique elements of the array
   */
  static isArrayUnique(arr) {
    const req = "Array"
    const arrType = Data.typeOf(arr)

    Valid.type(arr, req, `Invalid array. Expected '${req}', got '${arrType}'`)

    return arr.filter((item, index, self) => self.indexOf(item) === index)
  }

  /**
   * Returns the intersection of two arrays.
   *
   * @param {Array<unknown>} arr1 - The first array.
   * @param {Array<unknown>} arr2 - The second array.
   * @returns {Array<unknown>} The intersection of the two arrays.
   */
  static intersection(arr1, arr2) {
    const req = "Array"
    const arr1Type = Data.typeOf(arr1)
    const arr2Type = Data.typeOf(arr2)

    Valid.type(arr1, req, `Invalid first array. Expected '${req}', got '${arr1Type}'`)
    Valid.type(arr2, req, `Invalid second array. Expected '${req}', got '${arr2Type}'`)

    const [short,long] = [arr1,arr2].sort((a,b) => a.length - b.length)

    return short.filter(value => long.includes(value))
  }

  /**
   * Checks whether two arrays have any elements in common.
   *
   * This function returns `true` if at least one element from `arr1` exists in
   * `arr2`, and `false` otherwise. It optimizes by iterating over the shorter
   * array for efficiency.
   *
   * Example:
   *   Collection.intersects([1, 2, 3], [3, 4, 5]) // returns true
   *   Collection.intersects(["a", "b"], ["c", "d"]) // returns false
   *
   * @param {Array<unknown>} arr1 - The first array to check for intersection.
   * @param {Array<unknown>} arr2 - The second array to check for intersection.
   * @returns {boolean} True if any element is shared between the arrays, false otherwise.
   */
  static intersects(arr1, arr2) {
    const req = "Array"
    const arr1Type = Data.typeOf(arr1)
    const arr2Type = Data.typeOf(arr2)

    Valid.type(arr1, req, `Invalid first array. Expected '${req}', got '${arr1Type}'`)
    Valid.type(arr2, req, `Invalid second array. Expected '${req}', got '${arr2Type}'`)

    const [short,long] = [arr1,arr2].sort((a,b) => a.length - b.length)

    return !!short.find(value => long.includes(value))
  }

  /**
   * Pads an array to a specified length with a value. This operation
   * occurs in-place.
   *
   * @param {Array<unknown>} arr - The array to pad.
   * @param {number} length - The length to pad the array to.
   * @param {unknown} value - The value to pad the array with.
   * @param {number} [position] - The position to pad the array at. Defaults to 0
   * @returns {Array<unknown>} The padded array.
   */
  static arrayPad(arr, length, value, position = 0) {
    const req = "Array"
    const arrType = Data.typeOf(arr)

    Valid.type(arr, req, `Invalid array. Expected '${req}', got '${arrType}'`)
    Valid.type(length, "Number", `Invalid length. Expected 'Number', got '${Data.typeOf(length)}'`)
    Valid.type(position, "Number", `Invalid position. Expected 'Number', got '${Data.typeOf(position)}'`)

    const diff = length - arr.length

    if(diff <= 0)
      return arr

    const padding = Array(diff).fill(value)

    if(position === 0)
    // prepend - default
      return padding.concat(arr)
    else if(position === -1)
    // append
      return arr.concat(padding) // somewhere in the middle - THAT IS ILLEGAL
    else
      throw Sass.new("Invalid position")
  }

  /**
   * Filters an array asynchronously using a predicate function.
   * Applies the predicate to all items in parallel and returns filtered results.
   *
   * @param {Array<unknown>} arr - The array to filter
   * @param {(value: unknown, index: number, array: Array<unknown>) => Promise<boolean>} predicate - Async predicate function that returns a promise resolving to boolean
   * @returns {Promise<Array<unknown>>} Promise resolving to the filtered array
   */
  static async asyncFilter(arr, predicate) {
    const req = "Array"
    const arrType = Data.typeOf(arr)

    Valid.type(arr, req, `Invalid array. Expected '${req}', got '${arrType}'`)
    Valid.type(predicate, "Function",
      `Invalid predicate function, expected 'Function', got '${Data.typeOf(predicate)}'`)

    const results = await Promise.all(arr.map(predicate))

    return arr.filter((_, index) => results[index])
  }

  /**
   * Clones an object
   *
   * @param {object} obj - The object to clone
   * @param {boolean} freeze - Whether to freeze the cloned object
   * @returns {object} The cloned object
   */
  static cloneObject(obj, freeze = false) {
    const result = {}

    for(const [key, value] of Object.entries(obj)) {
      if(Data.isType(value, "Array")) {
        // Clone arrays by mapping over them
        result[key] = value.map(item =>
          Data.isType(item, "object") || Data.isType(item, "Array")
            ? Collection.cloneObject(item)
            : item
        )
      } else if(Data.isType(value, "object")) {
        result[key] = Collection.cloneObject(value)
      } else {
        result[key] = value
      }
    }

    return freeze ? Object.freeze(result) : result
  }

  /**
   * Checks if an object is empty
   *
   * @param {object} obj - The object to check
   * @returns {boolean} Whether the object is empty
   */
  static isObjectEmpty(obj) {
    const req = "Object"
    const objType = Data.typeOf(obj)

    Valid.type(obj, req, `Invalid object. Expected '${req}', got '${objType}'`)

    return Object.keys(obj).length === 0
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
    const req = "Object"
    const objType = Data.typeOf(obj)
    const keysReq = "Array"
    const keysType = Data.typeOf(keys)

    Valid.type(obj, req, `Invalid object. Expected '${req}', got '${objType}'`)
    Valid.type(keys, keysReq, `Invalid keys array. Expected '${keysReq}', got '${keysType}'`)

    let current = obj  // a moving reference to internal objects within obj
    const len = keys.length

    Valid.prototypePollutionProtection(keys)

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
    const req = "Object"
    const objType = Data.typeOf(obj)
    const keysReq = "Array"
    const keysType = Data.typeOf(keys)

    Valid.type(obj, req, `Invalid object. Expected '${req}', got '${objType}'`)
    Valid.type(keys, keysReq, `Invalid keys array. Expected '${keysReq}', got '${keysType}'`)

    const nested = Collection.assureObjectPath(obj, keys.slice(0, -1))
    const finalKey = keys[keys.length-1]

    Valid.prototypePollutionProtection([finalKey])

    nested[finalKey] = value
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
          acc[key] = Collection.mergeObject(accVal, objVal)
        else
          acc[key] = objVal
      })

      return acc
    }, {})
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
        Collection.deepFreezeObject(value)
    }

    // Freeze the object itself
    return Object.freeze(obj)
  }

  /**
   * Maps an object using a transformer function
   *
   * @param {object} original The original object
   * @param {function(unknown): unknown} transformer The transformer function
   * @param {boolean} mutate Whether to mutate the original object
   * @returns {Promise<object>} The mapped object
   */
  static async mapObject(original, transformer, mutate = false) {
    Valid.type(original, "object", {allowEmpty: true})
    Valid.type(transformer, "function")
    Valid.type(mutate, "boolean")

    const result = mutate ? original : {}

    for(const [key, value] of Object.entries(original))
      result[key] = Data.isType(value, "object")
        ? await Collection.mapObject(value, transformer, mutate)
        : (result[key] = await transformer(key, value))

    return result
  }

  /**
   * Allocates an object from a source array and a spec array or function.
   *
   * @param {unknown} source The source array
   * @param {Array<unknown>|function(Array<unknown>): Promise<Array<unknown>>|Array<unknown>} spec The spec array or function
   * @returns {Promise<object>} The allocated object
   */
  static async allocateObject(source, spec) {
    const workSource = [],
      workSpec = [],
      result = {}

    if(!Data.isType(source, "Array", {allowEmpty: false}))
      throw Sass.new("Source must be an array.")

    workSource.push(...source)

    if(
      !Data.isType(spec, "Array", {allowEmpty: false}) &&
      !Data.isType(spec, "Function")
    )
      throw Sass.new("Spec must be an array or a function.")

    if(Data.isType(spec, "Function")) {
      const specResult = await spec(workSource)

      if(!Data.isType(specResult, "Array"))
        throw Sass.new("Spec resulting from function must be an array.")

      workSpec.push(...specResult)
    } else if(Data.isType(spec, "Array", {allowEmpty: false})) {
      workSpec.push(...spec)
    }

    if(workSource.length !== workSpec.length)
      throw Sass.new("Source and spec must have the same number of elements.")

    // Objects must always be indexed by strings.
    workSource.map((element, index, arr) => (arr[index] = String(element)))

    // Check that all keys are strings
    if(!Collection.isArrayUniform(workSource, "String"))
      throw Sass.new("Indices of an Object must be of type string.")

    workSource.forEach((element, index) => (result[element] = workSpec[index]))

    return result
  }

  /**
   * Trims falsy values from both ends of an array (in-place).
   * Optionally preserves specific falsy values.
   *
   * @param {Array<unknown>} arr - The array to trim
   * @param {Array<unknown>} [except] - Values to preserve even if falsy. Defaults to empty array
   * @returns {Array<unknown>} The trimmed array (same reference, modified in-place)
   * @throws {Sass} If arr is not an Array or except is not an Array
   */
  static trimArray(arr, except=[]) {
    Valid.type(arr, "Array")
    Valid.type(except, "Array")

    Collection.trimArrayLeft(arr, except)
    Collection.trimArrayRight(arr, except)

    return arr
  }

  /**
   * Trims falsy values from the right end of an array (in-place).
   * Optionally preserves specific falsy values.
   *
   * @param {Array<unknown>} arr - The array to trim
   * @param {Array<unknown>} [except] - Values to preserve even if falsy. Defaults to empty array
   * @returns {Array<unknown>} The trimmed array (same reference, modified in-place)
   * @throws {Sass} If arr is not an Array or except is not an Array
   */
  static trimArrayRight(arr, except=[]) {
    Valid.type(arr, "Array")
    Valid.type(except, "Array")

    arr.reverse()
    Collection.trimArrayLeft(arr, except)
    arr.reverse()

    return arr
  }

  /**
   * Trims falsy values from the left end of an array (in-place).
   * Optionally preserves specific falsy values.
   *
   * @param {Array<unknown>} arr - The array to trim
   * @param {Array<unknown>} [except] - Values to preserve even if falsy. Defaults to empty array
   * @returns {Array<unknown>} The trimmed array (same reference, modified in-place)
   * @throws {Sass} If arr is not an Array or except is not an Array
   */
  static trimArrayLeft(arr, except=[]) {
    Valid.type(arr, "Array")
    Valid.type(except, "Array")

    while(arr.length > 0) {
      const value = arr[0]

      if(value || except.includes(value))
        break

      arr.shift()
    }

    return arr
  }

  /**
   * Transposes an array of objects into an object of arrays.
   * Collects values for each key across all objects into arrays.
   *
   * @param {Array<object>} objects - Array of plain objects to transpose
   * @returns {object} Object with keys from input objects, values as arrays
   * @throws {Sass} If objects is not an Array or contains non-plain objects
   */
  static transposeObjects(objects) {
    const req = "Array"
    const type = Data.typeOf(objects)

    Valid.type(objects, req, `Invalid objects array. Expected '${req}', got '${type}'`)

    return objects.reduce((acc, curr) => {
      const elemType = Data.typeOf(curr)

      if(!Data.isPlainObject(curr))
        throw Sass.new(`Invalid array element. Expected plain object, got '${elemType}'`)

      Valid.prototypePollutionProtection(Object.keys(curr))

      Object.entries(curr).forEach(([key, value]) => {
        if(!acc[key])
          acc[key] = []

        acc[key].push(value)
      })

      return acc
    }, {})
  }

  /**
   * Flattens an array (or nested array) of objects and transposes them.
   * Combines flat() and transposeObjects() operations.
   *
   * @param {Array<object>|Array<Array<object>>} input - Array or nested array of objects
   * @returns {object} Transposed object with arrays of values
   */
  static flattenObjectArray(input) {
    const flattened = Array.isArray(input) ? input.flat() : input

    return Collection.transposeObjects(flattened)
  }
}
