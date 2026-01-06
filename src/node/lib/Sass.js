/**
 * @file Sass.js
 *
 * Defines the Sass class, a custom error type for toolkit compilation
 * errors.
 *
 * Supports error chaining, trace management, and formatted reporting for both
 * user-friendly and verbose (nerd) output.
 *
 * Used throughout the toolkit for structured error handling and
 * debugging.
 */

import {Sass as BrowserSass} from "../../browser/index.js"
import Term from "./Term.js"

/**
 * Custom error class for toolkit errors.
 * Provides error chaining, trace management, and formatted error reporting.
 */
export default class Sass extends BrowserSass {
  /**
   * Reports the error to the terminal with formatted output.
   * Optionally includes detailed stack trace information.
   *
   * @param {boolean} [nerdMode] - Whether to include detailed stack trace
   * @param {boolean} [isNested] - Whether this is a nested error report
   */
  report(nerdMode=false, isNested=false) {
    if(isNested)
      Term.error()

    Term.group(
      `${Term.terminalBracket(["error", "Something Went Wrong"])}\n` +
      this.trace.join("\n")
    )

    if(nerdMode) {
      Term.error(
        "\n" +
        `${Term.terminalBracket(["error", "Nerd Victuals"])}\n` +
        this.#fullBodyMassage(this.stack)
      )
    }

    if(this.cause) {
      if(typeof this.cause.report === "function") {
        if(nerdMode) {
          Term.error(
            "\n" +
            `${Term.terminalBracket(["error", "Caused By"])}`
          )
        }

        this.cause.report(nerdMode, true)
      } else if(nerdMode && this.cause.stack) {
        Term.error()
        Term.group()
        Term.error(
          `${Term.terminalBracket(["error", "Rethrown From"])}\n` +
          this.#fullBodyMassage(this.cause.stack)
        )
        Term.groupEnd()
      }
    }

    Term.groupEnd()
  }

  /**
   * Formats the stack trace for display, removing the first line and
   * formatting each line with appropriate indentation.
   *
   * Note: Returns formatted stack trace or undefined if no stack available.
   *
   * @param {string} stack - The error stack to massage.
   * @returns {string|undefined} Formatted stack trace or undefined
   */
  #fullBodyMassage(stack) {
    stack = stack ?? ""
    // Remove the first line, it's already been reported
    const {rest} = stack.match(/^.*?\n(?<rest>[\s\S]+)$/m)?.groups ?? {}
    const lines = []

    if(rest) {
      lines.push(
        ...rest
          .split("\n")
          .map(line => {
            const at = line.match(/^\s{4}at\s(?<at>.*)$/)?.groups?.at ?? ""

            return at
              ? `* ${at}`
              : line
          })
      )
    }

    return lines.join("\n")
  }
}
