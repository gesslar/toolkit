// Implementation: ../lib/Sass.js
// Type definitions for Sass error class

/**
 * Custom error class for toolkit errors.
 */
export default class Sass extends Error {
  constructor(message: string, ...arg: Array<any>)

  /** Array of trace messages */
  readonly trace: Array<string>

  /** Add a trace message and return this instance for chaining */
  addTrace(message: string): this

  /** Report the error to the terminal */
  report(nerdMode?: boolean): void

  /** Create a Sass from an existing Error object */
  static from(error: Error, message: string): Sass

  /** Factory method to create or enhance Sass instances */
  static new(message: string, error?: Error | Sass): Sass
}
