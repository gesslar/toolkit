import JSON5 from "json5"
import YAML from "yaml"
import BrowserData from "../../browser/lib/Data.js"
import Sass from "./Sass.js"
import Valid from "../../node/lib/Valid.js"

/**
 * Node-side extension of Data with parsing utilities that require
 * node-specific dependencies.
 */
export default class Data extends BrowserData {
  static LOAD_DATA_TYPES = Object.freeze({
    json: Object.freeze([JSON]),    // least permissive
    json5: Object.freeze([JSON5]),
    yaml: Object.freeze([YAML]),    // most permissive
  })

  /**
   * Parses text content as structured data (JSON, JSON5, or YAML).
   *
   * The `json` type uses strict JSON parsing and will NOT accept JSON5
   * extensions (comments, trailing commas, unquoted keys); use `json5` for
   * that. The `any` type tries each format from least to most permissive.
   *
   * @param {string} source - The text content to parse
   * @param {string} [type="any"] - The expected format ("json", "json5",
   *  "yaml", or "any")
   * @returns {unknown} The parsed data
   * @throws {Sass} If content cannot be parsed or type is unsupported
   */
  static textAsData(source, type="any") {
    Valid.type(source, "String")
    Valid.type(type, "String")

    const normalizedType = type.toLowerCase()

    Valid.assert(
      normalizedType === "any" || Object.hasOwn(this.LOAD_DATA_TYPES, normalizedType),
      `Type must be one of any, ${Object.keys(this.LOAD_DATA_TYPES).join(", ")}.`
    )

    const toTry = normalizedType === "any"
      ? Object.values(this.LOAD_DATA_TYPES).flat()
      : this.LOAD_DATA_TYPES[normalizedType]

    for(const format of toTry) {
      try {
        const result = format.parse(source)

        return result
      } catch {
        // nothing to see here
      }
    }

    const tried = toTry.map(format =>
      format === JSON
        ? "JSON"
        : format === JSON5
          ? "JSON5"
          : "YAML")

    throw Sass.new(
      `Content is not valid ${tried.join(" or ")}.`)
  }
}
