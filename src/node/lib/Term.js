import console from "node:console"
import process from "node:process"
import {Console} from "node:console"
import {Writable} from "node:stream"

import Sass from "./Sass.js"

export default class Term {
  /**
   * Log an informational message.
   *
   * @param {...unknown} [arg] - Values to log.
   */
  static log(...arg) {
    console.log(...arg)
  }

  /**
   * Log an informational message.
   *
   * @param {...unknown} [arg] - Values to log.
   */
  static info(...arg) {
    console.info(...arg)
  }

  /**
   * Log a warning message.
   *
   * @param {...unknown} [arg] - Warning text / object.
   */
  static warn(...arg) {
    console.warn(...arg)
  }

  /**
   * Log an error message (plus optional details).
   *
   * @param {...unknown} [arg] - Values to log.
   */
  static error(...arg) {
    console.error(...arg)
  }

  /**
   * Log a debug message (no-op unless console.debug provided/visible by env).
   *
   * @param {...unknown} [arg] - Values to log.
   */
  static debug(...arg) {
    console.debug(...arg)
  }

  /**
   * Start a console group for indented output.
   *
   * @param {...unknown} [arg] - Optional group label.
   */
  static group(...arg) {
    console.group(...arg)
  }

  /**
   * End the current console group.
   */
  static groupEnd() {
    console.groupEnd()
  }

  /**
   * Display tabular data as a table.
   *
   * @param {object | Array} tabularData - Object or array to display.
   * @param {object} [options] - Table options.
   * @param {Array<string>} [options.properties] - Optional column properties to display.
   * @param {boolean} [options.showHeader=false] - Whether to show the header row with column names.
   * @param {boolean} [options.quotedStrings=false] - Whether to show quotes around strings.
   */
  static table(tabularData, options = {}) {
    const {properties, showHeader = false, quotedStrings = false} = options

    if(showHeader && quotedStrings) {
      // Simple case: use default console.table
      console.table(tabularData, properties)

      return
    }

    // Capture console.table output
    let output = ""
    const stream = new Writable({
      write(chunk, encoding, callback) {
        output += chunk.toString()
        callback()
      }
    })

    // Make stream appear as a TTY to preserve colors
    stream.isTTY = true
    stream.columns = process.stdout.columns
    stream.rows = process.stdout.rows
    stream.getColorDepth = () => process.stdout.getColorDepth?.() ?? 8

    const tempConsole = new Console(stream)

    tempConsole.table(tabularData, properties)

    // Process output
    let processed = output

    // Remove quotes if requested
    if(!quotedStrings) {
      // Replace 'string' with string + 2 spaces to maintain alignment
      // Use a more precise regex to avoid matching color codes
      processed = processed.replace(/'([^']*)'/g, (match, content) => {
        // Add 2 spaces to compensate for removed quotes
        return content + "  "
      })
    }

    // Remove header row and separator line
    const lines = processed.split("\n")

    if(lines.length > 3 && !showHeader) {
      // Remove the header row (line 1) and separator (line 2)
      // Keep: top border (line 0), data rows (line 3+)
      const modified = [lines[0], ...lines.slice(3)]

      process.stdout.write(modified.join("\n"))
    } else if(showHeader) {
      // Keep header but remove quotes if requested
      process.stdout.write(processed)
    } else {
      // Fallback: just output as-is if format unexpected
      process.stdout.write(processed)
    }
  }

  /**
   * Emit a status line to the terminal.
   *
   * Accepts either a plain string or an array of message segments (see
   * `terminalMessage()` for formatting options). If `silent` is true, output
   * is suppressed.
   *
   * This is a convenient shortcut for logging status updates, with optional
   * formatting and easy suppression.
   *
   * @param {string | Array<string | [string, string]>} args - Message or segments.
   * @param {object} [options] - Behaviour flags.
   * @param {boolean} options.silent - When true, suppress output.
   * @returns {void}
   */
  static status(args, {silent=false} = {}) {
    if(silent)
      return

    return Term.info(Term.terminalMessage(args))
  }

  /**
   * Constructs a formatted status line.
   *
   * Input forms:
   *  - string: printed as-is
   *  - array: each element is either:
   *    - a plain string (emitted unchanged), or
   *    - a tuple: [level, text] where `level` maps to an ansiColors alias
   *        (e.g. success, info, warn, error, modified).
   *    - a tuple: [level, text, [openBracket,closeBracket]] where `level` maps to an ansiColors alias
   *        (e.g. success, info, warn, error, modified). These are rendered as
   *        colourised bracketed segments: [TEXT].
   *
   * The function performs a shallow validation: tuple elements must both be
   * strings; otherwise a TypeError is thrown. Nested arrays beyond depth 1 are
   * not supported.
   *
   * Recursion: array input is normalised into a single string then re-dispatched
   * through `status` to leverage the string branch (keeps logic DRY).
   *
   * @param {string | Array<string | [string, string] | [string, string, string]>} argList - Message spec.
   * @returns {void}
   */
  static terminalMessage(argList) {
    if(typeof argList === "string")
      return argList

    if(Array.isArray(argList)) {
      const message = argList
        .map(args => {
          // Bracketed
          if(Array.isArray(args))

            if(args.length === 3 && Array.isArray(args[2]))
              return Term.terminalBracket(args)

            else
              return Term.terminalBracket([...args])

          // Plain string, no decoration
          if(typeof args === "string")
            return args
        })
        .join(" ")

      return Term.terminalMessage(message)
    }

    throw Sass.new("Invalid arguments passed to terminalMessage")
  }

  /**
   * Construct a single coloured bracketed segment from a tuple specifying
   * the style level and the text. The first element ("level") maps to an
   * `ansiColors` alias (e.g. success, info, warn, error, modified) and is
   * used both for the inner text colour and to locate its matching
   * "-bracket" alias for the surrounding square brackets. The second
   * element is the raw text to display.
   *
   * Input validation: every element of `parts` must be a string; otherwise
   * an `Sass` error is thrown. (Additional elements beyond the first two are
   * ignored – the method destructures only the first pair.)
   *
   * Example:
   *  terminalBracket(["success", "COMPILED"]) → "[COMPILED]" with coloured
   *  brackets + inner text (assuming colour support is available in the
   *  terminal).
   *
   * This method does not append trailing spaces; callers are responsible for
   * joining multiple segments with appropriate separators.
   *
   * @param {Array<string>} parts - Tuple: [level, text]. Additional entries ignored.
   * @returns {string} Colourised bracketed segment (e.g. "[TEXT]").
   * @throws {Sass} If any element of `parts` is not a string.
   */
  static terminalBracket([level, text, brackets=["[","]"]]) {
    if(!(typeof level === "string" && typeof text === "string"))
      throw Sass.new("Each element must be a string.")

    // Simplified version without color support - just return bracketed text
    return `${brackets[0]}${text}${brackets[1]}`
  }

  static async resetTerminal() {
    await Term.directWrite("\x1b[?25h")
    process.stdin.setRawMode(false)
  }

  static async clearLines(num) {
    await Term.directWrite(`${"\r\x1b[2K\x1b[1A".repeat(num)}`)
  }

  static directWrite(output) {
    return new Promise(resolve => {
      process.stdout.write(output, () => resolve())
    })
  }
}
