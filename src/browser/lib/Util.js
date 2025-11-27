import Sass from "./Sass.js"
import Valid from "./Valid.js"
import Collection from "./Collection.js"

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
  static capitalize(text) {
    if(typeof text !== "string")
      throw new TypeError("Util.capitalize expects a string")

    if(text.length === 0)
      return ""

    const [first, ...rest] = Array.from(text)

    return `${first.toLocaleUpperCase()}${rest.join("")}`
  }

  /**
   * Measure wall-clock time for an async function.
   *
   * @template T
   * @param {() => Promise<T>} fn - Thunk returning a promise.
   * @returns {Promise<{result: T, cost: number}>} Object containing result and elapsed ms (number, 1 decimal).
   */
  static async time(fn) {
    const t0 = performance.now()
    const result = await fn()
    const cost = Math.round((performance.now() - t0) * 10) / 10

    return {result, cost}
  }

  /**
   * Right-align a string inside a fixed width (left pad with spaces).
   * If the string exceeds width it is returned unchanged.
   *
   * @param {string|number} text - Text to align.
   * @param {number} width - Target field width (default 80).
   * @returns {string} Padded string.
   */
  static rightAlignText(text, width=80) {
    const work = String(text)

    if(work.length > width)
      return work

    const diff = width-work.length

    return `${" ".repeat(diff)}${work}`
  }

  /**
   * Centre-align a string inside a fixed width (pad with spaces on left).
   * If the string exceeds width it is returned unchanged.
   *
   * @param {string|number} text - Text to align.
   * @param {number} width - Target field width (default 80).
   * @returns {string} Padded string with text centred.
   */
  static centreAlignText(text, width=80) {
    const work = String(text)

    if(work.length >= width)
      return work

    const totalPadding = width - work.length
    const leftPadding = Math.floor(totalPadding / 2)
    const rightPadding = totalPadding - leftPadding

    return `${" ".repeat(leftPadding)}${work}${" ".repeat(rightPadding)}`
  }

  /**
   * Asynchronously awaits all promises in parallel.
   * Wrapper around Promise.all for consistency with other utility methods.
   *
   * @param {Array<Promise<unknown>>} promises - Array of promises to await
   * @returns {Promise<Array<unknown>>} Results of all promises
   */
  static async awaitAll(promises) {
    return await Promise.all(promises)
  }

  /**
   * Settles all promises (both fulfilled and rejected) in parallel.
   * Wrapper around Promise.allSettled for consistency with other utility methods.
   *
   * @param {Array<Promise<unknown>>} promises - Array of promises to settle
   * @returns {Promise<Array<object>>} Results of all settled promises with status and value/reason
   */
  static async settleAll(promises) {
    return await Promise.allSettled(promises)
  }

  /**
   * Checks if any result in the settled promise array is rejected.
   *
   * @param {Array<object>} result - Array of settled promise results.
   * @returns {boolean} True if any result is rejected, false otherwise.
   */
  static anyRejected(result) {
    return result.some(r => r.status === "rejected")
  }

  /**
   * Filters and returns all rejected results from a settled promise array.
   *
   * @param {Array<object>} result - Array of settled promise results.
   * @returns {Array<object>} Array of rejected results.
   */
  static settledAndRejected(result) {
    return result.filter(r => r.status === "rejected")
  }

  /**
   * Extracts the rejection reasons from an array of rejected promise results.
   *
   * @param {Array<object>} rejected - Array of rejected results.
   * @returns {Array<unknown>} Array of rejection reasons.
   */
  static rejectedReasons(rejected) {
    return rejected.map(r => r.reason)
  }

  /**
   * Throws a Sass error containing all rejection reasons from settled promises.
   *
   * @param {string} [_message] - Optional error message. Defaults to "GIGO"
   * @param {Array<object>} rejected - Array of rejected results.
   * @throws {Error} Throws a Sass error with rejection reasons.
   */
  static throwRejected(_message="GIGO", rejected) {
    throw Sass.new(this.rejectedReasons(rejected))
  }

  /**
   * Filters and returns all fulfilled results from a settled promise array.
   *
   * @param {Array<object>} result - Array of settled promise results.
   * @returns {Array<object>} Array of fulfilled results.
   */
  static settledAndFulfilled(result) {
    return result.filter(r => r.status === "fulfilled")
  }

  /**
   * Extracts the values from all fulfilled results in a settled promise array.
   *
   * @param {Array<object>} result - Array of settled promise results.
   * @returns {Array<unknown>} Array of fulfilled values.
   */
  static fulfilledValues(result) {
    return this.settledAndFulfilled(result).map(r => r.value)
  }

  /**
   * Returns the first promise to resolve or reject from an array of promises.
   * Wrapper around Promise.race for consistency with other utility methods.
   *
   * @param {Array<Promise<unknown>>} promises - Array of promises to race
   * @returns {Promise<unknown>} Result of the first settled promise
   */
  static async race(promises) {
    return await Promise.race(promises)
  }

  /**
   * Determine the Levenshtein distance between two string values
   *
   * @param {string} a The first value for comparison.
   * @param {string} b The second value for comparison.
   * @returns {number} The Levenshtein distance
   */
  static levenshteinDistance(a, b) {
    const matrix = Array.from({length: a.length + 1}, (_, i) =>
      Array.from({length: b.length + 1}, (_, j) =>
        (i === 0 ? j : j === 0 ? i : 0)
      )
    )

    for(let i = 1; i <= a.length; i++) {
      for(let j = 1; j <= b.length; j++) {
        matrix[i][j] =
          a[i - 1] === b[j - 1]
            ? matrix[i - 1][j - 1]
            : 1 + Math.min(
              matrix[i - 1][j], matrix[i][j - 1],
              matrix[i - 1][j - 1]
            )
      }
    }

    return matrix[a.length][b.length]
  }

  /**
   * Determine the closest match between a string and allowed values
   * from the Levenshtein distance.
   *
   * @param {string} input The input string to resolve
   * @param {Array<string>} allowedValues The values which are permitted
   * @param {number} [threshold] Max edit distance for a "close match"
   * @returns {string} Suggested, probable match.
   */
  static findClosestMatch(input, allowedValues, threshold=2) {
    let closestMatch = null
    let closestDistance = Infinity
    let closestLengthDiff = Infinity

    for(const value of allowedValues) {
      const distance = this.levenshteinDistance(input, value)
      const lengthDiff = Math.abs(input.length - value.length)

      if(distance < closestDistance && distance <= threshold) {
        closestMatch = value
        closestDistance = distance
        closestLengthDiff = lengthDiff
      } else if(distance === closestDistance &&
                 distance <= threshold &&
                 lengthDiff < closestLengthDiff) {
        closestMatch = value
        closestLengthDiff = lengthDiff
      }
    }

    return closestMatch
  }

  static regexify(input, trim=true, flags=[]) {
    Valid.type(input, "String")
    Valid.type(trim, "Boolean")
    Valid.type(flags, "Array")

    Valid.assert(
      flags.length === 0 ||
      (flags.length > 0 && Collection.isArrayUniform(flags, "String")),
      "All flags must be strings")

    return new RegExp(
      input
        .split(/\r\n|\r|\n/)
        .map(i => trim ? i.trim() : i)
        .filter(i => trim ? Boolean(i) : true)
        .join("")
      , flags?.join(""))
  }
}
