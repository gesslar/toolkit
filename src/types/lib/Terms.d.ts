/**
 * Terms represents an interface definition - what an action promises to provide or accept.
 * It's just the specification, not the negotiation. Contract handles the negotiation.
 */
export default class Terms {
    /**
     * Parses terms data, handling file references
     *
     * @param {string|object} termsData - Terms data or reference
     * @param {DirectoryObject?} directoryObject - Directory context for file resolution
     * @returns {object} Parsed terms data
     */
    static parse(termsData: string | object, directoryObject: DirectoryObject | null): object;
    constructor(definition: any);
    /**
     * Get the terms definition
     *
     * @returns {object} The terms definition
     */
    get definition(): object;
    #private;
}
import DirectoryObject from "./DirectoryObject.js";
//# sourceMappingURL=Terms.d.ts.map