/**
 * Custom error class for toolkit errors.
 * Provides error chaining, trace management, and formatted error reporting.
 */
export default class Sass extends BrowserSass {
    /**
     * Reports the error to the terminal with formatted output.
     * Optionally includes detailed stack trace information.
     *
     * @param {boolean} [nerdMode] - Whether to include detailed stack trace
     */
    report(nerdMode?: boolean): void;
    #private;
}
import BrowserSass from "../../browser/lib/Sass.js";
//# sourceMappingURL=Sass.d.ts.map