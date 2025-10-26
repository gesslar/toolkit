/**
 * Validation utility class providing type checking and assertion methods.
 */
export default class Valid {
    /**
     * Validates a value against a type. Uses Data.isType.
     *
     * @param {unknown} value - The value to validate
     * @param {string} type - The expected type in the form of "object", "object[]", "object|object[]"
     * @param {object} [options] - Additional options for validation.
     */
    static type(value: unknown, type: string, options?: object): void;
    /**
     * Asserts a condition
     *
     * @param {boolean} condition - The condition to assert
     * @param {string} message - The message to display if the condition is not
     *                           met
     * @param {number} [arg] - The argument to display if the condition is not
     *                         met (optional)
     */
    static assert(condition: boolean, message: string, arg?: number): void;
    static "__#private@#restrictedProto": string[];
    /**
     * Protects against prototype pollution by checking keys for dangerous property names.
     * Throws if any restricted prototype properties are found in the keys array.
     *
     * @param {Array<string>} keys - Array of property keys to validate
     * @throws {Sass} If any key matches restricted prototype properties (__proto__, constructor, prototype)
     */
    static prototypePollutionProtection(keys: Array<string>): void;
}
//# sourceMappingURL=Valid.d.ts.map