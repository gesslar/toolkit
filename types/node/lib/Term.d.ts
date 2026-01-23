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
    static terminalMessage(argList: string | Array<string | [string, string] | [string, string, string]>): void;
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
    static terminalBracket([level, text, brackets]: Array<string>): string;
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
    static "__#private@#spinFrames": string[];
}
//# sourceMappingURL=Term.d.ts.map