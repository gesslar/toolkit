import Data from "./Data.js"
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
   * @param {unknown} [value] - Optional value to resolve with, or a function to invoke after the delay
   * @returns {Promise<unknown> & {timerId: number}} Promise that resolves with the value (or function result) after delay, extended with timerId property
   * @throws {Sass} If delay is not a number or is negative
   * @example
   * // Wait 1 second then continue
   * await Time.after(1000)
   *
   * // Debounce: only apply the latest input after the user stops typing
   * let pending = null
   * function onInput(text) {
   *   Time.cancel(pending) // cancel() is a no-op if not a valid Time promise.
   *   pending = Time.after(300, () => applySearch(text))
   * }
   *
   * // Timeout a fetch request
   * const result = await Promise.race([
   *   fetch("/api/data"),
   *   Time.after(5000, () => { throw new Error("Request timed out") })
   * ])
   *
   * // Cancellable delay
   * const promise = Time.after(5000, "data")
   * Time.cancel(promise) // Prevents resolution
   */
  static after(delay, value) {
    Valid.type(delay, "Number", "delay")
    Valid.assert(delay >= 0, "delay must be non-negative", delay)

    let timerId
    const promise = new Promise(resolve => {
      // Cap at max 32-bit signed integer to avoid Node.js timeout overflow warning
      const safeDelay = Math.min(delay, 2147483647)
      timerId = setTimeout(() => resolve(Data.isType(value, "Function") ? value() : value), safeDelay)
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
