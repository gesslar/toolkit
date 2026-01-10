/**
 * @file Glog.js
 *
 * Enhanced Global logging utility that combines simple logging with advanced Logger features.
 *
 * Can be used in multiple ways:
 * 1. Simple function call: Glog(data)
 * 2. With levels: Glog(2, "debug message")
 * 3. Configured instance: new Glog(options)
 * 4. Fluent setup: Glog.create().withName("App").withColours()
 * 5. Traditional logger: logger.debug("message", level)
 */

import c from "@gesslar/colours"

import Data from "../../browser/lib/Data.js"
import Term from "./Term.js"
import Util from "../../browser/lib/Util.js"

/**
 * Default colour configuration for logger output using @gesslar/colours format
 *
 * @type {object}
 * @property {string[]} debug - Array of 5 colour codes for debug levels 0-4
 * @property {string} info - Colour code for info messages
 * @property {string} warn - Colour code for warning messages
 * @property {string} error - Colour code for error messages
 * @property {string} success - Colour code for success messages
 * @property {string} reset - Colour reset code
 */
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
  success: "{F046}", // Green (Bright Green)
  reset: "{/}",      // Reset
}

/**
 * Symbol characters used for log level tags when colours are disabled or tagsAsStrings is false
 *
 * @type {object}
 * @property {string} debug - Symbol for debug messages
 * @property {string} info - Symbol for info messages
 * @property {string} warn - Symbol for warning messages
 * @property {string} error - Symbol for error messages
 * @property {string} success - Symbol for success messages
 */
export const logSymbols = {
  debug: "?",
  info: "i",
  warn: "!",
  error: "✗",
  success: "✓"
}

// Set up convenient aliases for common log colours
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
  static colours = null
  static stackTrace = false
  static name = ""
  static tagsAsStrings = false
  static symbols = null

  // Instance properties (for configured loggers)
  #logLevel = 0
  #logPrefix = ""
  #colours = null
  #stackTrace = false
  #name = ""
  #tagsAsStrings = false
  #displayName = true
  #symbols = null
  #vscodeError = null
  #vscodeWarn = null
  #vscodeInfo = null

  /**
   * Create a new Glog logger instance with optional configuration
   *
   * @param {object} [options={}] - Configuration options
   * @param {string} [options.name] - Logger name to display in output
   * @param {number} [options.debugLevel] - Debug verbosity level (0-5, default: 0)
   * @param {number} [options.logLevel] - Alias for debugLevel
   * @param {string} [options.prefix] - Prefix to prepend to all log messages
   * @param {object} [options.colours] - Colour configuration object
   * @param {object} [options.symbols] - Custom log level symbols (e.g., {info: '🚒', warn: '🚨', error: '🔥', success: '💧', debug: '🧯'})
   * @param {boolean} [options.stackTrace=false] - Enable stack trace extraction
   * @param {boolean} [options.tagsAsStrings=false] - Use string tags instead of symbols
   * @param {boolean} [options.displayName=true] - Display logger name in output
   * @param {string} [options.env] - Environment mode ("extension" for VSCode integration)
   */
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

  /**
   * Set configuration options for this logger instance
   *
   * @param {object} options - Configuration options
   * @param {string} [options.name] - Logger name to display in output
   * @param {number} [options.debugLevel] - Debug verbosity level (0-5)
   * @param {number} [options.logLevel] - Alias for debugLevel
   * @param {string} [options.prefix] - Prefix to prepend to all log messages
   * @param {object} [options.colours] - Colour configuration object
   * @param {object} [options.symbols] - Custom log level symbols (e.g., {info: '🚒', warn: '🚨', error: '🔥', success: '💧', debug: '🧯'})
   * @param {boolean} [options.stackTrace] - Enable stack trace extraction
   * @param {boolean} [options.tagsAsStrings] - Use string tags instead of symbols
   * @param {boolean} [options.displayName] - Display logger name in output
   * @returns {Glog} This Glog instance for chaining
   */
  setOptions(options) {
    this.#name = options.name ?? this.#name
    this.#logLevel = options.debugLevel ?? options.logLevel ?? this.#logLevel
    this.#logPrefix = options.prefix ?? this.#logPrefix
    this.#colours = options.colours ?? this.#colours

    if(options.symbols) {
      const base = this.#symbols ?? logSymbols

      this.#symbols = Object.assign({}, base, options.symbols)
    }

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
   * Enable colours for global usage
   * Merges with existing colour configuration (can pass partial config)
   * Shape: {debug?: string[], info?: string, warn?: string, error?: string, reset?: string}
   * - debug: Array of 5 colour codes [level0, level1, level2, level3, level4]
   * - info, warn, error, reset: Single colour code strings
   * Uses @gesslar/colours format like "{F196}"
   *
   * @param {object} [colours=loggerColours] - Colour configuration object (partial or complete)
   * @returns {typeof Glog} The Glog class for chaining
   */
  static withColours(colours = loggerColours) {
    this.colours = Object.assign({}, this.colours ?? loggerColours, colours)

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

  /**
   * Customize log level symbols for global usage
   * Merges with existing symbols (can pass partial config)
   * Only affects output when tagsAsStrings is false
   * Shape: {debug?: string, info?: string, warn?: string, error?: string, success?: string}
   *
   * @param {object} [symbols=logSymbols] - Symbol configuration object (partial or complete)
   * @returns {typeof Glog} The Glog class for chaining
   * @example
   * Glog.withSymbols({info: '🚒', warn: '🚨', error: '🔥', success: '💧', debug: '🧯'})
   */
  static withSymbols(symbols = logSymbols) {
    this.symbols = Object.assign({}, this.symbols ?? logSymbols, symbols)

    return this
  }

  /**
   * Create a temporary scoped logger with a custom prefix for a single chain (static version)
   * The prefix replaces all formatting (name, tags) with just the prefix + message
   *
   * @param {string} prefix - Temporary prefix to use (e.g., "=>", "  ", "-->")
   * @returns {object} Temporary logger with all standard methods
   * @example
   * Glog.use("=>").info("Indented message")  // => Indented message
   * Glog.info("Back to normal")               // [Log] i Back to normal
   */
  static use(prefix) {
    return {
      debug: (message, level = 1, ...args) => {
        if(this.logLevel > 0 && level <= this.logLevel) {
          Term.debug(`${prefix}${message}`, ...args)
        }
      },
      info: (message, ...args) => Term.info(`${prefix}${message}`, ...args),
      warn: (message, ...args) => Term.warn(`${prefix}${message}`, ...args),
      error: (message, ...args) => Term.error(`${prefix}${message}`, ...args),
      success: (message, ...args) => Term.log(`${prefix}${message}`, ...args),
      log: (...args) => Term.log(prefix, ...args),
      group: (...args) => {
        const label = args.length > 0 ? ` ${args.join(" ")}` : ""

        Term.group(`${prefix}${label}`)
      },
      groupEnd: () => Term.groupEnd(),
      table: (data, labelOrOptions, options) => {
        let label
        let tableOptions = {}

        if(typeof labelOrOptions === "string") {
          label = labelOrOptions
          tableOptions = options || {}
        } else if(typeof labelOrOptions === "object" && labelOrOptions !== null) {
          tableOptions = labelOrOptions
        }

        if(label) {
          Term.log(`${prefix}${label}`)
        }

        Term.table(data, tableOptions)
      }
    }
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

  /**
   * Set the logger name for this instance
   *
   * @param {string} name - Logger name to display in output
   * @returns {Glog} This Glog instance for chaining
   */
  withName(name) {
    this.#name = name

    return this
  }

  /**
   * Set the log level for this instance (0-5)
   *
   * @param {number} level - Log level (0 = off, 1-5 = increasing verbosity)
   * @returns {Glog} This Glog instance for chaining
   */
  withLogLevel(level) {
    this.#logLevel = level

    return this
  }

  /**
   * Set the log prefix for this instance
   *
   * @param {string} prefix - Prefix to prepend to all log messages
   * @returns {Glog} This Glog instance for chaining
   */
  withPrefix(prefix) {
    this.#logPrefix = prefix

    return this
  }

  /**
   * Enable colours for this logger instance
   * Merges with existing colour configuration (can pass partial config)
   * Shape: {debug?: string[], info?: string, warn?: string, error?: string, reset?: string}
   * - debug: Array of 5 colour codes [level0, level1, level2, level3, level4]
   * - info, warn, error, reset: Single colour code strings
   * Uses @gesslar/colours format like "{F196}"
   *
   * @param {object} [colours=loggerColours] - Colour configuration object (partial or complete)
   * @returns {Glog} This Glog instance for chaining
   */
  withColours(colours = loggerColours) {
    this.#colours = Object.assign({}, this.#colours ?? loggerColours, colours)

    return this
  }

  /**
   * Enable or disable stack trace extraction for this instance
   *
   * @param {boolean} [enabled=true] - Whether to enable stack traces
   * @returns {Glog} This Glog instance for chaining
   */
  withStackTrace(enabled = true) {
    this.#stackTrace = enabled

    return this
  }

  /**
   * Use tag names as strings instead of symbols for this instance
   *
   * @param {boolean} [enabled=false] - Whether to use string tags
   * @returns {Glog} This Glog instance for chaining
   */
  withTagsAsStrings(enabled = false) {
    this.#tagsAsStrings = enabled

    return this
  }

  /**
   * Customize log level symbols for this logger instance
   * Merges with existing symbols (can pass partial config)
   * Only affects output when tagsAsStrings is false
   * Shape: {debug?: string, info?: string, warn?: string, error?: string, success?: string}
   *
   * @param {object} [symbols=logSymbols] - Symbol configuration object (partial or complete)
   * @returns {Glog} This Glog instance for chaining
   * @example
   * logger.withSymbols({info: '🚒', warn: '🚨', error: '🔥', success: '💧', debug: '🧯'})
   */
  withSymbols(symbols = logSymbols) {
    this.#symbols = Object.assign({}, this.#symbols ?? logSymbols, symbols)

    return this
  }

  /**
   * Disable displaying the logger name in output for this instance
   *
   * @returns {Glog} This Glog instance for chaining
   */
  noDisplayName() {
    this.#displayName = false

    return this
  }

  /**
   * Create a temporary scoped logger with a custom prefix for a single chain
   * The prefix replaces all formatting (name, tags) with just the prefix + message
   *
   * @param {string} prefix - Temporary prefix to use (e.g., "=>", "  ", "-->")
   * @returns {object} Temporary logger with all standard methods
   * @example
   * logger.use("=>").info("Indented message")  // => Indented message
   * logger.info("Back to normal")               // [MyApp] i Back to normal
   */
  use(prefix) {
    return {
      debug: (message, level = 1, ...args) => {
        const currentLevel = this.#logLevel || Glog.logLevel

        if(currentLevel > 0 && level <= currentLevel) {
          Term.debug(`${prefix}${message}`, ...args)
        }
      },
      info: (message, ...args) => Term.info(`${prefix}${message}`, ...args),
      warn: (message, ...args) => Term.warn(`${prefix}${message}`, ...args),
      error: (message, ...args) => Term.error(`${prefix}${message}`, ...args),
      success: (message, ...args) => Term.log(`${prefix}${message}`, ...args),
      log: (...args) => Term.log(prefix, ...args),
      group: (...args) => {
        const label = args.length > 0 ? ` ${args.join(" ")}` : ""

        Term.group(`${prefix}${label}`)
      },
      groupEnd: () => Term.groupEnd(),
      table: (data, labelOrOptions, options) => {
        let label
        let tableOptions = {}

        if(typeof labelOrOptions === "string") {
          label = labelOrOptions
          tableOptions = options || {}
        } else if(typeof labelOrOptions === "object" && labelOrOptions !== null) {
          tableOptions = labelOrOptions
        }

        if(label) {
          Term.log(`${prefix}${label}`)
        }

        Term.table(data, tableOptions)
      }
    }
  }

  // === UTILITY METHODS ===

  /**
   * Get the current logger name
   *
   * @returns {string} The logger name
   */
  get name() {
    return this.#name
  }

  /**
   * Get the current debug level
   *
   * @returns {number} The debug level (0-5)
   */
  get debugLevel() {
    return this.#logLevel
  }

  /**
   * Get the current logger options configuration
   *
   * @returns {object} The logger options
   * @returns {string} return.name - Logger name
   * @returns {number} return.debugLevel - Debug level
   * @returns {string} return.prefix - Log prefix
   * @returns {object} return.colours - Colour configuration
   * @returns {boolean} return.stackTrace - Stack trace enabled
   */
  get options() {
    return {
      name: this.#name,
      debugLevel: this.#logLevel,
      prefix: this.#logPrefix,
      colours: this.#colours,
      stackTrace: this.#stackTrace
    }
  }

  #compose(level, message, debugLevel = 0) {
    const colours = this.#colours || Glog.colours || loggerColours
    const name = this.#name || Glog.name || "Log"
    const useStrings = this.#tagsAsStrings || Glog.tagsAsStrings
    const showName = this.#displayName
    const symbols = this.#symbols || Glog.symbols || logSymbols
    const tag = useStrings ? Util.capitalize(level) : symbols[level]
    const namePrefix = showName ? `[${name}] ` : ""

    if(!colours) {
      return useStrings
        ? `${namePrefix}${tag}: ${message}`
        : `${namePrefix}${tag} ${message}`
    }

    if(level === "debug") {
      const colourCode = colours[level][debugLevel] || colours[level][0]

      return useStrings
        ? c`${namePrefix}${colourCode}${tag}{/}: ${message}`
        : c`${namePrefix}${colourCode}${tag}{/} ${message}`
    }

    return useStrings
      ? c`${namePrefix}${colours[level]}${tag}{/}: ${message}`
      : c`${namePrefix}${colours[level]}${tag}{/} ${message}`
  }

  /**
   * Create a new debug function with a specific tag
   *
   * @param {string} tag - Tag to prepend to debug messages
   * @returns {Function} Debug function with the tag
   */
  newDebug(tag) {
    return function(message, level, ...arg) {
      if(this.#stackTrace || Glog.stackTrace) {
        // extractFileFunction was removed - use original tag as fallback
        // Stack trace extraction is not available in Glog (use Logger for full stack trace support)
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

  /**
   * Log an informational message
   *
   * @param {string} message - Info message to log
   * @param {...unknown} arg - Additional arguments to log
   */
  info(message, ...arg) {
    Term.info(this.#compose("info", message), ...arg)
    this.#vscodeInfo?.(JSON.stringify(message))
  }

  /**
   * Log a warning message
   *
   * @param {string} message - Warning message to log
   * @param {...unknown} arg - Additional arguments to log
   */
  warn(message, ...arg) {
    Term.warn(this.#compose("warn", message), ...arg)
    this.#vscodeWarn?.(JSON.stringify(message))
  }

  /**
   * Log an error message
   *
   * @param {string} message - Error message to log
   * @param {...unknown} arg - Additional arguments to log
   */
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

  /**
   * Instance execute method for configured loggers
   * Can be called as: logger(data) or logger(level, data)
   *
   * @param {...unknown} args - Arguments (optional level number, then data)
   */
  execute(...args) {
    this.#log(...args)
  }

  // === ENHANCED METHODS WITH @gesslar/colours ===

  /**
   * Log a colourized message using template literals
   *
   * @param {Array<string>} strings - Template strings
   * @param {...unknown} values - Template values
   * @example logger.colourize`{success}Operation completed{/} in {bold}${time}ms{/}`
   */
  colourize(strings, ...values) {
    const message = c(strings, ...values)
    const name = this.#name || Glog.name || "Log"

    Term.log(`[${name}] ${message}`)
  }

  /**
   * Static version of colourize for global usage
   *
   * @param {Array<string>} strings - Template strings
   * @param {...unknown} values - Template values
   */
  static colourize(strings, ...values) {
    const message = c(strings, ...values)
    const name = this.name || "Log"

    Term.log(`[${name}] ${message}`)
  }

  /**
   * Log a success message with green colour
   *
   * @param {string} message - Success message
   * @param {...unknown} args - Additional arguments
   */
  success(message, ...args) {
    Term.log(this.#compose("success", message), ...args)
  }

  /**
   * Static success method
   *
   * @param {string} message - Success message to log
   * @param {...unknown} args - Additional arguments to log
   */
  static success(message, ...args) {
    const colours = this.colours || loggerColours
    const name = this.name || "Log"
    const useStrings = this.tagsAsStrings
    const symbols = this.symbols || logSymbols
    const tag = useStrings ? "Success" : symbols.success
    const colourCode = colours.success || "{F046}"
    const formatted = useStrings
      ? c`[${name}] ${colourCode}${tag}{/}: ${message}`
      : c`[${name}] ${colourCode}${tag}{/} ${message}`

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
    const colours = this.colours || loggerColours
    const name = this.name || "Log"
    const useStrings = this.tagsAsStrings
    const symbols = this.symbols || logSymbols
    const tag = useStrings ? "Debug" : symbols.debug
    const colourCode = colours.debug[level] || colours.debug[0]
    const label = useStrings
      ? c`[${name}] ${colourCode}${tag}{/}: ${message}`
      : c`[${name}] ${colourCode}${tag}{/} ${message}`

    Term.group(label)
  }

  /**
   * Static groupInfo - start an info-tagged group
   *
   * @param {string} message - Group label
   */
  static groupInfo(message) {
    const colours = this.colours || loggerColours
    const name = this.name || "Log"
    const useStrings = this.tagsAsStrings
    const symbols = this.symbols || logSymbols
    const tag = useStrings ? "Info" : symbols.info
    const label = useStrings
      ? c`[${name}] ${colours.info}${tag}{/}: ${message}`
      : c`[${name}] ${colours.info}${tag}{/} ${message}`

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
    const symbols = this.symbols || logSymbols
    const tag = useStrings ? "Success" : symbols.success
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
    const symbols = this.#symbols || Glog.symbols || logSymbols
    const tag = useStrings ? "Success" : symbols.success
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
   * Set a colour alias for convenient usage
   *
   * @param {string} alias - Alias name
   * @param {string} colourCode - Colour code (e.g., "{F196}" or "{<B}")
   * @returns {Glog} The Glog class for chaining.
   */
  static setAlias(alias, colourCode) {
    c.alias.set(alias, colourCode)

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
   * @returns {Function} return.debug - Raw debug output function
   * @returns {Function} return.info - Raw info output function
   * @returns {Function} return.warn - Raw warning output function
   * @returns {Function} return.error - Raw error output function
   * @returns {Function} return.log - Raw log output function
   * @returns {Function} return.success - Raw success output function
   * @returns {Function} return.table - Raw table output function
   * @returns {Function} return.group - Raw group start function
   * @returns {Function} return.groupEnd - Raw group end function
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
   * @returns {Function} return.debug - Raw debug output function
   * @returns {Function} return.info - Raw info output function
   * @returns {Function} return.warn - Raw warning output function
   * @returns {Function} return.error - Raw error output function
   * @returns {Function} return.log - Raw log output function
   * @returns {Function} return.success - Raw success output function
   * @returns {Function} return.table - Raw table output function
   * @returns {Function} return.group - Raw group start function
   * @returns {Function} return.groupEnd - Raw group end function
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
