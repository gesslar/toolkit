/**
 * Utility class for collection operations.
 * Provides static methods for working with arrays, objects, sets, and maps.
 */
export default class Collection {
    /**
     * Evaluates an array with a predicate function, optionally in reverse order.
     * Returns the first truthy result from the predicate.
     *
     * @param {Array<unknown>} collection - The array to evaluate
     * @param {(value: unknown, index: number, array: Array<unknown>) => unknown} predicate - Function to evaluate each element
     * @param {boolean} [forward] - Whether to iterate forward (true) or backward (false). Defaults to true
     * @returns {unknown|undefined} The first truthy result from the predicate, or undefined
     * @throws {Sass} If collection is not an array or predicate is not a function
     */
    static evalArray(collection: Array<unknown>, predicate: (value: unknown, index: number, array: Array<unknown>) => unknown, forward?: boolean): unknown | undefined;
    /**
     * Evaluates an object with a predicate function.
     * Returns the first truthy result from the predicate.
     *
     * @param {object} collection - The object to evaluate
     * @param {(value: unknown, key: string, object: object) => unknown} predicate - Function to evaluate each property
     * @returns {unknown|undefined} The first truthy result from the predicate, or undefined
     * @throws {Sass} If collection is not an object or predicate is not a function
     */
    static evalObject(collection: object, predicate: (value: unknown, key: string, object: object) => unknown): unknown | undefined;
    /**
     * Evaluates a Set with a predicate function.
     * Returns the first truthy result from the predicate.
     *
     * @param {Set<unknown>} collection - The Set to evaluate
     * @param {(value: unknown, set: Set<unknown>) => unknown} predicate - Function to evaluate each element
     * @returns {unknown|undefined} The first truthy result from the predicate, or undefined
     * @throws {Sass} If collection is not a Set or predicate is not a function
     */
    static evalSet(collection: Set<unknown>, predicate: (value: unknown, set: Set<unknown>) => unknown): unknown | undefined;
    /**
     * Evaluates a Map with a predicate function, optionally in reverse order.
     * Returns the first truthy result from the predicate.
     *
     * @param {Map<unknown, unknown>} collection - The Map to evaluate
     * @param {(value: unknown, key: unknown, map: Map<unknown, unknown>) => unknown} predicate - Function to evaluate each entry
     * @param {boolean} [forward] - Whether to iterate forward (true) or backward (false). Defaults to true
     * @returns {unknown|undefined} The first truthy result from the predicate, or undefined
     * @throws {Sass} If collection is not a Map or predicate is not a function
     */
    static evalMap(collection: Map<unknown, unknown>, predicate: (value: unknown, key: unknown, map: Map<unknown, unknown>) => unknown, forward?: boolean): unknown | undefined;
    /**
     * Zips two arrays together into an array of pairs.
     * The resulting array length equals the shorter input array.
     *
     * @param {Array<unknown>} array1 - The first array
     * @param {Array<unknown>} array2 - The second array
     * @returns {Array<[unknown, unknown]>} Array of paired elements
     */
    static zip(array1: Array<unknown>, array2: Array<unknown>): Array<[unknown, unknown]>;
    /**
     * Unzips an array of pairs into separate arrays.
     * Transposes a 2D array structure.
     *
     * @param {Array<Array<unknown>>} array - Array of arrays to unzip
     * @returns {Array<Array<unknown>>} Array of unzipped arrays, or empty array for invalid input
     */
    static unzip(array: Array<Array<unknown>>): Array<Array<unknown>>;
    /**
     * Maps an array using an async function, processing items sequentially.
     * Unlike Promise.all(array.map()), this processes one item at a time.
     *
     * @param {Array<unknown>} array - The array to map
     * @param {(item: unknown) => Promise<unknown>} asyncFn - Async function to apply to each element
     * @returns {Promise<Array<unknown>>} Promise resolving to the mapped array
     * @throws {Sass} If array is not an Array or asyncFn is not a function
     */
    static asyncMap(array: Array<unknown>, asyncFn: (item: unknown) => Promise<unknown>): Promise<Array<unknown>>;
    /**
     * Checks if all elements in an array are of a specified type
     *
     * @param {Array<unknown>} arr - The array to check
     * @param {string} [type] - The type to check for (optional, defaults to the type of the first element)
     * @returns {boolean} Whether all elements are of the specified type
     */
    static isArrayUniform(arr: Array<unknown>, type?: string): boolean;
    /**
     * Checks if an array is unique
     *
     * @param {Array<unknown>} arr - The array of which to remove duplicates
     * @returns {Array<unknown>} The unique elements of the array
     */
    static isArrayUnique(arr: Array<unknown>): Array<unknown>;
    /**
     * Returns the intersection of two arrays.
     *
     * @param {Array<unknown>} arr1 - The first array.
     * @param {Array<unknown>} arr2 - The second array.
     * @returns {Array<unknown>} The intersection of the two arrays.
     */
    static intersection(arr1: Array<unknown>, arr2: Array<unknown>): Array<unknown>;
    /**
     * Checks whether two arrays have any elements in common.
     *
     * This function returns `true` if at least one element from `arr1` exists in
     * `arr2`, and `false` otherwise. It optimizes by iterating over the shorter
     * array for efficiency.
     *
     * Example:
     *   Collection.intersects([1, 2, 3], [3, 4, 5]) // returns true
     *   Collection.intersects(["a", "b"], ["c", "d"]) // returns false
     *
     * @param {Array<unknown>} arr1 - The first array to check for intersection.
     * @param {Array<unknown>} arr2 - The second array to check for intersection.
     * @returns {boolean} True if any element is shared between the arrays, false otherwise.
     */
    static intersects(arr1: Array<unknown>, arr2: Array<unknown>): boolean;
    /**
     * Pads an array to a specified length with a value. This operation
     * occurs in-place.
     *
     * @param {Array<unknown>} arr - The array to pad.
     * @param {number} length - The length to pad the array to.
     * @param {unknown} value - The value to pad the array with.
     * @param {number} [position] - The position to pad the array at. Defaults to 0
     * @returns {Array<unknown>} The padded array.
     */
    static arrayPad(arr: Array<unknown>, length: number, value: unknown, position?: number): Array<unknown>;
    /**
     * Filters an array asynchronously using a predicate function.
     * Applies the predicate to all items in parallel and returns filtered results.
     *
     * @param {Array<unknown>} arr - The array to filter
     * @param {(value: unknown, index: number, array: Array<unknown>) => Promise<boolean>} predicate - Async predicate function that returns a promise resolving to boolean
     * @returns {Promise<Array<unknown>>} Promise resolving to the filtered array
     */
    static asyncFilter(arr: Array<unknown>, predicate: (value: unknown, index: number, array: Array<unknown>) => Promise<boolean>): Promise<Array<unknown>>;
    /**
     * Clones an object
     *
     * @param {object} obj - The object to clone
     * @param {boolean} freeze - Whether to freeze the cloned object
     * @returns {object} The cloned object
     */
    static cloneObject(obj: object, freeze?: boolean): object;
    /**
     * Checks if an object is empty
     *
     * @param {object} obj - The object to check
     * @returns {boolean} Whether the object is empty
     */
    static isObjectEmpty(obj: object): boolean;
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
     * Freezes an object and all of its properties recursively.
     *
     * @param {object} obj The object to freeze.
     * @returns {object} The frozen object.
     */
    static deepFreezeObject(obj: object): object;
    /**
     * Maps an object using a transformer function
     *
     * @param {object} original The original object
     * @param {function(unknown): unknown} transformer The transformer function
     * @param {boolean} mutate Whether to mutate the original object
     * @returns {Promise<object>} The mapped object
     */
    static mapObject(original: object, transformer: (arg0: unknown) => unknown, mutate?: boolean): Promise<object>;
    /**
     * Allocates an object from a source array and a spec array or function.
     *
     * @param {unknown} source The source array
     * @param {Array<unknown>|function(Array<unknown>): Promise<Array<unknown>>|Array<unknown>} spec The spec array or function
     * @returns {Promise<object>} The allocated object
     */
    static allocateObject(source: unknown, spec: Array<unknown> | ((arg0: Array<unknown>) => Promise<Array<unknown>> | Array<unknown>)): Promise<object>;
    /**
     * Trims falsy values from both ends of an array (in-place).
     * Optionally preserves specific falsy values.
     *
     * @param {Array<unknown>} arr - The array to trim
     * @param {Array<unknown>} [except] - Values to preserve even if falsy. Defaults to empty array
     * @returns {Array<unknown>} The trimmed array (same reference, modified in-place)
     * @throws {Sass} If arr is not an Array or except is not an Array
     */
    static trimArray(arr: Array<unknown>, except?: Array<unknown>): Array<unknown>;
    /**
     * Trims falsy values from the right end of an array (in-place).
     * Optionally preserves specific falsy values.
     *
     * @param {Array<unknown>} arr - The array to trim
     * @param {Array<unknown>} [except] - Values to preserve even if falsy. Defaults to empty array
     * @returns {Array<unknown>} The trimmed array (same reference, modified in-place)
     * @throws {Sass} If arr is not an Array or except is not an Array
     */
    static trimArrayRight(arr: Array<unknown>, except?: Array<unknown>): Array<unknown>;
    /**
     * Trims falsy values from the left end of an array (in-place).
     * Optionally preserves specific falsy values.
     *
     * @param {Array<unknown>} arr - The array to trim
     * @param {Array<unknown>} [except] - Values to preserve even if falsy. Defaults to empty array
     * @returns {Array<unknown>} The trimmed array (same reference, modified in-place)
     * @throws {Sass} If arr is not an Array or except is not an Array
     */
    static trimArrayLeft(arr: Array<unknown>, except?: Array<unknown>): Array<unknown>;
    /**
     * Transposes an array of objects into an object of arrays.
     * Collects values for each key across all objects into arrays.
     *
     * @param {Array<object>} objects - Array of plain objects to transpose
     * @returns {object} Object with keys from input objects, values as arrays
     * @throws {Sass} If objects is not an Array or contains non-plain objects
     */
    static transposeObjects(objects: Array<object>): object;
    /**
     * Flattens an array (or nested array) of objects and transposes them.
     * Combines flat() and transposeObjects() operations.
     *
     * @param {Array<object>|Array<Array<object>>} input - Array or nested array of objects
     * @returns {object} Transposed object with arrays of values
     */
    static flattenObjectArray(input: Array<object> | Array<Array<object>>): object;
}
//# sourceMappingURL=Collection.d.ts.map