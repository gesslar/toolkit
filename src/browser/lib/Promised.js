import Tantrum from "./Tantrum.js"
import Valid from "./Valid.js"

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
  static async await(promises) {
    Valid.type(promises, "Promise[]")

    return await Promise.all(promises)
  }

  /**
   * Returns the first promise to resolve or reject from an array of promises.
   * Wrapper around Promise.race for consistency with other utility methods.
   *
   * @param {Array<Promise<unknown>>} promises - Array of promises to race
   * @returns {Promise<unknown>} Result of the first settled promise
   */
  static async race(promises) {
    Valid.type(promises, "Promise[]")

    return await Promise.race(promises)
  }

  /**
   * Settles all promises (both fulfilled and rejected) in parallel.
   * Wrapper around Promise.allSettled for consistency with other utility methods.
   *
   * @param {Array<Promise<unknown>>} promises - Array of promises to settle
   * @returns {Promise<Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>>} Results of all settled promises with status and value/reason
   */
  static async settle(promises) {
    Valid.type(promises, "Promise[]")

    return await Promise.allSettled(promises)
  }

  /**
   * Checks if any result in the settled promise array is rejected.
   *
   * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
   * @returns {boolean} True if any result is rejected, false otherwise
   */
  static hasRejected(settled) {
    return settled.some(r => r.status === "rejected")
  }

  /**
   * Checks if any result in the settled promise array is fulfilled.
   *
   * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
   * @returns {boolean} True if any result is fulfilled, false otherwise
   */
  static hasFulfilled(settled) {
    return settled.some(r => r.status === "fulfilled")
  }

  /**
   * Filters and returns all rejected results from a settled promise array.
   *
   * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
   * @returns {Array<{status: 'rejected', reason: unknown}>} Array of rejected results
   */
  static rejected(settled) {
    return settled.filter(r => r.status === "rejected")
  }

  /**
   * Filters and returns all fulfilled results from a settled promise array.
   *
   * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} result - Array of settled promise results
   * @returns {Array<{status: 'fulfilled', value: unknown}>} Array of fulfilled results
   */
  static fulfilled(result) {
    return result.filter(r => r.status === "fulfilled")
  }

  /**
   * Extracts the rejection reasons from a settled promise array.
   *
   * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
   * @returns {Array<unknown>} Array of rejection reasons
   */
  static reasons(settled) {
    const rejected = this.rejected(settled)
    const reasons = rejected.map(e => e.reason)

    return reasons
  }

  /**
   * Extracts the values from fulfilled results in a settled promise array.
   *
   * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
   * @returns {Array<unknown>} Array of fulfilled values
   */
  static values(settled) {
    const fulfilled = this.fulfilled(settled)
    const values = fulfilled.map(e => e.value)

    return values
  }

  /**
   * Throws a Tantrum containing all rejection reasons from settled promises.
   *
   * @param {string} message - Error message. Defaults to "GIGO"
   * @param {Array<{status: 'fulfilled'|'rejected', value?: unknown, reason?: unknown}>} settled - Array of settled promise results
   * @throws {Tantrum} Throws a Tantrum error with rejection reasons
   */
  static throw(message="GIGO", settled) {
    Valid.type(message, "String", {allowEmpty: false})
    Valid.type(settled, "Array")

    const rejected = this.rejected(settled)
    const reasons = this.reasons(rejected)

    throw Tantrum.new(message, reasons)
  }
}
