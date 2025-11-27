/**
 * Utility class providing common helper functions for string manipulation,
 * timing, and option parsing.
 */
export default class Util {
    /**
     * Capitalizes the first letter of a string.
     *
     * @param {string} text - The text to capitalize
     * @returns {string} Text with first letter capitalized
     */
    static capitalize(text: string): string;
    /**
     * Measure wall-clock time for an async function.
     *
     * @template T
     * @param {() => Promise<T>} fn - Thunk returning a promise.
     * @returns {Promise<{result: T, cost: number}>} Object containing result and elapsed ms (number, 1 decimal).
     */
    static time<T>(fn: () => Promise<T>): Promise<{
        result: T;
        cost: number;
    }>;
    /**
     * Right-align a string inside a fixed width (left pad with spaces).
     * If the string exceeds width it is returned unchanged.
     *
     * @param {string|number} text - Text to align.
     * @param {number} width - Target field width (default 80).
     * @returns {string} Padded string.
     */
    static rightAlignText(text: string | number, width?: number): string;
    /**
     * Centre-align a string inside a fixed width (pad with spaces on left).
     * If the string exceeds width it is returned unchanged.
     *
     * @param {string|number} text - Text to align.
     * @param {number} width - Target field width (default 80).
     * @returns {string} Padded string with text centred.
     */
    static centreAlignText(text: string | number, width?: number): string;
    /**
     * Asynchronously awaits all promises in parallel.
     * Wrapper around Promise.all for consistency with other utility methods.
     *
     * @param {Array<Promise<unknown>>} promises - Array of promises to await
     * @returns {Promise<Array<unknown>>} Results of all promises
     */
    static awaitAll(promises: Array<Promise<unknown>>): Promise<Array<unknown>>;
    /**
     * Settles all promises (both fulfilled and rejected) in parallel.
     * Wrapper around Promise.allSettled for consistency with other utility methods.
     *
     * @param {Array<Promise<unknown>>} promises - Array of promises to settle
     * @returns {Promise<Array<object>>} Results of all settled promises with status and value/reason
     */
    static settleAll(promises: Array<Promise<unknown>>): Promise<Array<object>>;
    /**
     * Checks if any result in the settled promise array is rejected.
     *
     * @param {Array<object>} result - Array of settled promise results.
     * @returns {boolean} True if any result is rejected, false otherwise.
     */
    static anyRejected(result: Array<object>): boolean;
    /**
     * Filters and returns all rejected results from a settled promise array.
     *
     * @param {Array<object>} result - Array of settled promise results.
     * @returns {Array<object>} Array of rejected results.
     */
    static settledAndRejected(result: Array<object>): Array<object>;
    /**
     * Extracts the rejection reasons from an array of rejected promise results.
     *
     * @param {Array<object>} rejected - Array of rejected results.
     * @returns {Array<unknown>} Array of rejection reasons.
     */
    static rejectedReasons(rejected: Array<object>): Array<unknown>;
    /**
     * Throws a Sass error containing all rejection reasons from settled promises.
     *
     * @param {string} [_message] - Optional error message. Defaults to "GIGO"
     * @param {Array<object>} rejected - Array of rejected results.
     * @throws {Error} Throws a Sass error with rejection reasons.
     */
    static throwRejected(_message?: string, rejected: Array<object>): void;
    /**
     * Filters and returns all fulfilled results from a settled promise array.
     *
     * @param {Array<object>} result - Array of settled promise results.
     * @returns {Array<object>} Array of fulfilled results.
     */
    static settledAndFulfilled(result: Array<object>): Array<object>;
    /**
     * Extracts the values from all fulfilled results in a settled promise array.
     *
     * @param {Array<object>} result - Array of settled promise results.
     * @returns {Array<unknown>} Array of fulfilled values.
     */
    static fulfilledValues(result: Array<object>): Array<unknown>;
    /**
     * Returns the first promise to resolve or reject from an array of promises.
     * Wrapper around Promise.race for consistency with other utility methods.
     *
     * @param {Array<Promise<unknown>>} promises - Array of promises to race
     * @returns {Promise<unknown>} Result of the first settled promise
     */
    static race(promises: Array<Promise<unknown>>): Promise<unknown>;
    /**
     * Determine the Levenshtein distance between two string values
     *
     * @param {string} a The first value for comparison.
     * @param {string} b The second value for comparison.
     * @returns {number} The Levenshtein distance
     */
    static levenshteinDistance(a: string, b: string): number;
    /**
     * Determine the closest match between a string and allowed values
     * from the Levenshtein distance.
     *
     * @param {string} input The input string to resolve
     * @param {Array<string>} allowedValues The values which are permitted
     * @param {number} [threshold] Max edit distance for a "close match"
     * @returns {string} Suggested, probable match.
     */
    static findClosestMatch(input: string, allowedValues: Array<string>, threshold?: number): string;
    static regexify(input: any, trim?: boolean, flags?: any[]): RegExp;
}
//# sourceMappingURL=Util.d.ts.map