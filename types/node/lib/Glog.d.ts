export namespace loggerColours {
    let debug: string[];
    let info: string;
    let warn: string;
    let error: string;
    let success: string;
    let reset: string;
}
export namespace logSymbols {
    let debug_1: string;
    export { debug_1 as debug };
    let info_1: string;
    export { info_1 as info };
    let warn_1: string;
    export { warn_1 as warn };
    let error_1: string;
    export { error_1 as error };
    let success_1: string;
    export { success_1 as success };
}
declare const _default: typeof Glog;
export default _default;
declare class Glog {
    static logLevel: number;
    static logPrefix: string;
    static colors: any;
    static stackTrace: boolean;
    static name: string;
    static tagsAsStrings: boolean;
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
    static withColors(colors?: object): typeof Glog;
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
     * Static version of colorize for global usage
     *
     * @param {Array<string>} strings - Template strings
     * @param {...unknown} values - Template values
     */
    static colorize(strings: Array<string>, ...values: unknown[]): void;
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
     * Set a color alias for convenient usage
     *
     * @param {string} alias - Alias name
     * @param {string} colorCode - Color code (e.g., "{F196}" or "{<B}")
     * @returns {Glog} The Glog class for chaining.
     */
    static setAlias(alias: string, colorCode: string): Glog;
    /**
     * Static raw logger that outputs without name/tag formatting
     *
     * @returns {object} Raw logger interface
     */
    static get raw(): object;
    constructor(options?: {});
    setOptions(options: any): this;
    withName(name: any): this;
    withLogLevel(level: any): this;
    withPrefix(prefix: any): this;
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
    withColors(colors?: object): Glog;
    withStackTrace(enabled?: boolean): this;
    withTagsAsStrings(enabled?: boolean): this;
    noDisplayName(): this;
    get name(): string;
    get debugLevel(): number;
    get options(): {
        name: string;
        debugLevel: number;
        prefix: string;
        colors: any;
        stackTrace: boolean;
    };
    extractFileFunction(): string;
    newDebug(tag: any): any;
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
    info(message: any, ...arg: any[]): void;
    warn(message: any, ...arg: any[]): void;
    error(message: any, ...arg: any[]): void;
    execute(...args: any[]): void;
    /**
     * Log a colorized message using template literals
     *
     * @param {Array<string>} strings - Template strings
     * @param {...unknown} values - Template values
     * @example logger.colorize`{success}Operation completed{/} in {bold}${time}ms{/}`
     */
    colorize(strings: Array<string>, ...values: unknown[]): void;
    /**
     * Log a success message with green color
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
     */
    get raw(): object;
    #private;
}
//# sourceMappingURL=Glog.d.ts.map