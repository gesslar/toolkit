/**
 * Contract represents a successful negotiation between Terms.
 * It handles validation and compatibility checking between what
 * one action provides and what another accepts.
 */
export default class Contract {
    /**
     * Extracts the actual schema from a terms definition
     *
     * @param {object} definition - Terms definition with TLD descriptor
     * @returns {object} Extracted schema content
     * @throws {Sass} If definition structure is invalid
     * @private
     */
    private static "__#private@#extractSchemaFromTerms";
    /**
     * Creates a contract from terms with schema validation
     *
     * @param {string} name - Contract identifier
     * @param {object} termsDefinition - The terms definition
     * @param {import('ajv').ValidateFunction|null} [validator] - Optional AJV schema validator function with .errors property
     * @param {import('../types.js').DebugFunction} [debug] - Debug function
     * @returns {Contract} New contract instance
     */
    static fromTerms(name: string, termsDefinition: object, validator?: import("ajv").ValidateFunction | null, debug?: any): Contract;
    /**
     * Creates a contract by negotiating between provider and consumer terms
     *
     * @param {Terms} providerTerms - What the provider offers
     * @param {Terms} consumerTerms - What the consumer expects
     * @param {object} options - Configuration options
     * @param {import('../types.js').DebugFunction} [options.debug] - Debug function
     */
    constructor(providerTerms: Terms, consumerTerms: Terms, { debug }?: {
        debug?: any;
    });
    /**
     * Validates data against this contract
     *
     * @param {object} data - Data to validate
     * @returns {boolean} True if valid
     * @throws {Sass} If validation fails or contract not negotiated
     */
    validate(data: object): boolean;
    /**
     * Check if contract negotiation was successful
     *
     * @returns {boolean} True if negotiated
     */
    get isNegotiated(): boolean;
    /**
     * Get the provider terms (if any)
     *
     * @returns {Terms|null} Provider terms
     */
    get providerTerms(): Terms | null;
    /**
     * Get the consumer terms (if any)
     *
     * @returns {Terms|null} Consumer terms
     */
    get consumerTerms(): Terms | null;
    /**
     * Get the contract validator
     *
     * @returns {(data: object) => boolean|null} The contract validator function
     */
    get validator(): (data: object) => boolean | null;
    #private;
}
import Terms from "./Terms.js";
//# sourceMappingURL=Contract.d.ts.map