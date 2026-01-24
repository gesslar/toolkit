/**
 * Utility class for detecting and identifying Nerd Fonts installed on the system.
 * Supports Windows, macOS, and Linux platforms.
 *
 * Nerd Fonts are patched fonts that include additional glyphs such as icons,
 * file type symbols, and powerline characters commonly used in terminal applications.
 *
 * @example
 * // Check if any Nerd Fonts are installed
 * const hasNerd = await Font.hasNerdFonts()
 *
 * @example
 * // Get list of installed Nerd Fonts
 * const fonts = await Font.findNerdFonts()
 * console.log(fonts) // ["FiraCode", "JetBrainsMono", ...]
 */
export default class Font {
    /**
     * Finds all Nerd Fonts installed on the system.
     * Detects the current platform and uses platform-specific methods
     * to locate font files or query the font database.
     *
     * @returns {Promise<Array<string>>} Array of Nerd Font family names, or empty array if none found.
     * @example
     * const nerdFonts = await Font.findNerdFonts()
     * console.log(nerdFonts) // ["FiraCode Nerd Font", "JetBrains Mono NF", ...]
     */
    static findNerdFonts(): Promise<Array<string>>;
    /**
     * Checks whether any Nerd Fonts are installed on the system.
     *
     * @returns {Promise<boolean>} True if at least one Nerd Font is installed.
     * @example
     * if(await Font.hasNerdFonts()) {
     *   console.log("Nerd Fonts available - using fancy icons!")
     * }
     */
    static hasNerdFonts(): Promise<boolean>;
    /**
     * Gets the base family names of installed Nerd Fonts.
     * Strips the "NF" or "Nerd Font" suffix to return the core font name.
     *
     * @returns {Promise<Array<string>>} Array of base font family names.
     * @example
     * const families = await Font.getNerdFontFamilies()
     * console.log(families) // ["FiraCode", "JetBrains Mono", ...]
     */
    static getNerdFontFamilies(): Promise<Array<string>>;
    /**
     * Strips font style suffixes from a font name.
     *
     * @param {string} fontName - The font name to clean.
     * @returns {string} The font name without style suffixes.
     * @private
     */
    private static "__#private@#stripStyles";
    /**
     * Tests if a font name matches any Nerd Font naming patterns.
     *
     * @param {string} fontName - The font name to test.
     * @param {Array<RegExp>} tests - Array of regex patterns to match against.
     * @returns {boolean} True if the font name matches any pattern.
     * @private
     */
    private static "__#private@#isNerdFontName";
    /**
     * Finds Nerd Fonts on Windows by scanning system and user font directories.
     *
     * @returns {Promise<Array<string>>} Array of Nerd Font family names.
     * @private
     */
    private static "__#private@#findNerdFontsWindows";
    /**
     * Finds Nerd Fonts on macOS by scanning system and user font directories.
     *
     * @returns {Promise<Array<string>>} Array of Nerd Font family names.
     * @private
     */
    private static "__#private@#findNerdFontsMac";
    /**
     * Finds Nerd Fonts on Linux using the fc-list command.
     *
     * @returns {Promise<Array<string>>} Array of Nerd Font family names.
     * @private
     */
    private static "__#private@#findNerdFontsLinux";
    /** @type {Array<RegExp>} Patterns to identify Nerd Fonts by filename */
    static "__#private@#nerdTests": Array<RegExp>;
    /** @type {Array<RegExp>} Patterns to identify Nerd Fonts in fc-list output */
    static "__#private@#nerdTestsLinux": Array<RegExp>;
    /**
     * Identifies Nerd Fonts from a list of font file objects.
     *
     * @param {Array<import("./FileObject.js").default>} fileObjects - Array of FileObject instances representing font files.
     * @returns {Array<string>} Sorted array of unique Nerd Font family names.
     * @private
     */
    private static "__#private@#identifyNerdFonts";
}
//# sourceMappingURL=Font.d.ts.map