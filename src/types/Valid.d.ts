// Type definitions for Valid utility class

export default class Valid {
  /** Validate a value against a type specification */
  static validType(value: unknown, type: string, options?: { allowEmpty?: boolean }): void

  /** Assert a condition */
  static assert(condition: boolean, message: string, arg?: number | null): void
}