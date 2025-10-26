export default class Term {
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
    static resetTerminal(): Promise<void>;
    static clearLines(num: any): Promise<void>;
    static directWrite(output: any): Promise<any>;
}
//# sourceMappingURL=Term.d.ts.map