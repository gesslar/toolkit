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
    static textAsData(source: string, type?: string): unknown;
}
import BrowserData from "../../browser/lib/Data.js";
//# sourceMappingURL=Data.d.ts.map