// Implementation: ../lib/Glog.js

/**
 * Color configuration object for log levels.
 * Uses \@gesslar/colours format strings.
 */
export interface LoggerColours {
  debug: [string, string, string, string, string]
  info: string
  warn: string
  error: string
  reset: string
}

/**
 * Configuration options for Glog instance creation.
 */
export interface GlogOptions {
  /** Logger name (appears in composed messages) */
  name?: string
  /** Debug level (0-5, alias for logLevel) */
  debugLevel?: number
  /** Log level (0-5) */
  logLevel?: number
  /** Message prefix */
  prefix?: string
  /** Custom colors configuration */
  colors?: LoggerColours
  /** Enable stack trace extraction */
  stackTrace?: boolean
  /** Environment type ('extension' for VSCode integration) */
  env?: string
}

/**
 * Enhanced global logging utility combining simple logging with advanced Logger features.
 *
 * Glog can be used in multiple ways:
 * 1. Simple function call: `Glog(data)` or `Glog(2, "debug message")`
 * 2. Configured instance: `new Glog(options)`
 * 3. Fluent setup: `Glog.create().withName("App").withColors()`
 * 4. Traditional logger: `logger.debug("message", level)`
 *
 * Features:
 * - Log level filtering (0-5)
 * - Custom prefixes for message organization
 * - Color support via \@gesslar/colours
 * - Traditional logger methods (debug, info, warn, error, success)
 * - Template literal color formatting
 * - VSCode extension integration
 * - Static and instance usage patterns
 *
 * @example
 * ```typescript
 * import { Glog } from '@gesslar/toolkit'
 *
 * // Simple usage with static configuration
 * Glog.setLogLevel(3).setLogPrefix('[MyApp]')
 * Glog(0, 'Critical error!')
 * Glog(2, 'Debug info:', data)
 *
 * // Instance usage with configuration
 * const logger = new Glog({ name: 'API', logLevel: 2 })
 * logger.debug('Processing request', 1)
 * logger.info('Request completed')
 * logger.error('Request failed')
 *
 * // Fluent instance creation
 * const log = Glog.create()
 *   .withName('Database')
 *   .withLogLevel(3)
 *   .withColors()
 *
 * // Color template literals
 * logger.colorize`{success}Operation completed{/} in {bold}${time}ms{/}`
 * logger.success('All tests passed!')
 * ```
 */
declare class Glog {
  /** Current static log level (0-5) */
  static logLevel: number
  /** Current static log prefix */
  static logPrefix: string
  /** Current static color configuration */
  static colors: LoggerColours | null
  /** Whether stack traces are enabled globally */
  static stackTrace: boolean
  /** Global logger name */
  static name: string

  /**
   * Create a new Glog instance with optional configuration.
   *
   * @param options - Configuration options
   */
  constructor(options?: GlogOptions)

  // === STATIC CONFIGURATION METHODS ===

  /**
   * Set the global log prefix for all messages.
   *
   * @param prefix - Prefix string to prepend to messages
   * @returns The Glog class for chaining
   */
  static setLogPrefix(prefix: string): typeof Glog

  /**
   * Set the global log level threshold.
   * Messages with levels higher than this are filtered out.
   *
   * @param level - Log level (0-5, automatically clamped)
   * @returns The Glog class for chaining
   */
  static setLogLevel(level: number): typeof Glog

  /**
   * Set the global logger name.
   *
   * @param name - Logger name
   * @returns The Glog class for chaining
   */
  static withName(name: string): typeof Glog

  /**
   * Configure global color settings.
   *
   * @param colors - Color configuration (defaults to loggerColours)
   * @returns The Glog class for chaining
   */
  static withColors(colors?: LoggerColours): typeof Glog

  /**
   * Enable or disable global stack trace extraction.
   *
   * @param enabled - Whether to enable stack traces (default: true)
   * @returns The Glog class for chaining
   */
  static withStackTrace(enabled?: boolean): typeof Glog

  /**
   * Create a new Glog instance (fluent factory method).
   *
   * @param options - Configuration options
   * @returns New Glog instance
   */
  static create(options?: GlogOptions): Glog

  /**
   * Log a colorized message using template literals (static).
   *
   * @param strings - Template strings
   * @param values - Template values
   */
  static colorize(strings: TemplateStringsArray, ...values: unknown[]): void

  /**
   * Log a success message with green color (static).
   *
   * @param message - Success message
   * @param args - Additional arguments
   */
  static success(message: string, ...args: unknown[]): void

  /**
   * Set a color alias for convenient usage.
   *
   * @param alias - Alias name
   * @param colorCode - Color code (e.g., "{F196}" or "{<B}")
   * @returns The Glog class for chaining
   */
  static setAlias(alias: string, colorCode: string): typeof Glog

  // === INSTANCE CONFIGURATION METHODS ===

  /**
   * Set instance options.
   *
   * @param options - Configuration options
   * @returns This instance for chaining
   */
  setOptions(options: GlogOptions): this

  /**
   * Set instance logger name (fluent).
   *
   * @param name - Logger name
   * @returns This instance for chaining
   */
  withName(name: string): this

  /**
   * Set instance log level (fluent).
   *
   * @param level - Log level (0-5)
   * @returns This instance for chaining
   */
  withLogLevel(level: number): this

  /**
   * Set instance prefix (fluent).
   *
   * @param prefix - Message prefix
   * @returns This instance for chaining
   */
  withPrefix(prefix: string): this

  /**
   * Configure instance colors (fluent).
   *
   * @param colors - Color configuration (defaults to loggerColours)
   * @returns This instance for chaining
   */
  withColors(colors?: LoggerColours): this

  /**
   * Enable or disable instance stack trace extraction (fluent).
   *
   * @param enabled - Whether to enable stack traces (default: true)
   * @returns This instance for chaining
   */
  withStackTrace(enabled?: boolean): this

  // === INSTANCE PROPERTIES ===

  /** Instance logger name */
  get name(): string

  /** Instance debug/log level */
  get debugLevel(): number

  /** Instance configuration options */
  get options(): {
    name: string
    debugLevel: number
    prefix: string
    colors: LoggerColours | null
    stackTrace: boolean
  }

  /** Access to colours template function */
  get colours(): any

  // === INSTANCE LOGGING METHODS ===

  /**
   * Log a debug message with optional level.
   * Level 0 means debug OFF - use levels 1-4 for debug verbosity.
   * Debug messages only show when logLevel > 0.
   *
   * @param message - Debug message
   * @param level - Debug level (1-4, default: 1)
   * @param arg - Additional arguments
   * @throws {Error} If level < 1 (level 0 = debug OFF, not a valid debug level)
   */
  debug(message: string, level?: number, ...arg: unknown[]): void

  /**
   * Log an informational message.
   *
   * @param message - Info message
   * @param arg - Additional arguments
   */
  info(message: string, ...arg: unknown[]): void

  /**
   * Log a warning message.
   *
   * @param message - Warning message
   * @param arg - Additional arguments
   */
  warn(message: string, ...arg: unknown[]): void

  /**
   * Log an error message.
   *
   * @param message - Error message
   * @param arg - Additional arguments
   */
  error(message: string, ...arg: unknown[]): void

  /**
   * Log a colorized message using template literals (instance).
   *
   * @param strings - Template strings
   * @param values - Template values
   */
  colorize(strings: TemplateStringsArray, ...values: unknown[]): void

  /**
   * Log a success message with green color (instance).
   *
   * @param message - Success message
   * @param args - Additional arguments
   */
  success(message: string, ...args: unknown[]): void

  /**
   * Execute instance logging (supports level filtering).
   *
   * @param args - Log level (optional) followed by message arguments
   */
  execute(...args: unknown[]): void

  /**
   * Create a new debug function with tag extraction.
   *
   * @param tag - Tag name (will be replaced by extracted function info)
   * @returns Bound debug function
   */
  newDebug(tag: string): (message: string, level: number, ...arg: unknown[]) => void

  /**
   * Extract file and function information from call stack.
   * Simplified implementation returns "caller" by default.
   *
   * @returns Caller information string
   */
  extractFileFunction(): string
}

/**
 * Callable interface for the proxied Glog export.
 * The default export is a Proxy that allows both class and function usage.
 */
interface GlogCallable {
  /**
   * Log a message with optional level specification.
   * First argument can be a number (level) or part of the message.
   *
   * @param args - Either (level: number, ...messages) or (...messages)
   */
  (...args: unknown[]): void
}

/**
 * The Glog export: a Proxy combining class methods with callable behavior.
 * Can be used as:
 * - A function: `Glog(message)` or `Glog(level, message)`
 * - A class: `new Glog(options)`
 * - Static methods: `Glog.setLogLevel(3)`
 */
declare const GlogExport: typeof Glog & GlogCallable

export default GlogExport
