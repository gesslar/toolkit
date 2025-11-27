/**
 * Terms represents an interface definition - what an action promises to provide or accept.
 * It's just the specification, not the negotiation. Contract handles the negotiation.
 */
export default class Terms {
    /**
     * Parses terms data, handling file references
     *
     * @param {string|object} termsData - Terms data or reference
     * @param {import("./DirectoryObject.js").DirectoryObject?} directoryObject - Directory context for file resolution
     * @returns {object} Parsed terms data
     */
    static parse(termsData: string | object, directoryObject: import("./DirectoryObject.js").DirectoryObject | null): object;
    constructor(definition: any);
    /**
     * Get the terms definition
     *
     * @returns {object} The terms definition
     */
    get definition(): object;
    #private;
}
//# sourceMappingURL=Terms.d.ts.map