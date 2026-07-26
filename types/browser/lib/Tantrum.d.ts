/**
 * @file Tantrum.js
 *
 * Defines the Tantrum class, a custom AggregateError type for toolkit
 * that collects multiple errors with Sass-style reporting.
 *
 * Auto-wraps plain Error objects in Sass instances while preserving
 * existing Sass errors, providing consistent formatted output for
 * multiple error scenarios.
 */
import Sass from "./Sass.js";
/**
 * Custom aggregate error class that extends AggregateError.
 * Automatically wraps plain errors in Sass instances for consistent reporting.
 */
export default class Tantrum extends AggregateError {
    #private;
    /**
     * Creates a new Tantrum instance.
     *
     * @param {string} message - The aggregate error message
     * @param {Array<Error|Sass>} errors - Array of errors to aggregate
     * @param {Sass} sass - Sass constructor
     */
    constructor(message: string, errors?: Array<Error | Sass>, sass?: Sass);
    /**
     * Adds a trace message and returns this instance for chaining.
     *
     * @param {string} message - The trace message to add
     * @param {Error|Sass} [_error] - Optional error (currently unused, reserved for future use)
     * @returns {this} This Tantrum instance for method chaining
     */
    addTrace(message: string, _error?: Error | Sass): this;
    /**
     * Gets the error trace array.
     *
     * @returns {Array<string>} Array of trace messages
     */
    get trace(): Array<string>;
    /**
     * Adds a message to the beginning of the trace array.
     *
     * @param {string} message - The trace message to add
     */
    set trace(message: string);
    /**
     * Reports all aggregated errors to the console with formatted output.
     *
     * @param {boolean} [nerdMode] - Whether to include detailed stack traces
     * @param {boolean} [isNested] - Whether this is a nested error report
     */
    report(nerdMode?: boolean, isNested?: boolean): void;
    /**
     * Factory method to create a Tantrum instance.
     *
     * @param {string} message - The aggregate error message
     * @param {Array<Error|Sass>} errors - Array of errors to aggregate
     * @returns {Tantrum} New Tantrum instance
     */
    static new(message: string, errors?: Array<Error | Sass>): Tantrum;
}
//# sourceMappingURL=Tantrum.d.ts.map