// Implementation: ../lib/Type.js
// Type definitions for Type specification class

interface TypeSpecDefinition {
  typeName: string
  array: boolean
}

export default class TypeSpec {
  constructor(string: string, options?: { delimiter?: string })

  readonly specs: ReadonlyArray<TypeSpecDefinition>
  readonly length: number
  readonly stringRepresentation: string

  toString(): string
  toJSON(): { specs: Array<TypeSpecDefinition>, length: number, stringRepresentation: string }
  forEach(callback: (spec: TypeSpecDefinition) => void): void
  every(callback: (spec: TypeSpecDefinition) => boolean): boolean
  some(callback: (spec: TypeSpecDefinition) => boolean): boolean
  filter(callback: (spec: TypeSpecDefinition) => boolean): Array<TypeSpecDefinition>
  map<T>(callback: (spec: TypeSpecDefinition) => T): Array<T>
  reduce<T>(callback: (acc: T, spec: TypeSpecDefinition) => T, initialValue: T): T
  find(callback: (spec: TypeSpecDefinition) => boolean): TypeSpecDefinition | undefined
  match(value: unknown, options?: { allowEmpty?: boolean }): boolean
}
