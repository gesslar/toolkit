/**
 * @file Tantrum.js
 *
 * Defines the Tantrum class, a custom AggregateError type for toolkit
 * that collects multiple errors with Sass-style reporting.
 *
 * Auto-wraps plain Error objects in Sass instances while preserving
 * existing Sass errors, providing consistent formatted output for
 * multiple error scenarios.
 */

import Sass from "./Sass.js"
import Term from "./Term.js"

/**
 * Custom aggregate error class that extends AggregateError.
 * Automatically wraps plain errors in Sass instances for consistent reporting.
 */
export default class Tantrum extends AggregateError {
  /**
   * Creates a new Tantrum instance.
   *
   * @param {string} message - The aggregate error message
   * @param {Array<Error|Sass>} errors - Array of errors to aggregate
   */
  constructor(message, errors = []) {
    // Auto-wrap plain errors in Sass, keep existing Sass instances
    const wrappedErrors = errors.map(error =>
      error instanceof Sass ? error : Sass.new(error.message, error)
    )

    super(wrappedErrors, message)
    this.name = "Tantrum"
  }
  /**
   * Reports all aggregated errors to the terminal with formatted output.
   *
   * @param {boolean} [nerdMode] - Whether to include detailed stack traces
   */
  report(nerdMode = false) {
    Term.error(
      `${Term.terminalBracket(["error", "Tantrum Incoming"])} (${this.errors.length} errors)\n` +
      this.message
    )

    this.errors.forEach(error => {
      Term.error("\n")
      error.report(nerdMode)
    })
  }

  /**
   * Factory method to create a Tantrum instance.
   *
   * @param {string} message - The aggregate error message
   * @param {Array<Error|Sass>} errors - Array of errors to aggregate
   * @returns {Tantrum} New Tantrum instance
   */
  static new(message, errors = []) {
    return new Tantrum(message, errors)
  }
}
