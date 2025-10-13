import Ajv from "ajv"

import Data from "./Data.js"
import Util from "./Util.js"
import Valid from "./Valid.js"

/**
 * Schemer provides utilities for compiling and validating JSON schemas using AJV.
 *
 * Usage:
 *   - Use Schemer.fromFile(file, options) to create a validator from a file.
 *   - Use Schemer.from(schemaData, options) to create a validator from a schema object.
 *   - Use Schemer.getValidator(schema, options) to get a raw AJV validator function.
 *   - Use Schemer.reportValidationErrors(errors) to format AJV validation errors.
 */
export default class Schemer {
  static async fromFile(file, options={}) {
    Valid.type(file, "FileObject")
    Valid.assert(Data.isPlainObject(options), "Options must be a plain object.")

    const schemaData = await file.loadData()

    return Schemer.getValidator(schemaData, options)
  }

  static async from(schemaData={}, options={}) {
    Valid.assert(Data.isPlainObject(schemaData), "Schema data must be a plain object.")
    Valid.assert(Data.isPlainObject(options), "Options must be a plain object.")

    return Schemer.getValidator(schemaData, options)
  }

  /**
   * Creates a validator function from a schema object
   *
   * @param {object} schema - The schema to compile
   * @param {object} [options] - AJV options
   * @returns {(data: unknown) => boolean} The AJV validator function, which may have additional properties (e.g., `.errors`)
   */
  static getValidator(schema, options = {allErrors: true, verbose: true}) {
    const ajv = new Ajv(options)

    return ajv.compile(schema)
  }

  static reportValidationErrors(errors) {
    if(!errors) {
      return ""
    }

    return errors.reduce((errorMessages, error) => {
      let msg = `- "${error.instancePath || "(root)"}" ${error.message}`

      if(error.params) {
        const details = []

        if(error.params.type)
          details.push(`  ➜ Expected type: ${error.params.type}`)

        if(error.params.missingProperty)
          details.push(`  ➜ Missing required field: ${error.params.missingProperty}`)

        if(error.params.allowedValues) {
          details.push(`  ➜ Allowed values: "${error.params.allowedValues.join('", "')}"`)
          details.push(`  ➜ Received value: "${error.data}"`)
          const closestMatch =
            Util.findClosestMatch(error.data, error.params.allowedValues)

          if(closestMatch)
            details.push(`  ➜ Did you mean: "${closestMatch}"?`)
        }

        if(error.params.pattern)
          details.push(`  ➜ Expected pattern: ${error.params.pattern}`)

        if(error.params.format)
          details.push(`  ➜ Expected format: ${error.params.format}`)

        if(error.params.additionalProperty)
          details.push(`  ➜ Unexpected property: ${error.params.additionalProperty}`)

        if(details.length)
          msg += `\n${details.join("\n")}`
      }

      return errorMessages ? `${errorMessages}\n${msg}` : msg
    }, "")
  }
}
