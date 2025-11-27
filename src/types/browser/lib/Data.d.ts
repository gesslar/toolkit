export default class Data {
    /**
     * Array of JavaScript primitive type names.
     * Includes basic types and object categories from the typeof operator.
     *
     * @type {Array<string>}
     */
    static primitives: Array<string>;
    /**
     * Array of JavaScript constructor names for built-in objects.
     * Includes common object types and typed arrays.
     *
     * @type {Array<string>}
     */
    static constructors: Array<string>;
    /**
     * Combined array of all supported data types (primitives and constructors in
     * lowercase).
     *
     * Used for type validation throughout the utility functions.
     *
     * @type {Array<string>}
     */
    static dataTypes: Array<string>;
    /**
     * Array of type names that can be checked for emptiness.
     * These types have meaningful empty states that can be tested.
     *
     * @type {Array<string>}
     */
    static emptyableTypes: Array<string>;
    /**
     * Appends a string to another string if it does not already end with it.
     *
     * @param {string} string - The string to append to
     * @param {string} append - The string to append
     * @returns {string} The appended string
     */
    static appendString(string: string, append: string): string;
    /**
     * Prepends a string to another string if it does not already start with it.
     *
     * @param {string} string - The string to prepend to
     * @param {string} prepend - The string to prepend
     * @returns {string} The prepended string
     */
    static prependString(string: string, prepend: string): string;
    /**
     * Creates a type spec from a string. A type spec is an array of objects
     * defining the type of a value and whether an array is expected.
     *
     * @param {string} string - The string to parse into a type spec.
     * @param {object} options - Additional options for parsing.
     * @returns {Array<object>} An array of type specs.
     */
    static newTypeSpec(string: string, options: object): Array<object>;
    /**
     * Checks if a value is of a specified type
     *
     * @param {unknown} value The value to check
     * @param {string|TypeSpec} type The type to check for
     * @param {object} options Additional options for checking
     * @returns {boolean} Whether the value is of the specified type
     */
    static isType(value: unknown, type: string | TypeSpec, options?: object): boolean;
    /**
     * Checks if a type is valid
     *
     * @param {string} type - The type to check
     * @returns {boolean} Whether the type is valid
     */
    static isValidType(type: string): boolean;
    /**
     * Checks if a value is of a specified type. Unlike the type function, this
     * function does not parse the type string, and only checks for primitive
     * or constructor types.
     *
     * @param {unknown} value - The value to check
     * @param {string} type - The type to check for
     * @returns {boolean} Whether the value is of the specified type
     */
    static isBaseType(value: unknown, type: string): boolean;
    /**
     * Returns the type of a value, whether it be a primitive, object, or function.
     *
     * @param {unknown} value - The value to check
     * @returns {string} The type of the value
     */
    static typeOf(value: unknown): string;
    /**
     * Checks a value is undefined or null.
     *
     * @param {unknown} value The value to check
     * @returns {boolean} Whether the value is undefined or null
     */
    static isNothing(value: unknown): boolean;
    /**
     * Checks if a value is empty. This function is used to check if an object,
     * array, or string is empty. Null and undefined values are considered empty.
     *
     * @param {unknown} value The value to check
     * @param {boolean} checkForNothing Whether to check for null or undefined
     *                                  values
     * @returns {boolean} Whether the value is empty
     */
    static isEmpty(value: unknown, checkForNothing?: boolean): boolean;
    /**
     * Freezes an object and all of its properties recursively.
     *
     * @param {object} obj The object to freeze.
     * @returns {object} The frozen object.
     */
    static deepFreezeObject(obj: object): object;
    /**
     * Ensures that a nested path of objects exists within the given object.
     * Creates empty objects along the path if they don't exist.
     *
     * @param {object} obj - The object to check/modify
     * @param {Array<string>} keys - Array of keys representing the path to ensure
     * @returns {object} Reference to the deepest nested object in the path
     */
    static assureObjectPath(obj: object, keys: Array<string>): object;
    /**
     * Sets a value in a nested object structure using an array of keys; creating
     * the structure if it does not exist.
     *
     * @param {object} obj - The target object to set the value in
     * @param {Array<string>} keys - Array of keys representing the path to the target property
     * @param {unknown} value - The value to set at the target location
     */
    static setNestedValue(obj: object, keys: Array<string>, value: unknown): void;
    /**
     * Deeply merges two or more objects. Arrays are replaced, not merged.
     *
     * @param {...object} sources - Objects to merge (left to right)
     * @returns {object} The merged object
     */
    static mergeObject(...sources: object[]): object;
    /**
     * Filters an array asynchronously using a predicate function.
     * Applies the predicate to all items in parallel and returns filtered results.
     *
     * @param {Array<unknown>} arr - The array to filter
     * @param {(value: unknown) => Promise<boolean>} predicate - Async predicate function that returns a promise resolving to boolean
     * @returns {Promise<Array<unknown>>} Promise resolving to the filtered array
     */
    static asyncFilter(arr: Array<unknown>, predicate: (value: unknown) => Promise<boolean>): Promise<Array<unknown>>;
    /**
     * Ensures a value is within a specified range.
     *
     * @param {number} val - The value to check.
     * @param {number} min - The minimum value.
     * @param {number} max - The maximum value.
     * @returns {number} The value, constrained within the range of `min` to `max`.
     */
    static clamp(val: number, min: number, max: number): number;
    /**
     * Checks if a value is within a specified range (inclusive).
     *
     * @param {number} val - The value to check.
     * @param {number} min - The minimum value (inclusive).
     * @param {number} max - The maximum value (inclusive).
     * @returns {boolean} True if the value is within the range, false otherwise.
     */
    static clamped(val: number, min: number, max: number): boolean;
    /**
     * Checks if a value is a plain object - created with object literals {},
     * new Object(), or Object.create(null).
     *
     * Distinguishes plain objects from objects created by custom constructors, built-ins,
     * or primitives. Plain objects only have Object.prototype or null in their prototype chain.
     *
     * @param {unknown} value - The value to check
     * @returns {boolean} True if the value is a plain object, false otherwise
     *
     * @example
     * isPlainObject({}) // true
     * isPlainObject(new Object()) // true
     * isPlainObject(Object.create(null)) // true
     * isPlainObject([]) // false
     * isPlainObject(new Date()) // false
     * isPlainObject(null) // false
     * isPlainObject("string") // false
     * isPlainObject(class Person{}) // false
     */
    static isPlainObject(value: unknown): boolean;
    /**
     * Checks if a value is binary data.
     * Returns true for ArrayBuffer, TypedArrays (Uint8Array, Int16Array, etc.),
     * Blob, and Node Buffer instances.
     *
     * @param {unknown} value - The value to check
     * @returns {boolean} True if the value is binary data, false otherwise
     * @example
     * Data.isBinary(new Uint8Array([1, 2, 3])) // true
     * Data.isBinary(new ArrayBuffer(10)) // true
     * Data.isBinary(Buffer.from('hello')) // true
     * Data.isBinary(new Blob(['text'])) // true
     * Data.isBinary('string') // false
     * Data.isBinary({}) // false
     * Data.isBinary(undefined) // false
     */
    static isBinary(value: unknown): boolean;
}
import TypeSpec from "./TypeSpec.js";
//# sourceMappingURL=Data.d.ts.map