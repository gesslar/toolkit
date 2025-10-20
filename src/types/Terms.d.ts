// Implementation: ../lib/Terms.js

/**
 * Terms represents an interface definition - what an action promises to provide or accept.
 * It's just the specification, not the negotiation. Contract handles the negotiation.
 *
 * Terms can be created from objects, strings (YAML/JSON), or file references.
 * File references use the format "ref://path/to/file" for loading external definitions.
 *
 * @example
 * ```typescript
 * // Create terms from object definition
 * const terms = new Terms({
 *   provides: {
 *     type: "object",
 *     properties: {
 *       userId: { type: "string" },
 *       userName: { type: "string" }
 *     },
 *     required: ["userId"]
 *   }
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Parse terms from YAML string
 * const yamlData = `
 * accepts:
 *   type: object
 *   properties:
 *     input:
 *       type: string
 *       minLength: 1
 * `
 * const parsedTerms = await Terms.parse(yamlData)
 * ```
 *
 * @example
 * ```typescript
 * // Parse terms from file reference
 * const directory = new DirectoryObject("/path/to/schemas")
 * const parsedTerms = await Terms.parse("ref://user-schema.json", directory)
 * ```
 */
declare class Terms {
  /**
   * Creates a new Terms instance with the given definition
   *
   * @param definition - The terms definition object describing what is provided or accepted
   *
   * @example
   * ```typescript
   * const terms = new Terms({
   *   provides: {
   *     type: "object",
   *     properties: {
   *       data: { type: "array", items: { type: "string" } },
   *       metadata: {
   *         type: "object",
   *         properties: {
   *           timestamp: { type: "string", format: "date-time" }
   *         }
   *       }
   *     }
   *   }
   * })
   * ```
   */
  constructor(definition: object)

  /**
   * Parses terms data from various sources, handling file references
   *
   * @param termsData - Terms data as string (YAML/JSON/file reference) or object
   * @param directoryObject - Directory context for resolving file references (required for ref:// URLs)
   * @returns Promise resolving to parsed terms data object
   *
   * @throws {Sass} If termsData is not a string or object
   * @throws {Sass} If string data cannot be parsed as YAML or JSON
   * @throws {Sass} If file reference cannot be loaded (missing directory or file not found)
   *
   * @example
   * ```typescript
   * // Parse from YAML string
   * const yamlTerms = await Terms.parse(`
   *   provides:
   *     type: string
   *     pattern: "^[A-Z][a-z]+"
   * `)
   * ```
   *
   * @example
   * ```typescript
   * // Parse from JSON string
   * const jsonTerms = await Terms.parse(`{
   *   "accepts": {
   *     "type": "number",
   *     "minimum": 0,
   *     "maximum": 100
   *   }
   * }`)
   * ```
   *
   * @example
   * ```typescript
   * // Parse from file reference
   * const directory = new DirectoryObject("./schemas")
   * const fileTerms = await Terms.parse("ref://api-contract.yaml", directory)
   * ```
   *
   * @example
   * ```typescript
   * // Parse from object (returns as-is)
   * const objectTerms = await Terms.parse({
   *   provides: { type: "boolean" }
   * })
   * ```
   */
  static parse(
    termsData: string | object,
    directoryObject?: import('./DirectoryObject.js').default
  ): Promise<object>

  /**
   * Get the terms definition object
   *
   * @returns The complete terms definition as provided to the constructor
   *
   * @example
   * ```typescript
   * const terms = new Terms({
   *   accepts: { type: "string" },
   *   provides: { type: "number" }
   * })
   *
   * const definition = terms.definition
   * console.log(definition.accepts)  // { type: "string" }
   * console.log(definition.provides) // { type: "number" }
   * ```
   */
  get definition(): object
}

export default Terms
