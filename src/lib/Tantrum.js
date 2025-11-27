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

import {Tantrum as BrowserTantrum} from "../browser/index.js"
import Sass from "./Sass.js"
import Term from "./Term.js"

/**
 * Custom aggregate error class that extends AggregateError.
 * Automatically wraps plain errors in Sass instances for consistent reporting.
 */
export default class Tantrum extends BrowserTantrum {
  constructor(message, errors = []) {
    super(message, errors, Sass)
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
}
