// Implementation: ../lib/Contract.js

import type { ValidateFunction } from 'ajv'

/**
 * Debug function type for Contract operations
 */
export type DebugFunction = (message: string, level?: number, ...args: unknown[]) => void

/**
 * Contract represents a successful negotiation between Terms.
 * It handles validation and compatibility checking between what
 * one action provides and what another accepts.
 *
 * @example
 * ```typescript
 * // Two-party contract between provider and consumer
 * const provider = new Terms(providerDefinition)
 * const consumer = new Terms(consumerDefinition)
 * const contract = new Contract(provider, consumer, { debug: console.log })
 *
 * // Validate data against the contract
 * const isValid = contract.validate(someData)
 * ```
 *
 * @example
 * ```typescript
 * // Single-party contract from terms definition
 * const contract = Contract.fromTerms("parser", {
 *   provides: {
 *     type: "object",
 *     properties: {
 *       name: { type: "string" },
 *       age: { type: "number" }
 *     }
 *   }
 * })
 *
 * contract.validate({ name: "John", age: 30 }) // true
 * ```
 */
declare class Contract {
  /**
   * Creates a contract by negotiating between provider and consumer terms
   *
   * @param providerTerms - What the provider offers
   * @param consumerTerms - What the consumer expects
   * @param options - Configuration options
   * @param options.debug - Debug function for logging negotiation details
   *
   * @throws {Sass} If contract negotiation fails due to incompatible terms
   */
  constructor(
    providerTerms: import('./Terms.js').default | null,
    consumerTerms: import('./Terms.js').default | null,
    options?: { debug?: DebugFunction }
  )

  /**
   * Creates a contract from terms with schema validation
   *
   * @param name - Contract identifier for error reporting
   * @param termsDefinition - The terms definition object
   * @param validator - Optional AJV schema validator function with .errors property
   * @param debug - Debug function for logging validation details
   * @returns New contract instance ready for data validation
   *
   * @throws {Sass} If terms definition is invalid according to the validator
   *
   * @example
   * ```typescript
   * const contract = Contract.fromTerms("user-parser", {
   *   provides: {
   *     type: "object",
   *     properties: {
   *       id: { type: "string" },
   *       name: { type: "string" }
   *     },
   *     required: ["id", "name"]
   *   }
   * })
   * ```
   */
  static fromTerms(
    name: string,
    termsDefinition: object,
    validator?: ValidateFunction | null,
    debug?: DebugFunction
  ): Contract

  /**
   * Validates data against this contract's schema
   *
   * @param data - Data object to validate against the contract
   * @returns True if validation passes
   *
   * @throws {Sass} If validation fails with detailed error messages
   * @throws {Sass} If contract has not been successfully negotiated
   * @throws {Sass} If no validator is available for this contract
   *
   * @example
   * ```typescript
   * try {
   *   contract.validate({ id: "123", name: "John" })
   *   console.log("Data is valid!")
   * } catch (error) {
   *   console.error("Validation failed:", error.message)
   * }
   * ```
   */
  validate(data: object): boolean

  /**
   * Check if contract negotiation was successful
   *
   * @returns True if the contract has been successfully negotiated
   *
   * @example
   * ```typescript
   * if (contract.isNegotiated) {
   *   contract.validate(data)
   * } else {
   *   console.error("Contract negotiation failed")
   * }
   * ```
   */
  get isNegotiated(): boolean

  /**
   * Get the provider terms (if any)
   *
   * @returns Provider terms or null for single-party contracts
   */
  get providerTerms(): import('./Terms.js').default | null

  /**
   * Get the consumer terms (if any)
   *
   * @returns Consumer terms or null for single-party contracts
   */
  get consumerTerms(): import('./Terms.js').default | null

  /**
   * Get the contract validator function
   *
   * @returns The AJV validator function used by this contract, or null if none available
   *
   * @example
   * ```typescript
   * const validator = contract.validator
   * if (validator) {
   *   const isValid = validator(someData)
   *   if (!isValid) {
   *     console.log("Validation errors:", validator.errors)
   *   }
   * }
   * ```
   */
  get validator(): ((data: object) => boolean) | null
}

export default Contract
