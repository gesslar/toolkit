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
    /**
     * Creates an OObject from a source object or array
     *
     * @param {OObjectSource} source - The source object or array to decompose
     * @returns {OObject} A new OObject instance
     */
    static from(source: OObjectSource): OObject;
    /**
     * Decomposes a nested object into flat entries with path information.
     * Recursively processes objects and arrays to create a flat structure for
     * evaluation.
     *
     * @param {Record<string, any>} work - The object to decompose
     * @param {Array<string>} objectPath - Current path array for nested properties
     * @returns {Array<OObjectEntry>} Array of decomposed object entries with path information
     */
    static "__#private@#decomposeObject"(work: Record<string, any>, objectPath?: Array<string>): Array<OObjectEntry>;
    /**
     * Constructs an OObject with optional initial data.
     *
     * @param {Array<OObjectEntry>} oobject
     */
    constructor(oobject?: Array<OObjectEntry>);
    /**
     * Gets the internal data array
     *
     * @returns {Array<object>} The decomposed object entries
     */
    get data(): Array<object>;
    /**
     * Finds the first entry matching a flat path or predicate
     *
     * @param {string|((entry: OObjectEntry, index: number, array: Array<OObjectEntry>) => boolean)} pathOrPredicate - Flat path string or predicate function
     * @returns {OObjectEntry|undefined} The matching entry or undefined
     */
    find(pathOrPredicate: string | ((entry: OObjectEntry, index: number, array: Array<OObjectEntry>) => boolean)): OObjectEntry | undefined;
    /**
     * Finds all entries matching a flat path or predicate
     *
     * @param {string|((entry: OObjectEntry, index: number, array: Array<OObjectEntry>) => boolean)} pathOrPredicate - Flat path string or predicate function
     * @returns {Array<object>} Array of matching entries
     */
    findAll(pathOrPredicate: string | ((entry: OObjectEntry, index: number, array: Array<OObjectEntry>) => boolean)): Array<object>;
    /**
     * Returns an iterator over all entries in order
     *
     * @returns {Iterator<object>} Iterator of decomposed entries
     */
    entries(): Iterator<object>;
    /**
     * Executes a callback for each entry in order
     *
     * @param {(entry: OObjectEntry, index: number, array: Array<OObjectEntry>) => void} callback - Function to call for each entry
     * @returns {void}
     */
    forEach(callback: (entry: OObjectEntry, index: number, array: Array<OObjectEntry>) => void): void;
    /**
     * Ensures a path exists in the data, optionally setting a value
     *
     * @param {string} flatPath - The dot-separated path to ensure
     * @param {*} value - Optional value to set (defaults to undefined)
     * @returns {object} The entry at the path
     */
    assurePath(flatPath: string, value?: any): object;
    #private;
}
export type OObjectArrayInfo = {
    /**
     * - The path array to the array element
     */
    path: Array<string>;
    /**
     * - The dot-separated path to the array element
     */
    flatPath: string;
    /**
     * - The index of the element in the array
     */
    index: number;
};
export type OObjectEntry = {
    /**
     * - The property key
     */
    key: string;
    /**
     * - The property value
     */
    value: any;
    /**
     * - String representation of the value
     */
    valueString: string;
    /**
     * - The path array to this property
     */
    path: Array<string>;
    /**
     * - The dot-separated path to this property
     */
    flatPath: string;
    /**
     * - Array information if this entry is from an array
     */
    array?: OObjectArrayInfo;
};
export type OObjectSource = Record<string, any> | Array<any>;
//# sourceMappingURL=OObject.d.ts.map