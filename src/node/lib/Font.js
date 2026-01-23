import os from "os"
import {promisify} from "node:util"
import child_process from "node:child_process"

import {DirectoryObject, FileSystem as FS} from "../../node/index.js"

const execFile = promisify(child_process.execFile)

export default class Font {
  static async findNerdFonts() {
    const platform = os.platform()

    if(platform === "win32") {
      return this.#findNerdFontsWindows()
    } else if(platform === "darwin") {
      return this.#findNerdFontsMac()
    } else if(platform === "linux") {
      return this.#findNerdFontsLinux()
    } else {
      return false
    }
  }

  static async hasNerdFonts() {
    return (await this.findNerdFonts()).length > 0
  }

  static async getNerdFontFamilies() {
    const fonts = await this.findNerdFonts()

    // Strip the NF or Nerd Font suffix to get base name
    return fonts.map(f => f.replace(/\s*(NF|Nerd\s*Font.*)$/i, "").trim())
  }

  static #stripStyles(fontName) {
    return fontName.replace(/[_-]?(Bold|Italic|Regular|Light|Medium|SemiBold|Black|Thin|ExtraLight|ExtraBold|Heavy)(Italic)?$/i, "").trim()
  }

  static #isNerdFontName(fontName, tests) {
    return tests.some(e => e.test(fontName))
  }

  static async #findNerdFontsWindows() {
    const fontDirs = [
      new DirectoryObject(FS.resolvePath(process.env.WINDIR || "C:/Windows", "/Fonts")),
      new DirectoryObject(FS.resolvePath(process.env.LOCALAPPDATA, "Microsoft/Windows/Fonts"))
    ]

    const fontFiles = []

    for(const fontDir of fontDirs) {
      const {files} = fontDir.read("*.{ttf,otf}")

      fontFiles.push(...files)
    }

    return this.#identifyNerdFonts(fontFiles)
  }

  static async #findNerdFontsMac() {
    const fontDirs = [
      "/Library/Fonts",
      new DirectoryObject(FS.resolvePath(process.env.HOME, "Library/Fonts"))
    ]

    const fontFiles = []

    for(const fontDir of fontDirs) {
      const {files} = fontDir.glob("**/*.{ttf,otf}")

      fontFiles.push(...files)
    }

    return this.#identifyNerdFonts(fontFiles)
  }

  static async #findNerdFontsLinux() {
    try {
      const {stdout: fonts, stderr} = await execFile(
        "fc-list",
        [":", "family"],
        {encoding: "utf8"}
      )

      if(stderr)
        throw Sass.new(stderr)

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

  static #nerdTests = [/nerd/i, / nf[_\s.-]/i]
  static #nerdTestsLinux = [/nerd font/i, /\bnf\b/i]

  static async #identifyNerdFonts(directoryObjects) {
    const nerdFonts = new Set()

    for(const dir of directoryObjects) {
      if(!await dir.exists)
        continue

      try {
        const {files} = await dir.read("*.{ttf,otf}")

        files
          .map(f => f.module)
          .filter(f => this.#isNerdFontName(f, this.#nerdTests))
          .forEach(f => nerdFonts.add(this.#stripStyles(f)))
      } catch {}
    }

    return Array.from(nerdFonts).sort()
  }
}
