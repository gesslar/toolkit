import Data from "./Data.js"
import Valid from "./Valid.js"

/**
 * @typedef {object} OObjectArrayInfo
 * @property {Array<string>} path - The path array to the array element
 * @property {string} flatPath - The dot-separated path to the array element
 * @property {number} index - The index of the element in the array
 */

/**
 * @typedef {object} OObjectEntry
 * @property {string} key - The property key
 * @property {any} value - The property value
 * @property {string} valueString - String representation of the value
 * @property {Array<string>} path - The path array to this property
 * @property {string} flatPath - The dot-separated path to this property
 * @property {OObjectArrayInfo} [array] - Array information if this entry is from an array
 */

/**
 * @typedef {Record<string, any> | Array<any>} OObjectSource
 */

export default class OObject {
  /** @type {Array<OObjectEntry>} */
  #data = []

  /**
   * Constructs an OObject with optional initial data.
   *
   * @param {Array<OObjectEntry>} oobject
   */
  constructor(oobject=[]) {
    this.#data = oobject
  }

  /**
   * Creates an OObject from a source object or array
   *
   * @param {OObjectSource} source - The source object or array to decompose
   * @returns {OObject} A new OObject instance
   */
  static from(source) {
    Valid.type(source, "Object|Array")

    return new this(this.#decomposeObject(source))
  }

  /**
   * Decomposes a nested object into flat entries with path information.
   * Recursively processes objects and arrays to create a flat structure for
   * evaluation.
   *
   * @param {Record<string, any>} work - The object to decompose
   * @param {Array<string>} objectPath - Current path array for nested properties
   * @returns {Array<OObjectEntry>} Array of decomposed object entries with path information
   */
  static #decomposeObject(work, objectPath=[]) {
    Valid.type(work, "Object|Array")
    Valid.type(objectPath, "Array")

    const result = []

    for(const key in work) {
      const currPath = [...objectPath, key]
      const item = work[key]

      if(Data.isPlainObject(item)) {
        result.push(...this.#decomposeObject(work[key], currPath))
      } else if(Array.isArray(work[key])) {
        work[key].forEach((item, index) => {
          const path = [...currPath, String(index+1)]

          if(Data.isPlainObject(item)) {
            result.push(...this.#decomposeObject(item, path))
          } else {
            result.push({
              key,
              value: item,
              valueString: String(item),
              path,
              flatPath: path.join("."),
              array: {
                path: path.slice(0, -1),
                flatPath: path.slice(0, -1).join("."),
                index
              }
            })
          }
        })
      } else {
        result.push({key, value: item, valueString: String(item), path: currPath, flatPath: currPath.join(".")})
      }
    }

    return result
  }

  /**
   * Gets the internal data array
   *
   * @returns {Array<object>} The decomposed object entries
   */
  get data() {
    return this.#data
  }

  /**
   * Finds the first entry matching a flat path or predicate
   *
   * @param {string|((entry: OObjectEntry, index: number, array: Array<OObjectEntry>) => boolean)} pathOrPredicate - Flat path string or predicate function
   * @returns {OObjectEntry|undefined} The matching entry or undefined
   */
  find(pathOrPredicate) {
    if(typeof pathOrPredicate === "string") {
      return this.#data.find(entry => entry.flatPath === pathOrPredicate)
    }

    Valid.type(pathOrPredicate, "function")

    return this.#data.find(pathOrPredicate)
  }

  /**
   * Finds all entries matching a flat path or predicate
   *
   * @param {string|((entry: OObjectEntry, index: number, array: Array<OObjectEntry>) => boolean)} pathOrPredicate - Flat path string or predicate function
   * @returns {Array<object>} Array of matching entries
   */
  findAll(pathOrPredicate) {
    if(typeof pathOrPredicate === "string") {
      return this.#data.filter(entry => entry.flatPath === pathOrPredicate)
    }

    Valid.type(pathOrPredicate, "function")

    return this.#data.filter(pathOrPredicate)
  }

  /**
   * Returns an iterator over all entries in order
   *
   * @returns {Iterator<object>} Iterator of decomposed entries
   */
  entries() {
    return this.#data[Symbol.iterator]()
  }

  /**
   * Executes a callback for each entry in order
   *
   * @param {(entry: OObjectEntry, index: number, array: Array<OObjectEntry>) => void} callback - Function to call for each entry
   * @returns {void}
   */
  forEach(callback) {
    Valid.type(callback, "function")

    this.#data.forEach(callback)
  }

  /**
   * Ensures a path exists in the data, optionally setting a value
   *
   * @param {string} flatPath - The dot-separated path to ensure
   * @param {*} value - Optional value to set (defaults to undefined)
   * @returns {object} The entry at the path
   */
  assurePath(flatPath, value=undefined) {
    Valid.type(flatPath, "string")

    let entry = this.find(flatPath)

    if(!entry) {
      const path = flatPath.split(".")
      const key = path[path.length - 1]

      /** @type {OObjectEntry} */
      const newEntry = {
        key,
        value,
        valueString: String(value),
        path,
        flatPath
      }

      this.#data.push(newEntry)
      entry = newEntry
    } else if(value !== undefined) {
      entry.value = value
      entry.valueString = String(value)
    }

    return entry
  }
}
