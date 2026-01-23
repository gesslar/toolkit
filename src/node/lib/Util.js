import {createHash} from "node:crypto"
import {EventEmitter} from "node:events"
import BrowserUtil from "../../browser/lib/Util.js"
import Sass from "./Sass.js"
import process from "node:process"
import JSON5 from "json5"
import Valid from "./Valid.js"

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
  static hashOf(s) {
    return createHash("sha256").update(s).digest("hex")
  }

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
  static generateOptionNames(object) {
    return Object.keys(object)
      .map(key => {
        return key
          .split(",")
          .map(o => o.trim())
          .map(o => o.match(/^(?<sign>--?)(?<option>[\w-]+)/)?.groups ?? {})
          .reduce((acc, curr) => acc.sign === "--" ? acc : curr, {})
          ?.option
      })
      .filter(option => option && /^[a-zA-Z0-9]/.test(option)) // Filter out options that don't start with alphanumeric
  }

  /**
   * Private method that performs the actual async emission logic.
   * Handles listener execution, error aggregation, and result processing.
   *
   * @param {object} emitter - The emitter object (already validated)
   * @param {string} event - The event name to emit
   * @param {...unknown} args - Arguments to pass to event listeners
   * @returns {Promise<void>} Resolves when all listeners have completed
   */
  static async #performAsyncEmit(emitter, event, ...args) {
    const listeners = emitter.listeners(event)

    if(listeners.length === 0)
      return // No listeners, nothing to do

    const settled =
      await Promise.allSettled(listeners.map(listener => listener(...args)))

    const rejected = settled.filter(result => result.status === "rejected")

    if(rejected.length > 0) {
      if(rejected[0].reason instanceof Error)
        throw rejected[0].reason
      else
        throw Sass.new(rejected[0].reason)
    }
  }

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
  static async asyncEmit(emitter, event, ...args) {
    try {
      if(!(emitter instanceof EventEmitter))
        throw Sass.new("First argument must be an EventEmitter instance")

      await this.#performAsyncEmit(emitter, event, ...args)
    } catch(error) {
      const argsDesc = args.length > 0 ? `with arguments: ${args.map(String).join(", ")}` : "with no arguments"

      throw Sass.new(
        `Processing '${event}' event ${argsDesc}.`,
        error
      )
    }
  }

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
  static async asyncEmitQuack(emitter, event, ...args) {
    try {
      if(!emitter ||
         typeof emitter.listeners !== "function" ||
         typeof emitter.on !== "function" ||
         typeof emitter.emit !== "function") {
        throw Sass.new("First argument must be an EventEmitter-like object")
      }

      await this.#performAsyncEmit(emitter, event, ...args)
    } catch(error) {
      const argsDesc = args.length > 0 ? `with arguments: ${args.map(String).join(", ")}` : "with no arguments"

      throw Sass.new(
        `Processing '${event}' event ${argsDesc}.`,
        error
      )
    }
  }

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
  static getEnv(ev, def=undefined) {
    Valid.type(ev, "String")

    const value = process.env[ev]

    if(!value)
      return def

    try {
      return JSON5.parse(value)
    } catch(error) {
      throw Sass.new(
        `Failed to parse environment variable '${ev}' as JSON5`,
        error
      )
    }
  }
}
