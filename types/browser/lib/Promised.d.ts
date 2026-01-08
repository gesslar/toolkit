/**
 * Utility class providing helper functions for working with Promises,
 * including settling, filtering, and extracting values from promise results.
 */
export default class Promised {
    /**
     * Asynchronously awaits all promises in parallel.
     * Wrapper around Promise.all for consistency with other utility methods.
     *
     * @param {Array<Promise<unknown>>} promises - Array of promises to await
     * @returns {Promise<Array<unknown>>} Results of all promises
     */
    static await(promises: Array<Promise<unknown>>): Promise<Array<unknown>>;
    /**
     * Returns the first promise to resolve or reject from an array of promises.
     * Wrapper around Promise.race for consistency with other utility methods.
     *
     * @param {Array<Promise<unknown>>} promises - Array of promises to race
     * @returns {Promise<unknown>} Result of the first settled promise
     */
    static race(promises: Array<Promise<unknown>>): Promise<unknown>;
    /**
     * Settles all promises (both fulfilled and rejected) in parallel.
     * Wrapper around Promise.allSettled for consistency with other utility methods.
     *
     * @param {Array<Promise<unknown>>} promises - Array of promises to settle
     * @returns {Promise<Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>>} Results of all settled promises with status and value/reason
     */
    static settle(promises: Array<Promise<unknown>>): Promise<Array<{
        status: "fulfilled" | "rejected";
        value?: unknown;
        reason?: unknown;
    }>>;
    /**
     * Checks if any result in the settled promise array is rejected.
     *
     * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
     * @returns {boolean} True if any result is rejected, false otherwise
     */
    static hasRejected(settled: Array<{
        status: "fulfilled" | "rejected";
        value?: unknown;
        reason?: unknown;
    }>): boolean;
    /**
     * Checks if any result in the settled promise array is fulfilled.
     *
     * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
     * @returns {boolean} True if any result is fulfilled, false otherwise
     */
    static hasFulfilled(settled: Array<{
        status: "fulfilled" | "rejected";
        value?: unknown;
        reason?: unknown;
    }>): boolean;
    /**
     * Filters and returns all rejected results from a settled promise array.
     *
     * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
     * @returns {Array<{status: 'rejected', reason: unknown}>} Array of rejected results
     */
    static rejected(settled: Array<{
        status: "fulfilled" | "rejected";
        value?: unknown;
        reason?: unknown;
    }>): Array<{
        status: "rejected";
        reason: unknown;
    }>;
    /**
     * Filters and returns all fulfilled results from a settled promise array.
     *
     * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} result - Array of settled promise results
     * @returns {Array<{status: 'fulfilled', value: unknown}>} Array of fulfilled results
     */
    static fulfilled(result: Array<{
        status: "fulfilled" | "rejected";
        value?: unknown;
        reason?: unknown;
    }>): Array<{
        status: "fulfilled";
        value: unknown;
    }>;
    /**
     * Extracts the rejection reasons from a settled promise array.
     *
     * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
     * @returns {Array<unknown>} Array of rejection reasons
     */
    static reasons(settled: Array<{
        status: "fulfilled" | "rejected";
        value?: unknown;
        reason?: unknown;
    }>): Array<unknown>;
    /**
     * Extracts the values from fulfilled results in a settled promise array.
     *
     * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
     * @returns {Array<unknown>} Array of fulfilled values
     */
    static values(settled: Array<{
        status: "fulfilled" | "rejected";
        value?: unknown;
        reason?: unknown;
    }>): Array<unknown>;
    /**
     * Throws a Tantrum containing all rejection reasons from settled promises.
     *
     * @param {string} message - Error message. Defaults to "GIGO"
     * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
     * @throws {Tantrum} Throws a Tantrum error with rejection reasons
     */
    static throw(message: string, settled: Array<{
        status: "fulfilled" | "rejected";
        value?: unknown;
        reason?: unknown;
    }>): void;
}
//# sourceMappingURL=Promised.d.ts.map