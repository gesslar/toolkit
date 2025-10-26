/**
 * @file Valid.js
 *
 * Provides validation utilities for type checking and assertion.
 * Includes prototype pollution protection for secure object manipulation.
 */

import _assert from "node:assert/strict"

import Sass from "./Sass.js"
import Data from "./Data.js"
import Collection from "./Collection.js"

/**
 * Validation utility class providing type checking and assertion methods.
 */
export default class Valid {
  /**
   * Validates a value against a type. Uses Data.isType.
   *
   * @param {unknown} value - The value to validate
   * @param {string} type - The expected type in the form of "object", "object[]", "object|object[]"
   * @param {object} [options] - Additional options for validation.
   */
  static type(value, type, options) {
    Valid.assert(
      Data.isType(value, type, options),
      `Invalid type. Expected ${type}, got ${JSON.stringify(value)}`,
      1,
    )
  }

  /**
   * Asserts a condition
   *
   * @param {boolean} condition - The condition to assert
   * @param {string} message - The message to display if the condition is not
   *                           met
   * @param {number} [arg] - The argument to display if the condition is not
   *                         met (optional)
   */
  static assert(condition, message, arg = null) {
    _assert(
      Data.isType(condition, "boolean"),
      `Condition must be a boolean, got ${condition}`,
    )
    _assert(
      Data.isType(message, "string"),
      `Message must be a string, got ${message}`,
    )
    _assert(
      arg === null || arg === undefined || typeof arg === "number",
      `Arg must be a number, got ${arg}`,
    )

    if(!condition)
      throw Sass.new(`${message}${arg ? `: ${arg}` : ""}`)
  }

  static #restrictedProto = ["__proto__", "constructor", "prototype"]

  /**
   * Protects against prototype pollution by checking keys for dangerous property names.
   * Throws if any restricted prototype properties are found in the keys array.
   *
   * @param {Array<string>} keys - Array of property keys to validate
   * @throws {Sass} If any key matches restricted prototype properties (__proto__, constructor, prototype)
   */
  static prototypePollutionProtection(keys) {
    Valid.type(keys, "String[]")

    const oopsIDidItAgain = Collection.intersection(this.#restrictedProto, keys)

    Valid.assert(
      oopsIDidItAgain.length === 0,
      `We don't pee in your pool, don't pollute ours with your ${String(oopsIDidItAgain)}`
    )
  }
}
