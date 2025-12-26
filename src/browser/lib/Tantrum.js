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

/**
 * Custom aggregate error class that extends AggregateError.
 * Automatically wraps plain errors in Sass instances for consistent reporting.
 */
export default class Tantrum extends AggregateError {
  #trace = []
  #sass

  /**
   * Creates a new Tantrum instance.
   *
   * @param {string} message - The aggregate error message
   * @param {Array<Error|Sass>} errors - Array of errors to aggregate
   * @param {Sass} sass - Sass constructor
   */
  constructor(message, errors = [], sass=Sass) {
    // Auto-wrap plain errors in Sass, keep existing Sass instances
    const wrappedErrors = errors.map(error => {
      if(error instanceof sass)
        return error

      if(!(error instanceof Error))
        throw new TypeError(`All items in errors array must be Error instances, got: ${typeof error}`)

      return sass.new(error.message, error)
    })

    super(wrappedErrors, message)

    this.name = "Tantrum"
    this.#sass = sass
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
      throw this.#sass.new(`Tantrum.addTrace expected string, got ${JSON.stringify(message)}`)

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
   * Reports all aggregated errors to the console with formatted output.
   *
   * @param {boolean} [nerdMode] - Whether to include detailed stack traces
   * @param {boolean} [isNested] - Whether this is a nested error report
   */
  report(nerdMode = false, isNested = false) {
    if(isNested)
      console.error()

    console.group(
      `[Tantrum Incoming] x${this.errors.length}\n` +
      this.message
    )

    if(this.trace.length > 0)
      console.error(this.trace.join("\n"))

    this.errors.forEach(error => {
      error.report(nerdMode, true)
    })

    console.groupEnd()
  }

  /**
   * Factory method to create a Tantrum instance.
   *
   * @param {string} message - The aggregate error message
   * @param {Array<Error|Sass>} errors - Array of errors to aggregate
   * @returns {Tantrum} New Tantrum instance
   */
  static new(message, errors = []) {
    if(errors instanceof this)
      return errors.addTrace(message)

    return new this(message, errors)
  }
}
