// Implementation: ../lib/Tantrum.js
// Type definitions for Tantrum aggregate error class

import Sass from './Sass'

/**
 * Custom aggregate error class that extends AggregateError.
 *
 * Automatically wraps plain Error objects in Sass instances while preserving
 * existing Sass errors, providing consistent formatted reporting for
 * multiple error scenarios.
 *
 * @example
 * ```typescript
 * // Collect multiple errors and throw as a bundle
 * const errors = [new Error("thing 1"), sassError, new Error("thing 3")]
 * throw Tantrum.new("Multiple validation failures", errors)
 *
 * // Later, in error handling:
 * catch (error) {
 *   if (error instanceof Tantrum) {
 *     error.report() // Reports all errors with Sass formatting
 *   }
 * }
 * ```
 */
export default class Tantrum extends AggregateError {
  /**
   * Creates a new Tantrum instance.
   * Plain Error objects are automatically wrapped in Sass instances.
   *
   * @param message - The aggregate error message describing the overall failure
   * @param errors - Array of errors to aggregate (mix of Error and Sass instances allowed)
   */
  constructor(message: string, errors?: Array<Error | Sass>)

  /** Name of the error class */
  readonly name: 'Tantrum'

  /** Array of aggregated errors (all wrapped as Sass instances) */
  readonly errors: Array<Sass>

  /**
   * Reports all aggregated errors to the terminal with formatted output.
   * Shows a header with error count, then delegates to each Sass instance
   * for individual error reporting.
   *
   * @param nerdMode - Whether to include detailed stack traces in output
   *
   * @example
   * ```typescript
   * try {
   *   throw Tantrum.new("Batch failed", [error1, error2])
   * } catch (tantrum) {
   *   tantrum.report() // User-friendly output
   *   tantrum.report(true) // Includes full stack traces
   * }
   * ```
   */
  report(nerdMode?: boolean): void

  /**
   * Factory method to create a Tantrum instance.
   * Follows the same pattern as Sass.new() for consistency.
   *
   * @param message - The aggregate error message
   * @param errors - Array of errors to aggregate
   * @returns New Tantrum instance with all errors wrapped as Sass
   *
   * @example
   * ```typescript
   * // Typical usage pattern
   * throw Tantrum.new("Someone ate all my Runts!", [
   *   emptyRuntsBoxError,
   *   emptyRuntsBoxError,
   *   emptyRuntsBoxError
   * ])
   * ```
   */
  static new(message: string, errors?: Array<Error | Sass>): Tantrum
}
