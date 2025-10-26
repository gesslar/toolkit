/**
 * Custom aggregate error class that extends AggregateError.
 * Automatically wraps plain errors in Sass instances for consistent reporting.
 */
export default class Tantrum extends AggregateError {
    /**
     * Factory method to create a Tantrum instance.
     *
     * @param {string} message - The aggregate error message
     * @param {Array<Error|Sass>} errors - Array of errors to aggregate
     * @returns {Tantrum} New Tantrum instance
     */
    static "new"(message: string, errors?: Array<Error | Sass>): Tantrum;
    /**
     * Creates a new Tantrum instance.
     *
     * @param {string} message - The aggregate error message
     * @param {Array<Error|Sass>} errors - Array of errors to aggregate
     */
    constructor(message: string, errors?: Array<Error | Sass>);
    /**
     * Adds a trace message and returns this instance for chaining.
     *
     * @param {string} message - The trace message to add
     * @param {Error|Sass} [_error] - Optional error (currently unused, reserved for future use)
     * @returns {this} This Tantrum instance for method chaining
     */
    addTrace(message: string, _error?: Error | Sass): this;
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
     * Reports all aggregated errors to the terminal with formatted output.
     *
     * @param {boolean} [nerdMode] - Whether to include detailed stack traces
     */
    report(nerdMode?: boolean): void;
    #private;
}
import Sass from "./Sass.js";
//# sourceMappingURL=Tantrum.d.ts.map