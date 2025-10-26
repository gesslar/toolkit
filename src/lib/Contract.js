import Sass from "./Sass.js"
import Schemer from "./Schemer.js"
import Terms from "./Terms.js"
import Data from "./Data.js"

/**
 * Contract represents a successful negotiation between Terms.
 * It handles validation and compatibility checking between what
 * one action provides and what another accepts.
 */
export default class Contract {
  #providerTerms = null
  #consumerTerms = null
  #validator = null
  #debug = null
  #isNegotiated = false

  /**
   * Creates a contract by negotiating between provider and consumer terms
   *
   * @param {Terms} providerTerms - What the provider offers
   * @param {Terms} consumerTerms - What the consumer expects
   * @param {object} options - Configuration options
   * @param {import('../types.js').DebugFunction} [options.debug] - Debug function
   */
  constructor(providerTerms, consumerTerms, {debug = null} = {}) {
    this.#providerTerms = providerTerms
    this.#consumerTerms = consumerTerms
    this.#debug = debug

    // Perform the negotiation
    this.#negotiate()
  }

  /**
   * Extracts the actual schema from a terms definition
   *
   * @param {object} definition - Terms definition with TLD descriptor
   * @returns {object} Extracted schema content
   * @throws {Sass} If definition structure is invalid
   * @private
   */
  static #extractSchemaFromTerms(definition) {
    // Must be a plain object
    if(!Data.isPlainObject(definition)) {
      throw Sass.new("Terms definition must be a plain object")
    }

    // Must have exactly one key (the TLD/descriptor)
    const keys = Object.keys(definition)
    if(keys.length !== 1) {
      throw Sass.new("Terms definition must have exactly one top-level key (descriptor)")
    }

    // Extract the content under the TLD
    const [key] = keys

    return definition[key]
  }

  /**
   * Creates a contract from terms with schema validation
   *
   * @param {string} name - Contract identifier
   * @param {object} termsDefinition - The terms definition
   * @param {import('ajv').ValidateFunction|null} [validator] - Optional AJV schema validator function with .errors property
   * @param {import('../types.js').DebugFunction} [debug] - Debug function
   * @returns {Contract} New contract instance
   */
  static fromTerms(name, termsDefinition, validator = null, debug = null) {
    // Validate the terms definition if validator provided
    if(validator) {
      const valid = validator(termsDefinition)

      if(!valid) {
        const error = Schemer.reportValidationErrors(validator.errors)
        throw Sass.new(`Invalid terms definition for ${name}:\n${error}`)
      }
    }

    // Extract schema from terms definition for validation
    const schemaDefinition = Contract.#extractSchemaFromTerms(termsDefinition)
    const termsSchemaValidator = Schemer.getValidator(schemaDefinition)

    const contract = new Contract(null, null, {debug})
    contract.#validator = termsSchemaValidator
    contract.#isNegotiated = true // Single-party contract is automatically negotiated

    return contract
  }

  /**
   * Performs negotiation between provider and consumer terms
   *
   * @private
   */
  #negotiate() {
    if(!this.#providerTerms || !this.#consumerTerms) {
      // Single-party contract scenario
      this.#isNegotiated = true

      return
    }

    // Extract content for comparison (ignore TLD metadata)
    const providerContent = Contract.#extractSchemaFromTerms(
      this.#providerTerms.definition
    )
    const consumerContent = Contract.#extractSchemaFromTerms(
      this.#consumerTerms.definition
    )

    // Compare terms for compatibility
    const compatibility = this.#compareTerms(providerContent, consumerContent)

    if(compatibility.status === "error") {
      throw Sass.new(
        `Contract negotiation failed: ${compatibility.errors.map(e => e.message).join(", ")}`
      )
    }

    this.#isNegotiated = true
    this.#debug?.(`Contract negotiated successfully`, 3)
  }

  /**
   * Validates data against this contract
   *
   * @param {object} data - Data to validate
   * @returns {boolean} True if valid
   * @throws {Sass} If validation fails or contract not negotiated
   */
  validate(data) {
    const debug = this.#debug

    if(!this.#isNegotiated)
      throw Sass.new("Cannot validate against unnegotiated contract")

    if(!this.#validator)
      throw Sass.new("No validator available for this contract")

    debug?.("Validating data %o", 4, data)

    const valid = this.#validator(data)

    if(!valid) {
      const error = Schemer.reportValidationErrors(this.#validator.errors)
      throw Sass.new(`Contract validation failed:\n${error}`)
    }

    return true
  }

  /**
   * Compares terms for compatibility
   *
   * @param {object} providerTerms - Terms offered by provider
   * @param {object} consumerTerms - Terms expected by consumer
   * @param {Array<string>} stack - Stack trace for nested validation
   * @returns {object} Result with status and errors
   * @private
   */
  #compareTerms(providerTerms, consumerTerms, stack = []) {
    const debug = this.#debug
    const breadcrumb = key => (stack.length ? `@${stack.join(".")}` : key)
    const errors = []

    if(!providerTerms || !consumerTerms) {
      return {
        status: "error",
        errors: [Sass.new("Both provider and consumer terms are required")]
      }
    }

    debug?.("Comparing provider keys:%o with consumer keys:%o", 3,
      Object.keys(providerTerms), Object.keys(consumerTerms))

    // Check that consumer requirements are met by provider
    for(const [key, consumerRequirement] of Object.entries(consumerTerms)) {
      debug?.("Checking consumer requirement: %o [required = %o]", 3,
        key, consumerRequirement.required ?? false)

      if(consumerRequirement.required && !(key in providerTerms)) {
        debug?.("Provider missing required capability: %o", 2, key)
        errors.push(
          Sass.new(`Provider missing required capability: ${key} ${breadcrumb(key)}`)
        )
        continue
      }

      if(key in providerTerms) {
        const expectedType = consumerRequirement.dataType
        const providedType = providerTerms[key]?.dataType

        if(expectedType && providedType && expectedType !== providedType) {
          errors.push(
            Sass.new(
              `Type mismatch for ${key}: Consumer expects ${expectedType}, provider offers ${providedType} ${breadcrumb(key)}`
            )
          )
        }

        // Recursive validation for nested requirements
        if(consumerRequirement.contains) {
          debug?.("Recursing into nested requirement: %o", 3, key)
          const nestedResult = this.#compareTerms(
            providerTerms[key]?.contains,
            consumerRequirement.contains,
            [...stack, key]
          )

          if(nestedResult.errors.length) {
            errors.push(...nestedResult.errors)
          }
        }
      }
    }

    return {status: errors.length === 0 ? "success" : "error", errors}
  }

  /**
   * Check if contract negotiation was successful
   *
   * @returns {boolean} True if negotiated
   */
  get isNegotiated() {
    return this.#isNegotiated
  }

  /**
   * Get the provider terms (if any)
   *
   * @returns {Terms|null} Provider terms
   */
  get providerTerms() {
    return this.#providerTerms
  }

  /**
   * Get the consumer terms (if any)
   *
   * @returns {Terms|null} Consumer terms
   */
  get consumerTerms() {
    return this.#consumerTerms
  }

  /**
   * Get the contract validator
   *
   * @returns {(data: object) => boolean|null} The contract validator function
   */
  get validator() {
    return this.#validator
  }
}
