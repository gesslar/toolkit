/**
 * Terminal output utilities with ANSI colour support.
 *
 * Provides console logging wrappers, cursor control, and formatted message
 * output with colour styling via `@gesslar/colours`.
 *
 * Predefined colour aliases:
 * - `success` - green (F035)
 * - `info` - blue (F033)
 * - `warn` - orange (F208)
 * - `error` - red (F032)
 * - `modified` - purple (F147)
 */
export default class Term {
    static "__#private@#cache": Map<any, any>;
    static "__#private@#preformat"(text: any): any;
    /**
     * Terminal width in columns.
     *
     * @type {number | undefined}
     */
    static get columns(): number | undefined;
    /**
     * Terminal height in rows.
     *
     * @type {number | undefined}
     */
    static get rows(): number | undefined;
    /**
     * Terminal dimensions as an object.
     *
     * @type {{columns: number | undefined, rows: number | undefined}}
     */
    static get dim(): {
        columns: number | undefined;
        rows: number | undefined;
    };
    /**
     * Whether the terminal is interactive (TTY and not in CI).
     *
     * @type {boolean}
     */
    static get isInteractive(): boolean;
    /**
     * Whether the terminal supports color output.
     *
     * @type {boolean}
     */
    static get hasColor(): boolean;
    /**
     * Log an informational message.
     *
     * @param {...unknown} [arg] - Values to log.
     */
    static log(...arg?: unknown[]): void;
    /**
     * Log an informational message.
     *
     * @param {...unknown} [arg] - Values to log.
     */
    static info(...arg?: unknown[]): void;
    /**
     * Log a warning message.
     *
     * @param {...unknown} [arg] - Warning text / object.
     */
    static warn(...arg?: unknown[]): void;
    /**
     * Log an error message (plus optional details).
     *
     * @param {...unknown} [arg] - Values to log.
     */
    static error(...arg?: unknown[]): void;
    /**
     * Log a debug message (no-op unless console.debug provided/visible by env).
     *
     * @param {...unknown} [arg] - Values to log.
     */
    static debug(...arg?: unknown[]): void;
    /**
     * Start a console group for indented output.
     *
     * @param {...unknown} [arg] - Optional group label.
     */
    static group(...arg?: unknown[]): void;
    /**
     * End the current console group.
     */
    static groupEnd(): void;
    /**
     * Display tabular data as a table.
     *
     * @param {object | Array} tabularData - Object or array to display.
     * @param {object} [options] - Table options.
     * @param {Array<string>} [options.properties] - Optional column properties to display.
     * @param {boolean} [options.showHeader=false] - Whether to show the header row with column names.
     * @param {boolean} [options.quotedStrings=false] - Whether to show quotes around strings.
     */
    static table(tabularData: object | any[], options?: {
        properties?: Array<string>;
        showHeader?: boolean;
        quotedStrings?: boolean;
    }): void;
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
    static status(args: string | Array<string | [string, string]>, { silent }?: {
        silent: boolean;
    }): void;
    /**
     * Constructs a formatted status line with optional colour styling.
     *
     * Input forms:
     *  - string: printed as-is
     *  - array: each element is either:
     *    - a plain string (emitted unchanged), or
     *    - a tuple: [colourCode, text] where `colourCode` is a colour alias
     *        (e.g. success, info, warn, error, modified) or any valid
     *        `@gesslar/colours` format string.
     *    - a tuple: [colourCode, text, [openBracket, closeBracket]] for custom
     *        brackets around the colourised text.
     *
     * The function performs a shallow validation: tuple elements must both be
     * strings; otherwise a TypeError is thrown. Nested arrays beyond depth 1 are
     * not supported.
     *
     * Recursion: array input is normalised into a single string then re-dispatched
     * through `status` to leverage the string branch (keeps logic DRY).
     *
     * @param {string | Array<string | [string, string] | [string, string, [string, string]]>} argList - Message spec.
     * @returns {string} The formatted message string.
     */
    static terminalMessage(argList: string | Array<string | [string, string] | [string, string, [string, string]]>): string;
    /**
     * Construct a single coloured bracketed segment from a tuple specifying
     * the colour code and text. The first element is a colour code that can be
     * a predefined alias (success, info, warn, error, modified) or any valid
     * `@gesslar/colours` format string. The brackets are coloured while the
     * inner text remains uncoloured.
     *
     * Input validation: colourCode and text must both be strings; otherwise
     * a `Sass` error is thrown.
     *
     * Example:
     *  terminalBracket(["success", "COMPILED"]) → "[COMPILED]" with green
     *  brackets (assuming colour support is available in the terminal).
     *
     *  terminalBracket(["info", "STATUS", ["<", ">"]]) → "<STATUS>" with blue
     *  angle brackets.
     *
     * This method does not append trailing spaces; callers are responsible for
     * joining multiple segments with appropriate separators.
     *
     * @param {[string, string, [string, string]?]} parts - Tuple: [colourCode, text, brackets?].
     * @returns {string} Colourised bracketed segment (e.g. "[TEXT]").
     * @throws {Sass} If colourCode or text is not a string.
     */
    static terminalBracket([colourCode, text, brackets]: [string, string, [string, string]?]): string;
    /**
     * ANSI escape sequence to move cursor to start of line.
     *
     * @type {string}
     */
    static get start(): string;
    /**
     * Move cursor to start of line (interactive terminals only).
     *
     * @returns {typeof Term} The Term class for chaining.
     */
    static moveStart(): typeof Term;
    /**
     * ANSI escape sequence to move cursor to end of line.
     *
     * @type {string}
     */
    static get end(): string;
    /**
     * Move cursor to end of line (interactive terminals only).
     *
     * @returns {typeof Term} The Term class for chaining.
     */
    static moveEnd(): typeof Term;
    /**
     * ANSI escape sequence to move cursor up one line.
     *
     * @type {string}
     */
    static get up(): string;
    /**
     * Move cursor up by specified number of lines (interactive terminals only).
     *
     * @param {number} num - Number of lines to move up.
     * @returns {typeof Term} The Term class for chaining.
     */
    static moveUp(num: number): typeof Term;
    /**
     * Hide the terminal cursor (interactive terminals only).
     *
     * @returns {typeof Term} The Term class for chaining.
     */
    static hideCursor(): typeof Term;
    /**
     * Show the terminal cursor (interactive terminals only).
     *
     * @returns {typeof Term} The Term class for chaining.
     */
    static showCursor(): typeof Term;
    /**
     * Whether the terminal is in character (raw) input mode.
     *
     * @type {boolean}
     */
    static get isCharMode(): boolean;
    /**
     * Whether the terminal is in line (buffered) input mode.
     *
     * @type {boolean}
     */
    static get isLineMode(): boolean;
    /**
     * Set terminal to character mode (raw input, interactive terminals only).
     *
     * @returns {typeof Term} The Term class for chaining.
     */
    static setCharMode(): typeof Term;
    /**
     * Set terminal to line mode (buffered input, interactive terminals only).
     *
     * @returns {typeof Term} The Term class for chaining.
     */
    static setLineMode(): typeof Term;
    /**
     * Clear the current line (interactive terminals only).
     *
     * @returns {typeof Term} The Term class for chaining.
     */
    static clearLine(): typeof Term;
    /**
     * Clear multiple lines by moving up and clearing each (interactive terminals only).
     *
     * @param {number} num - Number of lines to clear.
     * @returns {typeof Term} The Term class for chaining.
     */
    static clearLines(num: number): typeof Term;
    /**
     * Write output to stdout asynchronously (fire-and-forget).
     *
     * @param {string} output - The string to write.
     * @returns {typeof Term} The Term class for chaining.
     */
    static write(output: string): typeof Term;
    /**
     * Returns a promise that resolves with the next chunk of data from stdin.
     * If in Char Mode, it resolves on Enter, Ctrl+D, or the ANSI 'R' terminator.
     *
     * @param {(text: string) => boolean} [terminator] - Optional callback to check if input is complete.
     * @returns {Promise<string>} Resolves with the input data.
     */
    static data(terminator?: (text: string) => boolean): Promise<string>;
    /**
     * Gets the current cursor position in the terminal.
     *
     * @returns {Promise<[number, number]>} Resolves with [x, y] cursor position.
     */
    static getCursorPosition(): Promise<[number, number]>;
    /**
     * Write output to stdout and return a promise that resolves when complete.
     *
     * @param {string} output - The string to write.
     * @returns {Promise<void>} Resolves when write completes.
     */
    static directWrite(output: string): Promise<void>;
    static spinFrames: readonly string[];
    /**
     * Pause stdin, preventing it from emitting data events.
     *
     * @returns {typeof Term} The Term class for chaining.
     */
    static pause(): typeof Term;
    /**
     * Resume stdin so it can emit data events.
     *
     * @returns {typeof Term} The Term class for chaining.
     */
    static resume(): typeof Term;
    /**
     * Set stdin encoding to UTF-8.
     *
     * @returns {typeof Term} The Term class for chaining.
     */
    static utf8(): typeof Term;
}
//# sourceMappingURL=Term.d.ts.map