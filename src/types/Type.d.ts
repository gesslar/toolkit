// Type definitions for Type specification class

interface TypeSpecDefinition {
  typeName: string
  array: boolean
}

export default class TypeSpec {
  constructor(string: string, options?: { delimiter?: string })

  readonly specs: readonly TypeSpecDefinition[]
  readonly length: number
  readonly stringRepresentation: string

  toString(): string
  toJSON(): { specs: TypeSpecDefinition[], length: number, stringRepresentation: string }
  forEach(callback: (spec: TypeSpecDefinition) => void): void
  every(callback: (spec: TypeSpecDefinition) => boolean): boolean
  some(callback: (spec: TypeSpecDefinition) => boolean): boolean
  filter(callback: (spec: TypeSpecDefinition) => boolean): TypeSpecDefinition[]
  map<T>(callback: (spec: TypeSpecDefinition) => T): T[]
  reduce<T>(callback: (acc: T, spec: TypeSpecDefinition) => T, initialValue: T): T
  find(callback: (spec: TypeSpecDefinition) => boolean): TypeSpecDefinition | undefined
  match(value: unknown, options?: { allowEmpty?: boolean }): boolean
}