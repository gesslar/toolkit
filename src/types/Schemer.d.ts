// Implementation: ../lib/Schemer.js

import type { ValidateFunction, ErrorObject } from 'ajv'

/**
 * Schemer provides utilities for compiling and validating JSON schemas using AJV.
 *
 * This class serves as a convenient wrapper around AJV (Another JSON Schema Validator)
 * with toolkit-specific enhancements for error reporting and schema compilation.
 *
 * @example
 * ```typescript
 * // Create validator from schema object
 * const validator = await Schemer.from({
 *   type: "object",
 *   properties: {
 *     name: { type: "string" },
 *     age: { type: "number", minimum: 0 }
 *   },
 *   required: ["name"]
 * })
 *
 * // Validate data
 * const isValid = validator({ name: "John", age: 30 })
 * ```
 *
 * @example
 * ```typescript
 * // Create validator from file
 * const file = new FileObject("schema.json")
 * const validator = await Schemer.fromFile(file)
 * ```
 *
 * @example
 * ```typescript
 * // Get raw AJV validator and format errors
 * const validate = Schemer.getValidator(schema)
 * const isValid = validate(data)
 * if (!isValid) {
 *   const errorReport = Schemer.reportValidationErrors(validate.errors)
 *   console.error("Validation failed:", errorReport)
 * }
 * ```
 */
declare class Schemer {
  /**
   * Creates an AJV validator function from a schema file
   *
   * @param file - FileObject pointing to a JSON/YAML schema file
   * @param options - AJV configuration options
   * @returns Promise resolving to AJV validator function
   *
   * @throws {Sass} If file cannot be loaded or schema is invalid
   * @throws {Sass} If file is not a FileObject or options are invalid
   *
   * @example
   * ```typescript
   * const file = new FileObject("user-schema.json")
   * const validator = await Schemer.fromFile(file, {
   *   allErrors: true,
   *   verbose: true
   * })
   *
   * const isValid = validator({ name: "John", age: 30 })
   * if (!isValid) {
   *   console.log("Errors:", validator.errors)
   * }
   * ```
   */
  static fromFile(
    file: import('./FileObject.js').default,
    options?: object
  ): Promise<ValidateFunction>

  /**
   * Creates an AJV validator function from a schema object
   *
   * @param schemaData - JSON schema object to compile
   * @param options - AJV configuration options
   * @returns Promise resolving to AJV validator function
   *
   * @throws {Sass} If schema data or options are not plain objects
   * @throws {Sass} If schema compilation fails
   *
   * @example
   * ```typescript
   * const validator = await Schemer.from({
   *   type: "object",
   *   properties: {
   *     id: { type: "string", format: "uuid" },
   *     email: { type: "string", format: "email" }
   *   },
   *   required: ["id", "email"]
   * }, {
   *   formats: true,
   *   allErrors: true
   * })
   *
   * const isValid = validator({ id: "123", email: "test@example.com" })
   * if (!isValid) {
   *   console.log("Errors:", validator.errors)
   * }
   * ```
   */
  static from(schemaData?: object, options?: object): Promise<ValidateFunction>

  /**
   * Creates a raw AJV validator function from a schema object
   *
   * @param schema - The JSON schema to compile
   * @param options - AJV configuration options (defaults to {allErrors: true, verbose: true})
   * @returns AJV validator function with .errors property when validation fails
   *
   * @example
   * ```typescript
   * const validate = Schemer.getValidator({
   *   type: "string",
   *   minLength: 1,
   *   maxLength: 100
   * })
   *
   * const isValid = validate("Hello World")
   * if (!isValid) {
   *   console.log("Errors:", validate.errors)
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Custom AJV options
   * const validate = Schemer.getValidator(schema, {
   *   allErrors: false,
   *   verbose: false,
   *   strict: true
   * })
   * ```
   */
  static getValidator(
    schema: object,
    options?: { allErrors?: boolean; verbose?: boolean; [key: string]: unknown }
  ): ValidateFunction

  /**
   * Formats AJV validation errors into a human-readable report
   *
   * @param errors - Array of AJV error objects from failed validation
   * @returns Formatted error message with helpful details and suggestions
   *
   * @example
   * ```typescript
   * const validate = Schemer.getValidator(schema)
   * const isValid = validate(data)
   *
   * if (!isValid) {
   *   const report = Schemer.reportValidationErrors(validate.errors)
   *   console.error("Validation failed:")
   *   console.error(report)
   *   // Output:
   *   // - "(root)" must be object
   *   //   ➜ Expected type: object
   *   //   ➜ Received value: "string"
   * }
   * ```
   *
   * @example
   * ```typescript
   * // The error report includes helpful details:
   * // - Property paths and error descriptions
   * // - Expected vs actual types
   * // - Missing required fields
   * // - Pattern matching failures
   * // - Closest matches for enum values
   * // - Unexpected additional properties
   * ```
   */
  static reportValidationErrors(errors: ErrorObject[] | null | undefined): string
}

export default Schemer
