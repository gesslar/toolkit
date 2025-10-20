// Implementation: ../lib/Util.js

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
   * @throws {TypeError} If `text` is not a string
   *
   * @example
   * ```typescript
   * const result = Util.capitalize("hello world")
   * console.log(result) // "Hello world"
   *
   * // Works with empty strings and single characters
   * Util.capitalize("") // ""
   * Util.capitalize("a") // "A"
   * ```
   */
  static capitalize(text: string): string

  /**
   * Measure wall-clock time for an async function.
   * Useful for performance monitoring and debugging async operations.
   *
   * @template T
   * @param fn - Thunk returning a promise.
   * @returns Object containing result and elapsed ms (number, 1 decimal).
   *
   * @example
   * ```typescript
   * const {result, cost} = await Util.time(async () => {
   *   await new Promise(resolve => setTimeout(resolve, 100))
   *   return "completed"
   * })
   * console.log(`Operation took ${cost}ms`) // "Operation took 100.2ms"
   * console.log(result) // "completed"
   * ```
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
   * Centre-align a string inside a fixed width (pad with spaces on left).
   * If the string exceeds width it is returned unchanged.
   *
   * @param text - Text to align.
   * @param width - Target field width (default 80).
   * @returns Padded string with text centred.
   */
  static centreAlignText(text: string | number, width?: number): string

  /**
   * Compute sha256 hash (hex) of the provided string.
   *
   * @param s - Input string.
   * @returns 64-char hexadecimal digest.
   *
   * @example
   * ```typescript
   * const hash = Util.hashOf("hello world")
   * console.log(hash) // "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
   * ```
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
   *
   * @example
   * ```typescript
   * const options = {
   *   "-w, --watch": "Watch for changes",
   *   "-v": "Verbose output",
   *   "--config": "Config file path"
   * }
   * const names = Util.generateOptionNames(options)
   * console.log(names) // ["watch", "v", "config"]
   * ```
   *
   * @remarks
   * Edge cases:
   * - If a key contains only a short option ("-v"), that short name will be included
   * - If multiple long options are present, only the first is used
   * - Malformed option strings may return undefined (filtered out)
   */
  static generateOptionNames(object: Record<string, any>): Array<string>

  /**
   * Asynchronously awaits all promises in parallel.
   * Wrapper around Promise.all for consistency with other utility methods.
   *
   * @param promises - Array of promises to await
   * @returns Results of all promises
   */
  static awaitAll<T>(promises: Array<Promise<T>>): Promise<Array<T>>

  /**
   * Settles all promises (both fulfilled and rejected) in parallel.
   * Wrapper around Promise.allSettled for consistency with other utility methods.
   *
   * @param promises - Array of promises to settle
   * @returns Results of all settled promises with status and value/reason
   */
  static settleAll<T>(promises: Array<Promise<T>>): Promise<Array<PromiseSettledResult<T>>>

  /**
   * Returns the first promise to resolve or reject from an array of promises.
   * Wrapper around Promise.race for consistency with other utility methods.
   *
   * @param promises - Array of promises to race
   * @returns Result of the first settled promise
   */
  static race<T>(promises: Array<Promise<T>>): Promise<T>

  /**
   * Emits an event asynchronously and waits for all listeners to complete.
   *
   * Unlike the standard EventEmitter.emit() which is synchronous, this method
   * properly handles async event listeners by waiting for all of them to
   * resolve or reject using Promise.allSettled(). If any listener throws an
   * error, the first error encountered will be re-thrown.
   *
   * Uses strict instanceof checking to ensure the emitter is a genuine EventEmitter.
   *
   * @param emitter - The EventEmitter instance to emit on
   * @param event - The event name to emit
   * @param args - Arguments to pass to event listeners
   * @returns Resolves when all listeners have completed
   *
   * @example
   * ```typescript
   * import { EventEmitter } from 'events'
   * import { Util } from '@gesslar/toolkit'
   *
   * const emitter = new EventEmitter()
   *
   * emitter.on('data', async (payload) => {
   *   console.log('Processing:', payload.id)
   *   await new Promise(resolve => setTimeout(resolve, 100))
   *   console.log('Completed:', payload.id)
   * })
   *
   * // Wait for all async listeners to complete
   * await Util.asyncEmit(emitter, 'data', { id: 'task-1' })
   * console.log('All listeners finished')
   * ```
   *
   * @throws Will throw an error if any listener rejects or throws
   */
  static asyncEmit(emitter: import('events').EventEmitter, event: string, ...args: unknown[]): Promise<void>

  /**
   * Emits an event asynchronously and waits for all listeners to complete.
   * Like asyncEmit, but uses duck typing for more flexible emitter validation.
   * Accepts any object that has the required EventEmitter-like methods.
   *
   * @param emitter - Any object with EventEmitter-like interface
   * @param event - The event name to emit
   * @param args - Arguments to pass to event listeners
   * @returns Resolves when all listeners have completed
   */
  static asyncEmitAnon(
    emitter: {
      listeners(event: string): Function[],
      on(event: string, listener: Function): any,
      emit(event: string, ...args: unknown[]): any
    },
    event: string,
    ...args: unknown[]
  ): Promise<void>

  /**
   * Determine the Levenshtein distance between two string values.
   * The Levenshtein distance is the minimum number of single-character edits
   * (insertions, deletions, or substitutions) required to change one string into another.
   *
   * @param a - The first string for comparison
   * @param b - The second string for comparison
   * @returns The Levenshtein distance (number of edits needed)
   *
   * @example
   * ```typescript
   * Util.levenshteinDistance("kitten", "sitting") // 3
   * Util.levenshteinDistance("book", "back") // 2
   * Util.levenshteinDistance("hello", "hello") // 0
   * ```
   */
  static levenshteinDistance(a: string, b: string): number

  /**
   * Find the closest match between an input string and an array of allowed values
   * using Levenshtein distance. Returns the closest match if it's within a threshold
   * of 2 edits, otherwise returns null.
   *
   * Useful for fuzzy string matching, such as suggesting corrections for typos
   * in command-line arguments or configuration values.
   *
   * @param input - The input string to find a match for
   * @param allowedValues - Array of allowed string values to match against
   * @param threshold - Maximum edit distance for a match (default: 2)
   * @returns The closest matching string, or null if no match within threshold
   *
   * @example
   * ```typescript
   * const commands = ["help", "build", "test", "deploy"]
   * Util.findClosestMatch("bulid", commands) // "build"
   * Util.findClosestMatch("xyz", commands) // null
   * ```
   */
  static findClosestMatch(input: string, allowedValues: string[], threshold?: number): string | null

  /**
   * Creates a RegExp from a multiline string by removing line breaks and
   * optionally trimming whitespace from each line.
   *
   * This utility makes complex regular expressions more readable by allowing
   * them to be written across multiple lines with proper formatting and indentation.
   * The resulting regex is functionally identical to writing it as a single line.
   *
   * @param input - Multiline string containing the regex pattern (required)
   * @param trim - Whether to trim whitespace from each line (default: true)
   * @param flags - Array of regex flags to apply (default: [])
   * @returns A new RegExp object with the processed pattern
   *
   * @throws Will throw if input is not a string
   * @throws Will throw if trim is not a boolean
   * @throws Will throw if flags is not an array
   * @throws Will throw if flags contains non-string elements
   *
   * @example
   * ```typescript
   * const regex = Util.regexify(`
   *   \\s*\\*\\s*
   *   @(?<tag>\\w+)
   *   \\s*
   *   \\{(?<type>\\w+(?:\\|\\w+)*(?:\\*)?)\\}
   *   \\s+
   *   (?<name>\\w+)
   * `)
   * // Creates: /\s*\*\s*@(?<tag>\w+)\s*\{(?<type>\w+(?:\|\w+)*(?:\*)?)\}\s+(?<name>\w+)/
   *
   * // With flags:
   * const globalRegex = Util.regexify(pattern, true, ['g', 'i'])
   * // Creates regex with global and case-insensitive flags
   * ```
   */
  static regexify(input: string, trim?: boolean, flags?: string[]): RegExp
}

export default Util
