/**
 * @file Font.js
 * @description Utility class for detecting Nerd Fonts installed on the system.
 */

import os from "os"
import {promisify} from "node:util"
import child_process from "node:child_process"

import DirectoryObject from "./DirectoryObject.js"
import FS from "./FileSystem.js"

const execFile = promisify(child_process.execFile)

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
  static async findNerdFonts() {
    const platform = os.platform()

    if(platform === "win32") {
      return this.#findNerdFontsWindows()
    } else if(platform === "darwin") {
      return this.#findNerdFontsMac()
    } else if(platform === "linux") {
      return this.#findNerdFontsLinux()
    } else {
      return []
    }
  }

  /**
   * Checks whether any Nerd Fonts are installed on the system.
   *
   * @returns {Promise<boolean>} True if at least one Nerd Font is installed.
   * @example
   * if(await Font.hasNerdFonts()) {
   *   console.log("Nerd Fonts available - using fancy icons!")
   * }
   */
  static async hasNerdFonts() {
    return (await this.findNerdFonts()).length > 0
  }

  /**
   * Gets the base family names of installed Nerd Fonts.
   * Strips the "NF" or "Nerd Font" suffix to return the core font name.
   *
   * @returns {Promise<Array<string>>} Array of base font family names.
   * @example
   * const families = await Font.getNerdFontFamilies()
   * console.log(families) // ["FiraCode", "JetBrains Mono", ...]
   */
  static async getNerdFontFamilies() {
    const fonts = await this.findNerdFonts()

    // Strip the NF or Nerd Font suffix to get base name
    return fonts.map(f => f.replace(/\s*(NF|Nerd\s*Font.*)$/i, "").trim())
  }

  /**
   * Strips font style suffixes from a font name.
   *
   * @param {string} fontName - The font name to clean.
   * @returns {string} The font name without style suffixes.
   * @private
   */
  static #stripStyles(fontName) {
    return fontName.replace(/[_-]?(Bold|Italic|Regular|Light|Medium|SemiBold|Black|Thin|ExtraLight|ExtraBold|Heavy)(Italic)?$/i, "").trim()
  }

  /**
   * Tests if a font name matches any Nerd Font naming patterns.
   *
   * @param {string} fontName - The font name to test.
   * @param {Array<RegExp>} tests - Array of regex patterns to match against.
   * @returns {boolean} True if the font name matches any pattern.
   * @private
   */
  static #isNerdFontName(fontName, tests) {
    return tests.some(e => e.test(fontName))
  }

  /**
   * Finds Nerd Fonts on Windows by scanning system and user font directories.
   *
   * @returns {Promise<Array<string>>} Array of Nerd Font family names.
   * @private
   */
  static async #findNerdFontsWindows() {
    const fontDirs = [
      new DirectoryObject(FS.resolvePath(process.env.WINDIR || "C:/Windows", "/Fonts"))
    ]

    if(process.env.LOCALAPPDATA) {
      fontDirs.push(new DirectoryObject(FS.resolvePath(process.env.LOCALAPPDATA, "Microsoft/Windows/Fonts")))
    }

    const fontFiles = []

    for(const fontDir of fontDirs) {
      try {
        if(!await fontDir.exists)
          continue

        const {files} = await fontDir.read("*.{ttf,otf}")

        fontFiles.push(...files)
      } catch {
        // Directory doesn't exist or isn't accessible
      }
    }

    return this.#identifyNerdFonts(fontFiles)
  }

  /**
   * Finds Nerd Fonts on macOS by scanning system and user font directories.
   *
   * @returns {Promise<Array<string>>} Array of Nerd Font family names.
   * @private
   */
  static async #findNerdFontsMac() {
    const fontDirs = [
      new DirectoryObject("/Library/Fonts")
    ]

    if(process.env.HOME) {
      fontDirs.push(new DirectoryObject(FS.resolvePath(process.env.HOME, "Library/Fonts")))
    }

    const fontFiles = []

    for(const fontDir of fontDirs) {
      try {
        if(!await fontDir.exists)
          continue

        const {files} = await fontDir.glob("**/*.{ttf,otf}")

        fontFiles.push(...files)
      } catch {
        // Directory doesn't exist or isn't accessible
      }
    }

    return this.#identifyNerdFonts(fontFiles)
  }

  /**
   * Finds Nerd Fonts on Linux using the fc-list command.
   *
   * @returns {Promise<Array<string>>} Array of Nerd Font family names.
   * @private
   */
  static async #findNerdFontsLinux() {
    try {
      const {stdout: fonts} = await execFile(
        "fc-list",
        [":", "family"],
        {encoding: "utf8"}
      )

      const nerdFonts = fonts
        .split("\n")
        .filter(line => line.trim())
        .filter(f => this.#isNerdFontName(f, this.#nerdTestsLinux))
        .map(line => line.split(",")[0].trim())
        .filter((font, idx, arr) => arr.indexOf(font) === idx)
        .sort()

      return nerdFonts
    } catch {
      return []
    }
  }

  /** @type {Array<RegExp>} Patterns to identify Nerd Fonts by filename */
  static #nerdTests = [/nerd/i, / nf[_\s.-]/i]

  /** @type {Array<RegExp>} Patterns to identify Nerd Fonts in fc-list output */
  static #nerdTestsLinux = [/nerd font/i, /\bnf\b/i]

  /**
   * Identifies Nerd Fonts from a list of font file objects.
   *
   * @param {Array<import("./FileObject.js").default>} fileObjects - Array of FileObject instances representing font files.
   * @returns {Array<string>} Sorted array of unique Nerd Font family names.
   * @private
   */
  static #identifyNerdFonts(fileObjects) {
    const nerdFonts = new Set()

    for(const file of fileObjects) {
      const name = file.module

      if(this.#isNerdFontName(name, this.#nerdTests)) {
        nerdFonts.add(this.#stripStyles(name))
      }
    }

    return Array.from(nerdFonts).sort()
  }
}
