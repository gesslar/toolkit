/**
 * @file Type specification and validation utilities.
 * Provides TypeSpec class for parsing and validating complex type specifications
 * including arrays, unions, and options.
 */

import Collection from "./Collection.js"
import Data from "./Data.js"
import Sass from "./Sass.js"
import Util from "./Util.js"

/**
 * Type specification class for parsing and validating complex type definitions.
 * Supports union types, array types, and validation options.
 */
export default class TypeSpec {
  #specs

  /**
   * Creates a new TypeSpec instance.
   *
   * @param {string} string - The type specification string (e.g., "string|number", "object[]")
   */
  constructor(string) {
    this.#specs = []
    this.#parse(string)
    Object.freeze(this.#specs)
    this.specs = this.#specs
    this.length = this.#specs.length
    this.stringRepresentation = this.toString()
    Object.freeze(this)
  }

  /**
   * Returns a string representation of the type specification.
   *
   * @returns {string} The type specification as a string (e.g., "string|number[]")
   */
  toString() {
    // Reconstruct in parse order, grouping consecutive mixed specs
    const parts = []
    const emittedGroups = new Set()

    for(const spec of this.#specs) {
      if(spec.mixed === false) {
        parts.push(`${spec.typeName}${spec.array ? "[]" : ""}`)
      } else if(!emittedGroups.has(spec.mixed)) {
        emittedGroups.add(spec.mixed)
        const group = this.#specs.filter(s => s.mixed === spec.mixed)
        parts.push(`(${group.map(s => s.typeName).join("|")})[]`)
      }
    }

    return parts.join("|")
  }

  /**
   * Returns a JSON representation of the TypeSpec.
   *
   * @returns {unknown} Object containing specs, length, and string representation
   */
  toJSON() {
    // Serialize as a string representation or as raw data
    return {
      specs: this.#specs,
      length: this.length,
      stringRepresentation: this.toString(),
    }
  }

  /**
   * Executes a provided function once for each type specification.
   *
   * @param {function(unknown): void} callback - Function to execute for each spec
   */
  forEach(callback) {
    this.#specs.forEach(callback)
  }

  /**
   * Tests whether all type specifications pass the provided test function.
   *
   * @param {function(unknown): boolean} callback - Function to test each spec
   * @returns {boolean} True if all specs pass the test
   */
  every(callback) {
    return this.#specs.every(callback)
  }

  /**
   * Tests whether at least one type specification passes the provided test function.
   *
   * @param {function(unknown): boolean} callback - Function to test each spec
   * @returns {boolean} True if at least one spec passes the test
   */
  some(callback) {
    return this.#specs.some(callback)
  }

  /**
   * Creates a new array with all type specifications that pass the provided test function.
   *
   * @param {function(unknown): boolean} callback - Function to test each spec
   * @returns {Array<unknown>} New array with filtered specs
   */
  filter(callback) {
    return this.#specs.filter(callback)
  }

  /**
   * Creates a new array populated with the results of calling the provided function on every spec.
   *
   * @param {function(unknown): unknown} callback - Function to call on each spec
   * @returns {Array<unknown>} New array with mapped values
   */
  map(callback) {
    return this.#specs.map(callback)
  }

  /**
   * Executes a reducer function on each spec, resulting in a single output value.
   *
   * @param {function(unknown, unknown): unknown} callback - Function to execute on each spec
   * @param {unknown} initialValue - Initial value for the accumulator
   * @returns {unknown} The final accumulated value
   */
  reduce(callback, initialValue) {
    return this.#specs.reduce(callback, initialValue)
  }

  /**
   * Returns the first type specification that satisfies the provided testing function.
   *
   * @param {function(unknown): boolean} callback - Function to test each spec
   * @returns {object|undefined} The first spec that matches, or undefined
   */
  find(callback) {
    return this.#specs.find(callback)
  }

  /**
   * Tests whether a value matches any of the type specifications.
   * Handles array types, union types, and empty value validation.
   *
   * @param {unknown} value - The value to test against the type specifications
   * @param {TypeMatchOptions} [options] - Validation options
   * @returns {boolean} True if the value matches any type specification
   */
  matches(value, options) {
    return this.match(value, options).length > 0
  }

  /**
   * Options that can be passed to {@link TypeSpec.match}
   *
   * @typedef {object} TypeMatchOptions
   * @property {boolean} [allowEmpty=true] - Permit a spec of {@link Data.emptyableTypes} to be empty
   */

  /**
   * Returns matching type specifications for a value.
   *
   * @param {unknown} value - The value to test against the type specifications
   * @param {TypeMatchOptions} [options] - Validation options
   * @returns {Array<object>} Array of matching type specifications
   */
  match(value, {
    allowEmpty = true,
  } = {}) {

    // If we have a list of types, because the string was validly parsed, we
    // need to ensure that all of the types that were parsed are valid types in
    // JavaScript.
    if(this.length && !this.every(t => Data.isValidType(t.typeName)))
      return []

    // Now, let's do some checking with the types, respecting the array flag
    // with the value
    const valueType = Data.typeOf(value)
    const isArray = valueType === "Array"

    // We need to ensure that we match the type and the consistency of the
    // types in an array, if it is an array and an array is allowed.
    const matchingTypeSpec = this.filter(spec => {
      // Skip mixed specs — they are handled in the grouped-array check below
      if(spec.mixed !== false)
        return false

      const {typeName: allowedType, array: allowedArray} = spec
      const empty = Data.emptyableTypes.includes(allowedType)
        && Data.isEmpty(value)

      // Handle non-array values
      if(!isArray && !allowedArray) {
        if(valueType === allowedType)
          return allowEmpty || !empty

        if(valueType === "Null" || valueType === "Undefined")
          return false

        if(allowedType === "Object" && Data.isPlainObject(value))
          return true

        // We already don't match directly, let's check their breeding.
        const lineage = this.#getTypeLineage(value)

        return lineage.includes(allowedType)
      }

      // Handle array values
      if(isArray) {
        // Special case for generic "Array" type
        if(allowedType === "Array" && !allowedArray)
          return allowEmpty || !empty

        // Must be an array type specification
        if(!allowedArray)
          return false

        // Handle empty arrays
        if(empty)
          return allowEmpty

        // Check if array elements match the required type
        return Collection.isArrayUniform(value, allowedType)
      }

      return false
    })

    // Check mixed-array groups independently. Each group (e.g.,
    // (String|Number)[] vs (Boolean|Bigint)[]) is validated separately
    // so that multiple groups don't merge into one.
    if(isArray) {
      const mixedSpecs = this.filter(spec => spec.mixed !== false)

      if(mixedSpecs.length) {
        const empty = Data.isEmpty(value)

        if(empty)
          return allowEmpty ? [...matchingTypeSpec, ...mixedSpecs] : []

        // Collect unique group IDs
        const groups = [...new Set(mixedSpecs.map(s => s.mixed))]

        for(const gid of groups) {
          const groupSpecs = mixedSpecs.filter(s => s.mixed === gid)

          const allMatch = value.every(element => {
            const elType = Data.typeOf(element)

            return groupSpecs.some(spec => {
              if(spec.typeName === "Object")
                return Data.isPlainObject(element)

              return elType === spec.typeName
            })
          })

          if(allMatch)
            return [...matchingTypeSpec, ...groupSpecs]
        }
      }
    }

    return matchingTypeSpec
  }

  /**
   * Parses a type specification string into individual type specs.
   * Handles union types separated by delimiters and array notation.
   *
   * @private
   * @param {string} string - The type specification string to parse
   * @throws {Sass} If the type specification is invalid
   */
  #parse(string) {
    const specs = []
    const groupPattern = /\((\w+(?:\|\w+)*)\)\[\]/g

    // Replace groups with placeholder X to validate structure and
    // determine parse order
    const groups = []
    const stripped = string.replace(groupPattern, (_, inner) => {
      groups.push(inner)

      return "X"
    })

    // Validate for malformed delimiters and missing boundaries
    if(/\|\||^\||\|$/.test(stripped) || /[^|]X|X[^|]/.test(stripped))
      throw Sass.new(`Invalid type: ${string}`)

    // Parse in order using the stripped template
    const segments = stripped.split("|")
    let groupId = 0

    for(const segment of segments) {
      if(segment === "X") {
        const currentGroup = groupId++
        const inner = groups[currentGroup]

        for(const raw of inner.split("|")) {
          const typeName = Util.capitalize(raw)

          if(!Data.isValidType(typeName))
            throw Sass.new(`Invalid type: ${raw}`)

          specs.push({typeName, array: true, mixed: currentGroup})
        }

        continue
      }

      const typeMatches = /^(\w+)(\[\])?$/.exec(segment)

      if(!typeMatches || typeMatches.length !== 3)
        throw Sass.new(`Invalid type: ${segment}`)

      const typeName = Util.capitalize(typeMatches[1])

      if(!Data.isValidType(typeName))
        throw Sass.new(`Invalid type: ${typeMatches[1]}`)

      specs.push({
        typeName,
        array: typeMatches[2] === "[]",
        mixed: false,
      })
    }

    this.#specs = specs
  }

  #getTypeLineage(value) {
    const lineage = [Object.getPrototypeOf(value)]
    const names = [lineage.at(-1).constructor.name]

    for(;;) {
      const prototype = Object.getPrototypeOf(lineage.at(-1))
      const name = prototype?.constructor.name

      if(!prototype || !name || name === "Object")
        break

      lineage.push(prototype)
      names.push(prototype.constructor.name)
    }

    return names
  }
}
