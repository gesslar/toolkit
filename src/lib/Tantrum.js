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
  #trace = []

  /**
   * Creates a new Tantrum instance.
   *
   * @param {string} message - The aggregate error message
   * @param {Array<Error|Sass>} errors - Array of errors to aggregate
   */
  constructor(message, errors = []) {
    // Auto-wrap plain errors in Sass, keep existing Sass instances
    const wrappedErrors = errors.map(error => {
      if(error instanceof Sass)
        return error

      if(!(error instanceof Error))
        throw new TypeError(`All items in errors array must be Error instances, got: ${typeof error}`)

      return Sass.new(error.message, error)
    })

    super(wrappedErrors, message)
    this.name = "Tantrum"
  }

  /**
   * Adds a trace message and returns this instance for chaining.
   *
   * @param {string} message - The trace message to add
   * @param {Error|Sass} [_error] - Optional error (currently unused, reserved for future use)
   * @returns {this} This Tantrum instance for method chaining
   */
  addTrace(message, _error) {
    if(typeof message !== "string")
      throw Sass.new(`Tantrum.addTrace expected string, got ${JSON.stringify(message)}`)

    this.trace = message

    return this
  }

  /**
   * Gets the error trace array.
   *
   * @returns {Array<string>} Array of trace messages
   */
  get trace() {
    return this.#trace
  }

  /**
   * Adds a message to the beginning of the trace array.
   *
   * @param {string} message - The trace message to add
   */
  set trace(message) {
    this.#trace.unshift(message)
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

    if(this.trace)
      Term.error(this.trace.join("\n"))

    Term.error()

    this.errors.forEach(error => {
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
    if(errors instanceof Tantrum)
      return errors.addTrace(message)

    return new Tantrum(message, errors)
  }
}
