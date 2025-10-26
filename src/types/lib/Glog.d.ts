export namespace loggerColours {
    let debug: string[];
    let info: string;
    let warn: string;
    let error: string;
    let reset: string;
}
declare const _default: typeof Glog;
export default _default;
declare class Glog {
    static logLevel: number;
    static logPrefix: string;
    static colors: any;
    static stackTrace: boolean;
    static name: string;
    static setLogPrefix(prefix: any): typeof Glog;
    static setLogLevel(level: any): typeof Glog;
    static withName(name: any): typeof Glog;
    static withColors(colors?: {
        debug: string[];
        info: string;
        warn: string;
        error: string;
        reset: string;
    }): typeof Glog;
    static withStackTrace(enabled?: boolean): typeof Glog;
    static create(options?: {}): Glog;
    static execute(...args: any[]): void;
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
     * Set a color alias for convenient usage
     *
     * @param {string} alias - Alias name
     * @param {string} colorCode - Color code (e.g., "{F196}" or "{<B}")
     * @returns {Glog} The Glog class for chaining.
     */
    static setAlias(alias: string, colorCode: string): Glog;
    constructor(options?: {});
    setOptions(options: any): this;
    withName(name: any): this;
    withLogLevel(level: any): this;
    withPrefix(prefix: any): this;
    withColors(colors?: {
        debug: string[];
        info: string;
        warn: string;
        error: string;
        reset: string;
    }): this;
    withStackTrace(enabled?: boolean): this;
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
     * Get access to the colours template function for instance usage
     *
     * @returns {import('@gesslar/colours')} The colours template function from \@gesslar/colours
     */
    get colours(): typeof import("@gesslar/colours");
    #private;
}
//# sourceMappingURL=Glog.d.ts.map