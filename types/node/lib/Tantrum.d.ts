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
import BrowserTantrum from "../../browser/lib/Tantrum.js";
/**
 * Custom aggregate error class that extends AggregateError.
 * Automatically wraps plain errors in Sass instances for consistent reporting.
 */
export default class Tantrum extends BrowserTantrum {
    constructor(message: any, errors?: any[]);
    /**
     * Reports all aggregated errors to the terminal with formatted output.
     *
     * @param {boolean} [nerdMode] - Whether to include detailed stack traces
     * @param {boolean} [isNested] - Whether this is a nested error report
     */
    report(nerdMode?: boolean, isNested?: boolean): void;
}
//# sourceMappingURL=Tantrum.d.ts.map