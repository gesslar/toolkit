import Sass from "./Sass.js"
import Valid from "./Valid.js"
/**
 * Utility class for timing operations and promise-based delays.
 * Provides methods for creating cancellable timeout promises.
 */
export default class Time {
  /**
   * Creates a promise that resolves after a specified delay.
   * The returned promise includes a timerId property that can be used with cancel().
   *
   * @param {number} delay - Delay in milliseconds before resolving (must be >= 0)
   * @param {unknown} [value] - Optional value to resolve with after the delay
   * @returns {Promise<unknown> & {timerId: number}} Promise that resolves with the value after delay, extended with timerId property
   * @throws {Sass} If delay is not a number or is negative
   * @example
   * // Wait 1 second then continue
   * await Time.after(1000)
   *
   * // Wait 1 second then get a value
   * const result = await Time.after(1000, 'done')
   *
   * // Create a cancellable delay
   * const promise = Time.after(5000, 'data')
   * Time.cancel(promise) // Cancel before it resolves
   */
  static after(delay, value) {
    Valid.type(delay, "Number", "delay")
    Valid.assert(delay >= 0, "delay must be non-negative", delay)

    let timerId
    const promise = new Promise(resolve => {
      // Cap at max 32-bit signed integer to avoid Node.js timeout overflow warning
      const safeDelay = Math.min(delay, 2147483647)
      timerId = setTimeout(() => resolve(value), safeDelay)
    })
    promise.timerId = timerId

    return promise
  }

  /**
   * Cancels a promise created by Time.after() by clearing its timeout.
   * If the promise has already resolved or is not a Time.after() promise, this is a no-op.
   *
   * @param {Promise<unknown> & {timerId?: number}} promise - Promise returned from Time.after() to cancel
   * @returns {void}
   * @example
   * const promise = Time.after(5000, 'data')
   * Time.cancel(promise) // Prevents the promise from resolving
   */
  static cancel(promise) {
    if(promise && typeof promise === "object" && "timerId" in promise)
      clearTimeout(promise.timerId)
  }
}
