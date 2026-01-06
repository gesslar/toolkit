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