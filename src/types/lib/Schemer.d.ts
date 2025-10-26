/**
 * Schemer provides utilities for compiling and validating JSON schemas using AJV.
 *
 * Usage:
 *   - Use Schemer.fromFile(file, options) to create a validator from a file.
 *   - Use Schemer.from(schemaData, options) to create a validator from a schema object.
 *   - Use Schemer.getValidator(schema, options) to get a raw AJV validator function.
 *   - Use Schemer.reportValidationErrors(errors) to format AJV validation errors.
 */
export default class Schemer {
    static fromFile(file: any, options?: {}): Promise<(data: unknown) => boolean>;
    static from(schemaData?: {}, options?: {}): Promise<(data: unknown) => boolean>;
    /**
     * Creates a validator function from a schema object
     *
     * @param {object} schema - The schema to compile
     * @param {object} [options] - AJV options
     * @returns {(data: unknown) => boolean} The AJV validator function, which may have additional properties (e.g., `.errors`)
     */
    static getValidator(schema: object, options?: object): (data: unknown) => boolean;
    static reportValidationErrors(errors: any): any;
}
//# sourceMappingURL=Schemer.d.ts.map