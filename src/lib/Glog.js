import Data from "./Data.js"
import console from "node:console"

/**
 * Global logging utility with configurable log levels and prefixes.
 * Provides a flexible logging system that can be used as both a class and
 * a callable function, with support for log level filtering and custom
 * prefixes for better log organization.
 *
 * The Glog class uses a proxy to enable both class-style and function-style
 * usage patterns, making it convenient for different coding preferences.
 *
 * @example
 * // Set up logging configuration
 * Glog.setLogLevel(3).setLogPrefix('[MyApp]')
 *
 * // Log messages with different levels
 * Glog(0, 'Critical error')  // Always shown
 * Glog(2, 'Debug info')      // Shown if logLevel >= 2
 * Glog('Simple message')     // Level 0 by default
 */
class Glog {
  /** @type {number} Current log level threshold (0-5) */
  logLevel = 0
  /** @type {string} Prefix to prepend to all log messages */
  logPrefix = ""

  /**
   * Sets the log prefix for all subsequent log messages.
   * The prefix helps identify the source of log messages in complex
   * applications with multiple components.
   *
   * @param {string} prefix - The prefix string to prepend to log messages
   * @returns {typeof Glog} Returns the Glog class for method chaining
   * @example
   * Glog.setLogPrefix('[Database]')
   * Glog('Connection established') // Output: [Database] Connection established
   */
  static setLogPrefix(prefix) {
    this.logPrefix = prefix

    return Glog
  }

  /**
   * Sets the minimum log level for messages to be displayed.
   * Messages with a level higher than this threshold will be filtered out.
   * Log levels range from 0 (critical) to 5 (verbose debug).
   *
   * @param {number} level - The minimum log level (0-5, clamped to range)
   * @returns {typeof Glog} Returns the Glog class for method chaining
   * @example
   * Glog.setLogLevel(2) // Only show messages with level 0, 1, or 2
   * Glog(1, 'Important') // Shown
   * Glog(3, 'Verbose')   // Hidden
   */
  static setLogLevel(level) {
    this.logLevel = Data.clamp(level, 0, 5)

    return Glog
  }

  /**
   * Internal logging method that handles message formatting and level
   * filtering.
   *
   * Parses arguments to determine log level and message content, then outputs
   * the message if it meets the current log level threshold.
   *
   * @private
   * @param {...unknown} args - Variable arguments: either (level, ...messages) or (...messages)
   * @returns {void}
   */
  static #log(...args) {
    let level, rest

    if(args.length === 0) {
      ;[level=0, rest=[""]] = null
    } else if(args.length === 1) {
      ;[rest, level=0] = [args, 0]
    } else {
      ;[level, ...rest] = args
    }

    if(level > this.logLevel)
      return

    if(this.logPrefix)
      console.log(this.logPrefix, ...rest)
    else
      console.log(...rest)
  }

  /**
   * Executes a log operation with the provided arguments.
   * This method serves as the entry point for all logging operations,
   * delegating to the private #log method for actual processing.
   *
   * @param {...unknown} args - Log level (optional) followed by message arguments
   * @returns {void}
   * @example
   * Glog.execute(0, 'Error:', error.message)
   * Glog.execute('Simple message') // Level 0 assumed
   */
  static execute(...args) {
    this.#log(...args)
  }
}

// Wrap the class in a proxy
export default new Proxy(Glog, {
  apply(target, thisArg, argumentsList) {
    // When called as function: MyClass(things, and, stuff)
    return target.execute(...argumentsList)
  },
  construct(target, argumentsList) {
    return new target(...argumentsList)
  }
})
