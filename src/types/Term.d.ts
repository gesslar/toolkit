// Implementation: ../lib/Term.js
// Type definitions for Term utility class

export default class Term {
  static log(...arg: Array<unknown>): void
  static info(...arg: Array<unknown>): void
  static warn(...arg: Array<unknown>): void
  static error(...arg: Array<unknown>): void
  static debug(...arg: Array<unknown>): void
  static status(args: string | Array<string | [string, string]>, options?: { silent?: boolean }): void
  static terminalMessage(argList: string | Array<string | [string, string] | [string, string, string]>): string
  static terminalBracket(parts: [string, string, [string, string]?]): string
  static resetTerminal(): Promise<void>
  static clearLines(num: number): Promise<void>
  static directWrite(output: string): Promise<void>
}
