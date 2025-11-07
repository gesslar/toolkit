/**
 * Type specification class for parsing and validating complex type definitions.
 * Supports union types, array types, and validation options.
 */
export default class TypeSpec {
    /**
     * Creates a new TypeSpec instance.
     *
     * @param {string} string - The type specification string (e.g., "string|number", "object[]")
     * @param {object} options - Additional parsing options
     */
    constructor(string: string, options: object);
    specs: any[];
    length: number;
    stringRepresentation: string;
    /**
     * Returns a string representation of the type specification.
     *
     * @returns {string} The type specification as a string (e.g., "string|number[]")
     */
    toString(): string;
    /**
     * Returns a JSON representation of the TypeSpec.
     *
     * @returns {object} Object containing specs, length, and string representation
     */
    toJSON(): object;
    /**
     * Executes a provided function once for each type specification.
     *
     * @param {function(unknown): void} callback - Function to execute for each spec
     */
    forEach(callback: (arg0: unknown) => void): void;
    /**
     * Tests whether all type specifications pass the provided test function.
     *
     * @param {function(unknown): boolean} callback - Function to test each spec
     * @returns {boolean} True if all specs pass the test
     */
    every(callback: (arg0: unknown) => boolean): boolean;
    /**
     * Tests whether at least one type specification passes the provided test function.
     *
     * @param {function(unknown): boolean} callback - Function to test each spec
     * @returns {boolean} True if at least one spec passes the test
     */
    some(callback: (arg0: unknown) => boolean): boolean;
    /**
     * Creates a new array with all type specifications that pass the provided test function.
     *
     * @param {function(unknown): boolean} callback - Function to test each spec
     * @returns {Array<unknown>} New array with filtered specs
     */
    filter(callback: (arg0: unknown) => boolean): Array<unknown>;
    /**
     * Creates a new array populated with the results of calling the provided function on every spec.
     *
     * @param {function(unknown): unknown} callback - Function to call on each spec
     * @returns {Array<unknown>} New array with mapped values
     */
    map(callback: (arg0: unknown) => unknown): Array<unknown>;
    /**
     * Executes a reducer function on each spec, resulting in a single output value.
     *
     * @param {function(unknown, unknown): unknown} callback - Function to execute on each spec
     * @param {unknown} initialValue - Initial value for the accumulator
     * @returns {unknown} The final accumulated value
     */
    reduce(callback: (arg0: unknown, arg1: unknown) => unknown, initialValue: unknown): unknown;
    /**
     * Returns the first type specification that satisfies the provided testing function.
     *
     * @param {function(unknown): boolean} callback - Function to test each spec
     * @returns {object|undefined} The first spec that matches, or undefined
     */
    find(callback: (arg0: unknown) => boolean): object | undefined;
    /**
     * Tests whether a value matches any of the type specifications.
     * Handles array types, union types, and empty value validation.
     *
     * @param {unknown} value - The value to test against the type specifications
     * @param {object} options - Validation options
     * @param {boolean} options.allowEmpty - Whether empty values are allowed
     * @returns {boolean} True if the value matches any type specification
     */
    matches(value: unknown, options: {
        allowEmpty: boolean;
    }): boolean;
    match(value: any, options: any): unknown[];
    #private;
}
//# sourceMappingURL=TypeSpec.d.ts.map