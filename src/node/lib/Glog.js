/**
 * @file Glog.js
 *
 * Enhanced Global logging utility that combines simple logging with advanced Logger features.
 *
 * Can be used in multiple ways:
 * 1. Simple function call: Glog(data)
 * 2. With levels: Glog(2, "debug message")
 * 3. Configured instance: new Glog(options)
 * 4. Fluent setup: Glog.create().withName("App").withColors()
 * 5. Traditional logger: logger.debug("message", level)
 */

import c from "@gesslar/colours"

import Data from "../../browser/lib/Data.js"
import Term from "./Term.js"
import Util from "../../browser/lib/Util.js"
// ErrorStackParser will be dynamically imported when needed

// Enhanced color system using @gesslar/colours
export const loggerColours = {
  debug: [
    "{F019}", // Debug level 0: Dark blue
    "{F027}", // Debug level 1: Medium blue
    "{F033}", // Debug level 2: Light blue
    "{F039}", // Debug level 3: Teal
    "{F044}", // Debug level 4: Blue-tinted cyan
  ],
  info: "{F036}",    // Medium Spring Green
  warn: "{F214}",    // Orange1
  error: "{F196}",   // Red1
  reset: "{/}",      // Reset
}

// Symbol alternatives for tags
export const logSymbols = {
  debug: "?",
  info: "i",
  warn: "!",
  error: "✗",
  success: "✓"
}

// Set up convenient aliases for common log colors
c.alias.set("debug", "{F033}")
c.alias.set("info", "{F036}")
c.alias.set("warn", "{F214}")
c.alias.set("error", "{F196}")
c.alias.set("success", "{F046}")
c.alias.set("muted", "{F244}")
c.alias.set("bold", "{<B}")
c.alias.set("dim", "{<D}")

class Glog {
  // Static properties (for global usage)
  static logLevel = 0
  static logPrefix = ""
  static colors = null
  static stackTrace = false
  static name = ""
  static tagsAsStrings = false

  // Instance properties (for configured loggers)
  #logLevel = 0
  #logPrefix = ""
  #colors = null
  #stackTrace = false
  #name = ""
  #tagsAsStrings = false
  #displayName = true
  #vscodeError = null
  #vscodeWarn = null
  #vscodeInfo = null

  constructor(options = {}) {
    this.setOptions(options)
    this.constructor.name = "Glog"

    // VSCode integration if specified
    if(options.env === "extension") {
      try {
        const vscode = require("vscode")

        this.#vscodeError = vscode.window.showErrorMessage
        this.#vscodeWarn = vscode.window.showWarningMessage
        this.#vscodeInfo = vscode.window.showInformationMessage
      } catch {
        // VSCode not available, ignore
      }
    }
  }

  // === CONFIGURATION METHODS ===

  setOptions(options) {
    this.#name = options.name ?? this.#name
    this.#logLevel = options.debugLevel ?? options.logLevel ?? this.#logLevel
    this.#logPrefix = options.prefix ?? this.#logPrefix
    this.#colors = options.colors ?? this.#colors
    this.#stackTrace = options.stackTrace ?? this.#stackTrace
    this.#tagsAsStrings = options.tagsAsStrings ?? this.#tagsAsStrings
    this.#displayName = options.displayName ?? this.#displayName

    return this
  }

  // === STATIC CONFIGURATION (for global usage) ===

  /**
   * Set the log prefix for global usage
   *
   * @param {string} prefix - Prefix to prepend to all log messages
   * @returns {typeof Glog} The Glog class for chaining
   */
  static setLogPrefix(prefix) {
    this.logPrefix = prefix

    return this
  }

  /**
   * Set the log level for global usage (0-5)
   *
   * @param {number} level - Log level (0 = off, 1-5 = increasing verbosity)
   * @returns {typeof Glog} The Glog class for chaining
   */
  static setLogLevel(level) {
    this.logLevel = Data.clamp(level, 0, 5)

    return this
  }

  /**
   * Set the logger name for global usage
   *
   * @param {string} name - Logger name to display in output
   * @returns {typeof Glog} The Glog class for chaining
   */
  static withName(name) {
    this.name = name

    return this
  }

  /**
   * Enable colors for global usage
   * Merges with existing color configuration (can pass partial config)
   * Shape: {debug?: string[], info?: string, warn?: string, error?: string, reset?: string}
   * - debug: Array of 5 color codes [level0, level1, level2, level3, level4]
   * - info, warn, error, reset: Single color code strings
   * Uses @gesslar/colours format like "{F196}"
   *
   * @param {object} [colors=loggerColours] - Color configuration object (partial or complete)
   * @returns {typeof Glog} The Glog class for chaining
   */
  static withColors(colors = loggerColours) {
    this.colors = Object.assign({}, this.colors ?? loggerColours, colors)

    return this
  }

  /**
   * Enable stack trace extraction for global usage
   *
   * @param {boolean} [enabled=true] - Whether to enable stack traces
   * @returns {typeof Glog} The Glog class for chaining
   */
  static withStackTrace(enabled = true) {
    this.stackTrace = enabled

    return this
  }

  /**
   * Use tag names as strings instead of symbols for global usage
   *
   * @param {boolean} [enabled=false] - Whether to use string tags
   * @returns {typeof Glog} The Glog class for chaining
   */
  static withTagsAsStrings(enabled = false) {
    this.tagsAsStrings = enabled

    return this
  }

  // === FLUENT INSTANCE CREATION ===

  /**
   * Create a new Glog instance with fluent configuration
   *
   * @param {object} [options={}] - Initial options
   * @returns {Glog} New Glog instance
   */
  static create(options = {}) {
    return new this(options)
  }

  withName(name) {
    this.#name = name

    return this
  }

  withLogLevel(level) {
    this.#logLevel = level

    return this
  }

  withPrefix(prefix) {
    this.#logPrefix = prefix

    return this
  }

  /**
   * Enable colors for this logger instance
   * Merges with existing color configuration (can pass partial config)
   * Shape: {debug?: string[], info?: string, warn?: string, error?: string, reset?: string}
   * - debug: Array of 5 color codes [level0, level1, level2, level3, level4]
   * - info, warn, error, reset: Single color code strings
   * Uses @gesslar/colours format like "{F196}"
   *
   * @param {object} [colors=loggerColours] - Color configuration object (partial or complete)
   * @returns {Glog} This Glog instance for chaining
   */
  withColors(colors = loggerColours) {
    this.#colors = Object.assign({}, this.#colors ?? loggerColours, colors)

    return this
  }

  withStackTrace(enabled = true) {
    this.#stackTrace = enabled

    return this
  }

  withTagsAsStrings(enabled = false) {
    this.#tagsAsStrings = enabled

    return this
  }

  noDisplayName() {
    this.#displayName = false

    return this
  }

  // === UTILITY METHODS ===

  get name() {
    return this.#name
  }

  get debugLevel() {
    return this.#logLevel
  }

  get options() {
    return {
      name: this.#name,
      debugLevel: this.#logLevel,
      prefix: this.#logPrefix,
      colors: this.#colors,
      stackTrace: this.#stackTrace
    }
  }

  #compose(level, message, debugLevel = 0) {
    const colors = this.#colors || Glog.colors || loggerColours
    const name = this.#name || Glog.name || "Log"
    const useStrings = this.#tagsAsStrings || Glog.tagsAsStrings
    const showName = this.#displayName
    const tag = useStrings ? Util.capitalize(level) : logSymbols[level]
    const namePrefix = showName ? `[${name}] ` : ""

    if(!colors) {
      return useStrings
        ? `${namePrefix}${tag}: ${message}`
        : `${namePrefix}${tag} ${message}`
    }

    if(level === "debug") {
      const colorCode = colors[level][debugLevel] || colors[level][0]

      return useStrings
        ? c`${namePrefix}${colorCode}${tag}{/}: ${message}`
        : c`${namePrefix}${colorCode}${tag}{/} ${message}`
    }

    return useStrings
      ? c`${namePrefix}${colors[level]}${tag}{/}: ${message}`
      : c`${namePrefix}${colors[level]}${tag}{/} ${message}`
  }

  // Stack trace functionality - simplified for now
  extractFileFunction() {
    // Simple fallback - just return a basic tag
    return "caller"
  }

  newDebug(tag) {
    return function(message, level, ...arg) {
      if(this.#stackTrace || Glog.stackTrace) {
        tag = this.extractFileFunction()
      }

      this.debug(`[${tag}] ${message}`, level, ...arg)
    }.bind(this)
  }

  // === LOGGING METHODS ===

  #log(...args) {
    let level, rest

    if(args.length === 0) {
      [level = 0, rest = [""]] = []
    } else if(args.length === 1) {
      [rest, level = 0] = [args, 0]
    } else {
      [level, ...rest] = typeof args[0] === "number" ? args : [0, ...args]
    }

    const currentLevel = this.#logLevel || Glog.logLevel

    if(level > currentLevel)
      return

    const prefix = this.#logPrefix || Glog.logPrefix

    if(prefix) {
      Term.log(prefix, ...rest)
    } else {
      Term.log(...rest)
    }
  }

  // Traditional logger methods
  /**
   * Log a debug message with specified verbosity level.
   * Level 0 means debug OFF - use levels 1-4 for actual debug output.
   * Debug messages only show when logLevel > 0.
   *
   * @param {string} message - Debug message to log
   * @param {number} level - Debug verbosity level (1-4, default: 1)
   * @param {...unknown} arg - Additional arguments to log
   * @throws {Error} If level < 1 (level 0 = debug OFF)
   */
  debug(message, level = 1, ...arg) {
    if(level < 1) {
      throw new Error("Debug level must be >= 1 (level 0 = debug OFF)")
    }

    const currentLevel = this.#logLevel || Glog.logLevel

    if(currentLevel > 0 && level <= currentLevel) {
      Term.debug(this.#compose("debug", message, level), ...arg)
    }
  }

  info(message, ...arg) {
    Term.info(this.#compose("info", message), ...arg)
    this.#vscodeInfo?.(JSON.stringify(message))
  }

  warn(message, ...arg) {
    Term.warn(this.#compose("warn", message), ...arg)
    this.#vscodeWarn?.(JSON.stringify(message))
  }

  error(message, ...arg) {
    Term.error(this.#compose("error", message), ...arg)
    this.#vscodeError?.(JSON.stringify(message))
  }

  /**
   * Core execute method for simple static usage
   * Can be called as: Glog(data) or Glog(level, data)
   *
   * @param {...unknown} args - Arguments (optional level number, then data)
   */
  static execute(...args) {
    // Use static properties for global calls
    let level, rest

    if(args.length === 0) {
      [level = 0, rest = [""]] = []
    } else if(args.length === 1) {
      [rest, level = 0] = [args, 0]
    } else {
      [level, ...rest] = typeof args[0] === "number" ? args : [0, ...args]
    }

    if(level > this.logLevel)
      return

    if(this.logPrefix) {
      Term.log(this.logPrefix, ...rest)
    } else {
      Term.log(...rest)
    }
  }

  // Instance execute for configured loggers
  execute(...args) {
    this.#log(...args)
  }

  // === ENHANCED METHODS WITH @gesslar/colours ===

  /**
   * Log a colorized message using template literals
   *
   * @param {Array<string>} strings - Template strings
   * @param {...unknown} values - Template values
   * @example logger.colorize`{success}Operation completed{/} in {bold}${time}ms{/}`
   */
  colorize(strings, ...values) {
    const message = c(strings, ...values)
    const name = this.#name || Glog.name || "Log"

    Term.log(`[${name}] ${message}`)
  }

  /**
   * Static version of colorize for global usage
   *
   * @param {Array<string>} strings - Template strings
   * @param {...unknown} values - Template values
   */
  static colorize(strings, ...values) {
    const message = c(strings, ...values)
    const name = this.name || "Log"

    Term.log(`[${name}] ${message}`)
  }

  /**
   * Log a success message with green color
   *
   * @param {string} message - Success message
   * @param {...unknown} args - Additional arguments
   */
  success(message, ...args) {
    const name = this.#name || Glog.name || "Log"
    const useStrings = this.#tagsAsStrings || Glog.tagsAsStrings
    const showName = this.#displayName
    const tag = useStrings ? "Success" : logSymbols.success
    const namePrefix = showName ? `[${name}] ` : ""
    const formatted = useStrings
      ? c`${namePrefix}{success}${tag}{/}: ${message}`
      : c`${namePrefix}{success}${tag}{/} ${message}`

    Term.log(formatted, ...args)
  }

  /**
   * Static success method
   *
   * @param {string} message - Success message to log
   * @param {...unknown} args - Additional arguments to log
   */
  static success(message, ...args) {
    const name = this.name || "Log"
    const useStrings = this.tagsAsStrings
    const tag = useStrings ? "Success" : logSymbols.success
    const formatted = useStrings
      ? c`[${name}] {success}${tag}{/}: ${message}`
      : c`[${name}] {success}${tag}{/} ${message}`

    Term.log(formatted, ...args)
  }

  /**
   * Static group method - start a console group for indented output
   *
   * @param {...unknown} args - Optional group label
   */
  static group(...args) {
    const name = this.name || "Log"
    const label = args.length > 0 ? ` ${args.join(" ")}` : ""

    Term.group(`[${name}]${label}`)
  }

  /**
   * Static groupEnd method - end the current console group
   */
  static groupEnd() {
    Term.groupEnd()
  }

  /**
   * Static groupDebug - start a debug-tagged group
   *
   * @param {string} message - Group label
   * @param {number} [level=1] - Debug level
   */
  static groupDebug(message, level = 1) {
    const colors = this.colors || loggerColours
    const name = this.name || "Log"
    const useStrings = this.tagsAsStrings
    const tag = useStrings ? "Debug" : logSymbols.debug
    const colorCode = colors.debug[level] || colors.debug[0]
    const label = useStrings
      ? c`[${name}] ${colorCode}${tag}{/}: ${message}`
      : c`[${name}] ${colorCode}${tag}{/} ${message}`

    Term.group(label)
  }

  /**
   * Static groupInfo - start an info-tagged group
   *
   * @param {string} message - Group label
   */
  static groupInfo(message) {
    const colors = this.colors || loggerColours
    const name = this.name || "Log"
    const useStrings = this.tagsAsStrings
    const tag = useStrings ? "Info" : logSymbols.info
    const label = useStrings
      ? c`[${name}] ${colors.info}${tag}{/}: ${message}`
      : c`[${name}] ${colors.info}${tag}{/} ${message}`

    Term.group(label)
  }

  /**
   * Static groupSuccess - start a success-tagged group
   *
   * @param {string} message - Group label
   */
  static groupSuccess(message) {
    const name = this.name || "Log"
    const useStrings = this.tagsAsStrings
    const tag = useStrings ? "Success" : logSymbols.success
    const label = useStrings
      ? c`[${name}] {success}${tag}{/}: ${message}`
      : c`[${name}] {success}${tag}{/} ${message}`

    Term.group(label)
  }

  /**
   * Start a console group for indented output
   *
   * @param {...unknown} args - Optional group label
   */
  group(...args) {
    const name = this.#name || Glog.name || "Log"
    const showName = this.#displayName
    const label = args.length > 0 ? ` ${args.join(" ")}` : ""
    const output = showName ? `[${name}]${label}` : label.trim()

    Term.group(output)
  }

  /**
   * End the current console group
   */
  groupEnd() {
    Term.groupEnd()
  }

  /**
   * Start a debug-tagged group
   *
   * @param {string} message - Group label
   * @param {number} [level=1] - Debug level
   */
  groupDebug(message, level = 1) {
    Term.group(this.#compose("debug", message, level))
  }

  /**
   * Start an info-tagged group
   *
   * @param {string} message - Group label
   */
  groupInfo(message) {
    Term.group(this.#compose("info", message))
  }

  /**
   * Start a success-tagged group
   *
   * @param {string} message - Group label
   */
  groupSuccess(message) {
    const name = this.#name || Glog.name || "Log"
    const useStrings = this.#tagsAsStrings || Glog.tagsAsStrings
    const showName = this.#displayName
    const tag = useStrings ? "Success" : logSymbols.success
    const namePrefix = showName ? `[${name}] ` : ""
    const label = useStrings
      ? c`${namePrefix}{success}${tag}{/}: ${message}`
      : c`${namePrefix}{success}${tag}{/} ${message}`

    Term.group(label)
  }

  /**
   * Display tabular data as a table
   *
   * @param {object | Array} data - Object or array to display
   * @param {string | object} [labelOrOptions] - Optional label (string) or options (object)
   * @param {object} [options] - Optional options when label is provided
   * @param {Array<string>} [options.properties] - Column properties to display
   * @param {boolean} [options.showHeader=false] - Whether to show the header row
   * @param {boolean} [options.quotedStrings=false] - Whether to show quotes around strings
   */
  table(data, labelOrOptions, options) {
    let label
    let tableOptions = {}

    // Parse polymorphic parameters
    if(typeof labelOrOptions === "string") {
      label = labelOrOptions
      tableOptions = options || {}
    } else if(typeof labelOrOptions === "object" && labelOrOptions !== null) {
      tableOptions = labelOrOptions
    }

    if(label) {
      Term.log(c`[${this.#name || Glog.name || "Log"}] {info}Table{/}: ${label}`)
    }

    Term.table(data, tableOptions)
  }

  /**
   * Static table method
   *
   * @param {object | Array} data - Object or array to display
   * @param {string | object} [labelOrOptions] - Optional label (string) or options (object)
   * @param {object} [options] - Optional options when label is provided
   * @param {Array<string>} [options.properties] - Column properties to display
   * @param {boolean} [options.showHeader=false] - Whether to show the header row
   * @param {boolean} [options.quotedStrings=false] - Whether to show quotes around strings
   */
  static table(data, labelOrOptions, options) {
    let label
    let tableOptions = {}

    // Parse polymorphic parameters
    if(typeof labelOrOptions === "string") {
      label = labelOrOptions
      tableOptions = options || {}
    } else if(typeof labelOrOptions === "object" && labelOrOptions !== null) {
      tableOptions = labelOrOptions
    }

    if(label) {
      Term.log(c`[${this.name || "Log"}] {info}Table{/}: ${label}`)
    }

    Term.table(data, tableOptions)
  }

  /**
   * Set a color alias for convenient usage
   *
   * @param {string} alias - Alias name
   * @param {string} colorCode - Color code (e.g., "{F196}" or "{<B}")
   * @returns {Glog} The Glog class for chaining.
   */
  static setAlias(alias, colorCode) {
    c.alias.set(alias, colorCode)

    return this
  }

  /**
   * Get access to the colours template function for instance usage
   *
   * @returns {import('@gesslar/colours')} The colours template function from \@gesslar/colours
   */
  get colours() {
    return c
  }

  /**
   * Get a raw logger that outputs without name/tag formatting
   *
   * @returns {object} Raw logger interface
   */
  get raw() {
    return {
      debug: (message, ...args) => Term.debug(message, ...args),
      info: (message, ...args) => Term.info(message, ...args),
      warn: (message, ...args) => Term.warn(message, ...args),
      error: (message, ...args) => Term.error(message, ...args),
      log: (...args) => Term.log(...args),
      success: (message, ...args) => Term.log(message, ...args),
      table: (data, options) => Term.table(data, options || {}),
      group: (...args) => Term.group(...args),
      groupEnd: () => Term.groupEnd()
    }
  }

  /**
   * Static raw logger that outputs without name/tag formatting
   *
   * @returns {object} Raw logger interface
   */
  static get raw() {
    return {
      debug: (message, ...args) => Term.debug(message, ...args),
      info: (message, ...args) => Term.info(message, ...args),
      warn: (message, ...args) => Term.warn(message, ...args),
      error: (message, ...args) => Term.error(message, ...args),
      log: (...args) => Term.log(...args),
      success: (message, ...args) => Term.log(message, ...args),
      table: (data, options) => Term.table(data, options || {}),
      group: (...args) => Term.group(...args),
      groupEnd: () => Term.groupEnd()
    }
  }
}

// Wrap in proxy for dual usage
export default new Proxy(Glog, {
  apply(target, _thisArg, argumentsList) {
    return target.execute(...argumentsList)
  },
  construct(target, argumentsList) {
    return new target(...argumentsList)
  },
  get(target, prop) {
    // Hide execute method from public API
    if(prop === "execute") {
      return undefined
    }

    return Reflect.get(target, prop)
  }
})
