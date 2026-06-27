/**
 * Node-side extension of Data with parsing utilities that require
 * node-specific dependencies.
 */
export default class Data extends BrowserData {
    static LOAD_DATA_TYPES: Readonly<{
        json: readonly JSON[];
        json5: readonly (typeof JSON5)[];
        yaml: readonly (typeof YAML)[];
    }>;
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
    static textAsData(source: string, type?: string): unknown;
}
import BrowserData from "../../browser/lib/Data.js";
import JSON5 from "json5";
import YAML from "yaml";
//# sourceMappingURL=Data.d.ts.map