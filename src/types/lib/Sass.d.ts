/**
 * Custom error class for toolkit errors.
 * Provides error chaining, trace management, and formatted error reporting.
 */
export default class Sass extends Error {
    /**
     * Creates an Sass from an existing Error object with additional
     * trace message.
     *
     * @param {Error} error - The original error object
     * @param {string} message - Additional trace message to add
     * @returns {Sass} New Sass instance with trace from the original error
     * @throws {Sass} If the first parameter is not an Error instance
     */
    static from(error: Error, message: string): Sass;
    /**
     * Factory method to create or enhance Sass instances.
     * If error parameter is provided, enhances existing Sass or wraps
     * other errors. Otherwise creates a new Sass instance.
     *
     * @param {string} message - The error message
     * @param {Error|Sass|Tantrum} [error] - Optional existing error to wrap or enhance
     * @returns {Sass} New or enhanced Sass instance
     */
    static "new"(message: string, error?: Error | Sass | Tantrum): Sass;
    /**
     * Creates a new Sass instance.
     *
     * @param {string} message - The error message
     * @param {...unknown} [arg] - Additional arguments passed to parent Error constructor
     */
    constructor(message: string, ...arg?: unknown[]);
    /**
     * Adds a message to the beginning of the trace array.
     *
     * @param {string} message - The trace message to add
     */
    set trace(message: string);
    /**
     * Gets the error trace array.
     *
     * @returns {Array<string>} Array of trace messages
     */
    get trace(): Array<string>;
    /**
     * Adds a trace message and returns this instance for chaining.
     *
     * @param {string} message - The trace message to add
     * @returns {this} This Sass instance for method chaining
     */
    addTrace(message: string): this;
    /**
     * Reports the error to the terminal with formatted output.
     * Optionally includes detailed stack trace information.
     *
     * @param {boolean} [nerdMode] - Whether to include detailed stack trace
     */
    report(nerdMode?: boolean): void;
    #private;
}
import Tantrum from "./Tantrum.js";
//# sourceMappingURL=Sass.d.ts.map