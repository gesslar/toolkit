// Implementation: ../lib/Valid.js
// Type definitions for Valid utility class

export default class Valid {
  /** Validate a value against a type specification */
  static type(value: unknown, type: string, options?: { allowEmpty?: boolean }): void

  /** Assert a condition */
  static assert(condition: boolean, message: string, arg?: number | null): void

  /** Protect against prototype pollution by checking for dangerous keys */
  static prototypePollutionProtection(keys: string[]): void
}
