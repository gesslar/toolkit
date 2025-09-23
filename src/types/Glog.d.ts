// Implementation: ../lib/Glog.js

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
 * ```typescript
 * // Set up logging configuration
 * Glog.setLogLevel(3).setLogPrefix('[MyApp]')
 *
 * // Log messages with different levels
 * Glog(0, 'Critical error')  // Always shown
 * Glog(2, 'Debug info')      // Shown if logLevel >= 2
 * Glog('Simple message')     // Level 0 by default
 * ```
 */
interface GlogInterface {
  /**
   * Sets the log prefix for all subsequent log messages.
   * The prefix helps identify the source of log messages in complex
   * applications with multiple components.
   *
   * @param prefix - The prefix string to prepend to log messages
   * @returns Returns the Glog class for method chaining
   */
  setLogPrefix(prefix: string): typeof Glog

  /**
   * Sets the minimum log level for messages to be displayed.
   * Messages with a level higher than this threshold will be filtered out.
   * Log levels range from 0 (critical) to 5 (verbose debug).
   *
   * @param level - The minimum log level (0-5, clamped to range)
   * @returns Returns the Glog class for method chaining
   */
  setLogLevel(level: number): typeof Glog

  /**
   * Executes a log operation with the provided arguments.
   * This method serves as the entry point for all logging operations.
   *
   * @param args - Log level (optional) followed by message arguments
   */
  execute(...args: any[]): void
}

/**
 * Callable interface for the proxied Glog class.
 * Allows the class to be used as a function.
 */
interface GlogCallable {
  /**
   * Log a message with optional level specification.
   * 
   * @param args - Either (level: number, ...messages) or (...messages)
   */
  (...args: any[]): void
}

/**
 * The Glog class with proxy functionality for callable behavior.
 * Can be used both as a static class and as a callable function.
 */
declare const Glog: GlogInterface & GlogCallable

export default Glog