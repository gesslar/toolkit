/**
 * @file Sass.js
 *
 * Defines the Sass class, a custom error type for toolkit compilation
 * errors.
 *
 * Supports error chaining, trace management, and formatted reporting for both
 * user-friendly and verbose (nerd) output.
 *
 * Used throughout the toolkit for structured error handling and
 * debugging.
 */
import BrowserSass from "../../browser/lib/Sass.js";
/**
 * Custom error class for toolkit errors.
 * Provides error chaining, trace management, and formatted error reporting.
 */
export default class Sass extends BrowserSass {
    #private;
    /**
     * Reports the error to the terminal with formatted output.
     * Optionally includes detailed stack trace information.
     *
     * @param {boolean} [nerdMode] - Whether to include detailed stack trace
     */
    report(nerdMode?: boolean): void;
}
//# sourceMappingURL=Sass.d.ts.map