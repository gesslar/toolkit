/**
 * @file Type specification and validation utilities.
 * Provides TypeSpec class for parsing and validating complex type specifications
 * including arrays, unions, and options.
 */
export type TypeMatchOptions = {
    /**
     * - Permit a spec of {@link Data.emptyableTypes} to be empty
     */
    allowEmpty?: boolean;
};
/**
 * Type specification class for parsing and validating complex type definitions.
 * Supports union types, array types, and validation options.
 */
export default class TypeSpec {
    #private;
    specs: any;
    length: any;
    stringRepresentation: string;
    /**
     * Creates a new TypeSpec instance.
     *
     * @param {string} string - The type specification string (e.g., "string|number", "object[]")
     */
    constructor(string: string);
    /**
     * Returns a string representation of the type specification.
     *
     * @returns {string} The type specification as a string (e.g., "string|number[]")
     */
    toString(): string;
    /**
     * Returns a JSON representation of the TypeSpec.
     *
     * @returns {unknown} Object containing specs, length, and string representation
     */
    toJSON(): unknown;
    /**
     * Executes a provided function once for each type specification.
     *
     * @param {function(unknown): void} callback - Function to execute for each spec
     */
    forEach(callback: Function): void;
    /**
     * Tests whether all type specifications pass the provided test function.
     *
     * @param {function(unknown): boolean} callback - Function to test each spec
     * @returns {boolean} True if all specs pass the test
     */
    every(callback: Function): boolean;
    /**
     * Tests whether at least one type specification passes the provided test function.
     *
     * @param {function(unknown): boolean} callback - Function to test each spec
     * @returns {boolean} True if at least one spec passes the test
     */
    some(callback: Function): boolean;
    /**
     * Creates a new array with all type specifications that pass the provided test function.
     *
     * @param {function(unknown): boolean} callback - Function to test each spec
     * @returns {Array<unknown>} New array with filtered specs
     */
    filter(callback: Function): Array<unknown>;
    /**
     * Creates a new array populated with the results of calling the provided function on every spec.
     *
     * @param {function(unknown): unknown} callback - Function to call on each spec
     * @returns {Array<unknown>} New array with mapped values
     */
    map(callback: Function): Array<unknown>;
    /**
     * Executes a reducer function on each spec, resulting in a single output value.
     *
     * @param {function(unknown, unknown): unknown} callback - Function to execute on each spec
     * @param {unknown} initialValue - Initial value for the accumulator
     * @returns {unknown} The final accumulated value
     */
    reduce(callback: Function, initialValue: unknown): unknown;
    /**
     * Returns the first type specification that satisfies the provided testing function.
     *
     * @param {function(unknown): boolean} callback - Function to test each spec
     * @returns {object|undefined} The first spec that matches, or undefined
     */
    find(callback: Function): object | undefined;
    /**
     * Tests whether a value matches any of the type specifications.
     * Handles array types, union types, and empty value validation.
     *
     * @param {unknown} value - The value to test against the type specifications
     * @param {TypeMatchOptions} [options] - Validation options
     * @returns {boolean} True if the value matches any type specification
     */
    matches(value: unknown, options?: TypeMatchOptions): boolean;
    /**
     * Options that can be passed to {@link TypeSpec.match}
     *
     * @typedef {object} TypeMatchOptions
     * @property {boolean} [allowEmpty=true] - Permit a spec of {@link Data.emptyableTypes} to be empty
     */
    /**
     * Returns matching type specifications for a value.
     *
     * @param {unknown} value - The value to test against the type specifications
     * @param {TypeMatchOptions} [options] - Validation options
     * @returns {Array<object>} Array of matching type specifications
     */
    match(value: unknown, { allowEmpty, }?: TypeMatchOptions): Array<object>;
    /**
     * Parses a type specification string into individual type specs.
     * Handles union types separated by delimiters and array notation.
     *
     * @private
     * @param {string} string - The type specification string to parse
     * @throws {Sass} If the type specification is invalid
     */
    private #parse;
}
//# sourceMappingURL=TypeSpec.d.ts.map