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
export const loggerColours: object;
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
export const logSymbols: object;
declare const _default: typeof Glog;
export default _default;
declare class Glog {
    static logLevel: number;
    static logPrefix: string;
    static colours: any;
    static stackTrace: boolean;
    static name: string;
    static tagsAsStrings: boolean;
    static symbols: any;
    /**
     * Set the log prefix for global usage
     *
     * @param {string} prefix - Prefix to prepend to all log messages
     * @returns {typeof Glog} The Glog class for chaining
     */
    static setLogPrefix(prefix: string): typeof Glog;
    /**
     * Set the log level for global usage (0-5)
     *
     * @param {number} level - Log level (0 = off, 1-5 = increasing verbosity)
     * @returns {typeof Glog} The Glog class for chaining
     */
    static setLogLevel(level: number): typeof Glog;
    /**
     * Set the logger name for global usage
     *
     * @param {string} name - Logger name to display in output
     * @returns {typeof Glog} The Glog class for chaining
     */
    static withName(name: string): typeof Glog;
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
    static withColours(colours?: object): typeof Glog;
    /**
     * Enable stack trace extraction for global usage
     *
     * @param {boolean} [enabled=true] - Whether to enable stack traces
     * @returns {typeof Glog} The Glog class for chaining
     */
    static withStackTrace(enabled?: boolean): typeof Glog;
    /**
     * Use tag names as strings instead of symbols for global usage
     *
     * @param {boolean} [enabled=false] - Whether to use string tags
     * @returns {typeof Glog} The Glog class for chaining
     */
    static withTagsAsStrings(enabled?: boolean): typeof Glog;
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
    static withSymbols(symbols?: object): typeof Glog;
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
    static use(prefix: string): object;
    /**
     * Create a new Glog instance with fluent configuration
     *
     * @param {object} [options={}] - Initial options
     * @returns {Glog} New Glog instance
     */
    static create(options?: object): Glog;
    /**
     * Core execute method for simple static usage
     * Can be called as: Glog(data) or Glog(level, data)
     *
     * @param {...unknown} args - Arguments (optional level number, then data)
     */
    static execute(...args: unknown[]): void;
    /**
     * Static version of colourize for global usage
     *
     * @param {Array<string>} strings - Template strings
     * @param {...unknown} values - Template values
     */
    static colourize(strings: Array<string>, ...values: unknown[]): void;
    /**
     * Static success method
     *
     * @param {string} message - Success message to log
     * @param {...unknown} args - Additional arguments to log
     */
    static success(message: string, ...args: unknown[]): void;
    /**
     * Static group method - start a console group for indented output
     *
     * @param {...unknown} args - Optional group label
     */
    static group(...args: unknown[]): void;
    /**
     * Static groupEnd method - end the current console group
     */
    static groupEnd(): void;
    /**
     * Static groupDebug - start a debug-tagged group
     *
     * @param {string} message - Group label
     * @param {number} [level=1] - Debug level
     */
    static groupDebug(message: string, level?: number): void;
    /**
     * Static groupInfo - start an info-tagged group
     *
     * @param {string} message - Group label
     */
    static groupInfo(message: string): void;
    /**
     * Static groupSuccess - start a success-tagged group
     *
     * @param {string} message - Group label
     */
    static groupSuccess(message: string): void;
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
    static table(data: object | any[], labelOrOptions?: string | object, options?: {
        properties?: Array<string>;
        showHeader?: boolean;
        quotedStrings?: boolean;
    }): void;
    /**
     * Set a colour alias for convenient usage
     *
     * @param {string} alias - Alias name
     * @param {string} colourCode - Colour code (e.g., "{F196}" or "{<B}")
     * @returns {Glog} The Glog class for chaining.
     */
    static setAlias(alias: string, colourCode: string): Glog;
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
    static get raw(): object;
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
    constructor(options?: {
        name?: string;
        debugLevel?: number;
        logLevel?: number;
        prefix?: string;
        colours?: object;
        symbols?: object;
        stackTrace?: boolean;
        tagsAsStrings?: boolean;
        displayName?: boolean;
        env?: string;
    });
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
    setOptions(options: {
        name?: string;
        debugLevel?: number;
        logLevel?: number;
        prefix?: string;
        colours?: object;
        symbols?: object;
        stackTrace?: boolean;
        tagsAsStrings?: boolean;
        displayName?: boolean;
    }): Glog;
    /**
     * Set the logger name for this instance
     *
     * @param {string} name - Logger name to display in output
     * @returns {Glog} This Glog instance for chaining
     */
    withName(name: string): Glog;
    /**
     * Set the log level for this instance (0-5)
     *
     * @param {number} level - Log level (0 = off, 1-5 = increasing verbosity)
     * @returns {Glog} This Glog instance for chaining
     */
    withLogLevel(level: number): Glog;
    /**
     * Set the log prefix for this instance
     *
     * @param {string} prefix - Prefix to prepend to all log messages
     * @returns {Glog} This Glog instance for chaining
     */
    withPrefix(prefix: string): Glog;
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
    withColours(colours?: object): Glog;
    /**
     * Enable or disable stack trace extraction for this instance
     *
     * @param {boolean} [enabled=true] - Whether to enable stack traces
     * @returns {Glog} This Glog instance for chaining
     */
    withStackTrace(enabled?: boolean): Glog;
    /**
     * Use tag names as strings instead of symbols for this instance
     *
     * @param {boolean} [enabled=false] - Whether to use string tags
     * @returns {Glog} This Glog instance for chaining
     */
    withTagsAsStrings(enabled?: boolean): Glog;
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
    withSymbols(symbols?: object): Glog;
    /**
     * Disable displaying the logger name in output for this instance
     *
     * @returns {Glog} This Glog instance for chaining
     */
    noDisplayName(): Glog;
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
    use(prefix: string): object;
    /**
     * Get the current logger name
     *
     * @returns {string} The logger name
     */
    get name(): string;
    /**
     * Get the current debug level
     *
     * @returns {number} The debug level (0-5)
     */
    get debugLevel(): number;
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
    get options(): object;
    /**
     * Extract file and function information from stack trace
     *
     * @private
     * @returns {string} Caller tag
     */
    private extractFileFunction;
    /**
     * Create a new debug function with a specific tag
     *
     * @param {string} tag - Tag to prepend to debug messages
     * @returns {Function} Debug function with the tag
     */
    newDebug(tag: string): Function;
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
    debug(message: string, level?: number, ...arg: unknown[]): void;
    /**
     * Log an informational message
     *
     * @param {string} message - Info message to log
     * @param {...unknown} arg - Additional arguments to log
     */
    info(message: string, ...arg: unknown[]): void;
    /**
     * Log a warning message
     *
     * @param {string} message - Warning message to log
     * @param {...unknown} arg - Additional arguments to log
     */
    warn(message: string, ...arg: unknown[]): void;
    /**
     * Log an error message
     *
     * @param {string} message - Error message to log
     * @param {...unknown} arg - Additional arguments to log
     */
    error(message: string, ...arg: unknown[]): void;
    /**
     * Instance execute method for configured loggers
     * Can be called as: logger(data) or logger(level, data)
     *
     * @param {...unknown} args - Arguments (optional level number, then data)
     */
    execute(...args: unknown[]): void;
    /**
     * Log a colourized message using template literals
     *
     * @param {Array<string>} strings - Template strings
     * @param {...unknown} values - Template values
     * @example logger.colourize`{success}Operation completed{/} in {bold}${time}ms{/}`
     */
    colourize(strings: Array<string>, ...values: unknown[]): void;
    /**
     * Log a success message with green colour
     *
     * @param {string} message - Success message
     * @param {...unknown} args - Additional arguments
     */
    success(message: string, ...args: unknown[]): void;
    /**
     * Start a console group for indented output
     *
     * @param {...unknown} args - Optional group label
     */
    group(...args: unknown[]): void;
    /**
     * End the current console group
     */
    groupEnd(): void;
    /**
     * Start a debug-tagged group
     *
     * @param {string} message - Group label
     * @param {number} [level=1] - Debug level
     */
    groupDebug(message: string, level?: number): void;
    /**
     * Start an info-tagged group
     *
     * @param {string} message - Group label
     */
    groupInfo(message: string): void;
    /**
     * Start a success-tagged group
     *
     * @param {string} message - Group label
     */
    groupSuccess(message: string): void;
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
    table(data: object | any[], labelOrOptions?: string | object, options?: {
        properties?: Array<string>;
        showHeader?: boolean;
        quotedStrings?: boolean;
    }): void;
    /**
     * Get access to the colours template function for instance usage
     *
     * @returns {import('@gesslar/colours')} The colours template function from \@gesslar/colours
     */
    get colours(): any;
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
    get raw(): object;
    #private;
}
//# sourceMappingURL=Glog.d.ts.map