import JSON5 from "json5"
import YAML from "yaml"
import BrowserData from "../../browser/lib/Data.js"
import Sass from "./Sass.js"

/**
 * Node-side extension of Data with parsing utilities that require
 * node-specific dependencies.
 */
export default class Data extends BrowserData {
  /**
   * Parses text content as structured data (JSON5 or YAML).
   *
   * @param {string} source - The text content to parse
   * @param {string} [type="any"] - The expected format ("json",
   *   "json5", "yaml", or "any")
   * @returns {unknown} The parsed data
   * @throws {Sass} If content cannot be parsed or type is
   *   unsupported
   */
  static textAsData(source, type="any") {
    const normalizedType = type.toLowerCase()
    const toTry = {
      json5: [JSON5],
      json: [JSON5],
      yaml: [YAML],
      any: [JSON5, YAML],
    }[normalizedType]

    if(!toTry) {
      throw Sass.new(
        `Unsupported data type '${type}'.`
        + ` Supported types: json, json5, yaml.`)
    }

    for(const format of toTry) {
      try {
        const result = format.parse(source)

        return result
      } catch {
        // nothing to see here
      }
    }

    throw Sass.new(
      `Content is neither valid JSON5 nor valid YAML.`)
  }
}
