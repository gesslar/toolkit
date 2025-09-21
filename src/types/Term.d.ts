// Type definitions for Term utility class

export default class Term {
  static log(...arg: unknown[]): void
  static info(...arg: unknown[]): void
  static warn(...arg: unknown[]): void
  static error(...arg: unknown[]): void
  static debug(...arg: unknown[]): void
  static status(args: string | Array<string | [string, string]>, options?: { silent?: boolean }): void
  static terminalMessage(argList: string | Array<string | [string, string] | [string, string, string]>): string
  static terminalBracket(parts: [string, string, [string, string]?]): string
  static resetTerminal(): Promise<void>
  static clearLines(num: number): Promise<void>
  static directWrite(output: string): Promise<void>
}