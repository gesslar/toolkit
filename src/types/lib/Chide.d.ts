/**
 * Custom error class for toolkit errors.
 * Provides error chaining, trace management, and formatted error reporting.
 */
export default class Chide extends Sass {
    /**
     * Creates an Chide from an existing Error object with additional
     * trace message.
     *
     * @param {Error} error - The original error object
     * @param {string} message - Additional trace message to add
     * @returns {Chide} New Chide instance with trace from the original error
     * @throws {Chide} If the first parameter is not an Error instance
     */
    static from(error: Error, message: string): Chide;
    /**
     * Factory method to create or enhance Sass instances.
     * If error parameter is provided, enhances existing Sass or wraps
     * other errors. Otherwise creates a new Sass instance.
     *
     * @param {string} message - The error message
     * @param {Error|Sass|Tantrum|Chide} [error] - Optional existing error to wrap or enhance
     * @returns {Chide} New or enhanced Sass instance
     */
    static "new"(message: string, error?: Error | Sass | Tantrum | Chide): Chide;
    /**
     * Adds a trace message and returns this instance for chaining.
     *
     * @param {string} message - The trace message to add
     * @returns {this} This Chide instance for method chaining
     */
    addTrace(message: string): this;
    #private;
}
import Sass from "./Sass.js";
import Tantrum from "./Tantrum.js";
//# sourceMappingURL=Chide.d.ts.map