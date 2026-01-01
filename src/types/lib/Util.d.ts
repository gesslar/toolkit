/**
 * Utility class providing common helper functions for string manipulation,
 * timing, hashing, and option parsing.
 */
export default class Util extends BrowserUtil {
    /**
     * Compute sha256 hash (hex) of the provided string.
     *
     * @param {string} s - Input string.
     * @returns {string} 64-char hexadecimal digest.
     */
    static hashOf(s: string): string;
    /**
     * Extracts canonical option names from a Commander-style options object.
     *
     * Each key in the input object is a string containing one or more option
     * forms, separated by commas (e.g. "-w, --watch"). This function splits each
     * key, trims whitespace, and parses out the long option name (e.g. "watch")
     * for each entry. If no long option ("--") is present, the short option (e.g.
     * "v" from "-v") will be included in the result array. If both are present,
     * the long option is preferred.
     *
     * Example:
     *   generateOptionNames({"-w, --watch": "desc", "-v": "desc"})
     *   → ["watch", "v"]
     *
     * Edge cases:
     *   - If a key contains only a short option ("-v"), that short name will be
     *     included in the result.
     *   - If multiple long options are present, only the first is used.
     *   - If the option string is malformed, may return undefined for that entry
     *     (filtered out).
     *
     * @param {object} object - Mapping of option strings to descriptions.
     * @returns {Array<string>} Array of canonical option names (long preferred, short if no long present).
     */
    static generateOptionNames(object: object): Array<string>;
    /**
     * Private method that performs the actual async emission logic.
     * Handles listener execution, error aggregation, and result processing.
     *
     * @param {object} emitter - The emitter object (already validated)
     * @param {string} event - The event name to emit
     * @param {...unknown} args - Arguments to pass to event listeners
     * @returns {Promise<void>} Resolves when all listeners have completed
     */
    static "__#private@#performAsyncEmit"(emitter: object, event: string, ...args: unknown[]): Promise<void>;
    /**
     * Emits an event asynchronously and waits for all listeners to complete.
     * Unlike the standard EventEmitter.emit() which is synchronous, this method
     * properly handles async event listeners by waiting for all of them to
     * resolve or reject using Promise.allSettled().
     *
     * Uses strict instanceof checking to ensure the emitter is a genuine EventEmitter.
     *
     * @param {EventEmitter} emitter - The EventEmitter instance to emit on
     * @param {string} event - The event name to emit
     * @param {...unknown} args - Arguments to pass to event listeners
     * @returns {Promise<void>} Resolves when all listeners have completed
     */
    static asyncEmit(emitter: EventEmitter, event: string, ...args: unknown[]): Promise<void>;
    /**
     * Emits an event asynchronously and waits for all listeners to complete.
     * Like asyncEmit, but uses duck typing for more flexible emitter validation.
     * Accepts any object that has the required EventEmitter-like methods.
     * If it walks like an EventEmitter and quacks like an EventEmitter...
     *
     * @param {object} emitter - Any object with EventEmitter-like interface
     * @param {string} event - The event name to emit
     * @param {...unknown} args - Arguments to pass to event listeners
     * @returns {Promise<void>} Resolves when all listeners have completed, but no grapes.
     */
    static asyncEmitQuack(emitter: object, event: string, ...args: unknown[]): Promise<void>;
    /**
     * Retrieves an environment variable and parses it as JSON5.
     *
     * This method fetches the value of the specified environment variable and
     * attempts to parse it using JSON5. If the variable doesn't exist or is
     * empty, the default value is returned. If parsing fails, an error is
     * thrown.
     *
     * Example:
     *   // export MY_CONFIG='{"debug": true, timeout: 5000}'
     *   Util.getEnv("MY_CONFIG", {debug: false})
     *   → {debug: true, timeout: 5000}
     *
     * Edge cases:
     *   - If the environment variable doesn't exist, returns the default value
     *   - If the value is an empty string, returns the default value
     *   - If JSON5 parsing fails, throws a Sass error with context
     *
     * @param {string} ev - Name of the environment variable to retrieve
     * @param {unknown} [def=undefined] - Default value if variable doesn't exist or is empty
     * @returns {unknown} Parsed JSON5 value or default
     * @throws {Sass} If JSON5 parsing fails
     */
    static getEnv(ev: string, def?: unknown): unknown;
}
import { Util as BrowserUtil } from "../browser/index.js";
import { EventEmitter } from "node:events";
//# sourceMappingURL=Util.d.ts.map