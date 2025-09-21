/**
 * Utility class providing common helper functions for string manipulation,
 * timing, hashing, and option parsing.
 */
declare class Util {
  /**
   * Capitalizes the first letter of a string.
   *
   * @param text - The text to capitalize
   * @returns Text with first letter capitalized
   */
  static capitalize(text: string): string

  /**
   * Measure wall-clock time for an async function.
   *
   * @template T
   * @param fn - Thunk returning a promise.
   * @returns Object containing result and elapsed ms (number, 1 decimal).
   */
  static time<T>(fn: () => Promise<T>): Promise<{result: T, cost: number}>

  /**
   * Right-align a string inside a fixed width (left pad with spaces).
   * If the string exceeds width it is returned unchanged.
   *
   * @param text - Text to align.
   * @param width - Target field width (default 80).
   * @returns Padded string.
   */
  static rightAlignText(text: string | number, width?: number): string

  /**
   * Compute sha256 hash (hex) of the provided string.
   *
   * @param s - Input string.
   * @returns 64-char hexadecimal digest.
   */
  static hashOf(s: string): string

  /**
   * Extracts canonical option names from a Commander-style options object.
   *
   * Each key in the input object is a string containing one or more option
   * forms, separated by commas (e.g. "-w, --watch"). This function splits each
   * key, trims whitespace, and parses out the long option name (e.g. "watch")
   * for each entry. If no long option ("--") is present, the short option (e.g.
   * "v" from "-v") will be included in the result array. If both are present,
   * the long option is preferred.
   *
   * @param object - Mapping of option strings to descriptions.
   * @returns Array of canonical option names (long preferred, short if no long present).
   */
  static generateOptionNames(object: Record<string, any>): string[]

  /**
   * Asynchronously awaits all promises in parallel.
   * Wrapper around Promise.all for consistency with other utility methods.
   *
   * @param promises - Array of promises to await
   * @returns Results of all promises
   */
  static awaitAll<T>(promises: Promise<T>[]): Promise<T[]>

  /**
   * Settles all promises (both fulfilled and rejected) in parallel.
   * Wrapper around Promise.allSettled for consistency with other utility methods.
   *
   * @param promises - Array of promises to settle
   * @returns Results of all settled promises with status and value/reason
   */
  static settleAll<T>(promises: Promise<T>[]): Promise<PromiseSettledResult<T>[]>

  /**
   * Returns the first promise to resolve or reject from an array of promises.
   * Wrapper around Promise.race for consistency with other utility methods.
   *
   * @param promises - Array of promises to race
   * @returns Result of the first settled promise
   */
  static race<T>(promises: Promise<T>[]): Promise<T>
}

export default Util