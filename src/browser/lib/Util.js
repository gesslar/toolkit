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

  static semver = {
    meetsOrExceeds: (supplied, target) => {
      Valid.type(supplied, "String", {allowEmpty: false})
      Valid.type(target, "String", {allowEmpty: false})

      const suppliedSemver = supplied.split(".").filter(Boolean).map(Number).filter(e => !isNaN(e))
      const targetSemver = target.split(".").filter(Boolean).map(Number).filter(e => !isNaN(e))

      Valid.assert(suppliedSemver.length === 3, "Invalid format for supplied semver.")
      Valid.assert(targetSemver.length === 3, "Invalid format for target semver.")

      if(suppliedSemver[0] < targetSemver[0])
        return false

      if(suppliedSemver[0] === targetSemver[0])
        if(suppliedSemver[1] < targetSemver[1])
          return false

      if(suppliedSemver[1] === targetSemver[1])
        if(suppliedSemver[2] < targetSemver[2])
          return false

      return true
    }
  }
}
