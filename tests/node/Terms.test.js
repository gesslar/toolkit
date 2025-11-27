#!/usr/bin/env node

import {describe, it} from "node:test"
import assert from "node:assert/strict"
import {promises as fs} from "node:fs"
import {join} from "node:path"
import {tmpdir} from "node:os"

import {Terms, DirectoryObject, Sass} from "../../src/index.js"

describe("Terms", () => {
  describe("constructor()", () => {
    it("creates Terms with definition object", () => {
      const definition = {
        provides: {
          type: "object",
          properties: {
            name: {type: "string"},
            age: {type: "number"}
          }
        }
      }

      const terms = new Terms(definition)

      assert.ok(terms instanceof Terms)
      assert.deepEqual(terms.definition, definition)
    })

    it("creates Terms with accepts definition", () => {
      const definition = {
        accepts: {
          type: "string",
          minLength: 1
        }
      }

      const terms = new Terms(definition)

      assert.ok(terms instanceof Terms)
      assert.deepEqual(terms.definition, definition)
    })

    it("creates Terms with complex nested definition", () => {
      const definition = {
        provides: {
          type: "object",
          properties: {
            users: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {type: "string"},
                  profile: {
                    type: "object",
                    properties: {
                      name: {type: "string"},
                      email: {type: "string"}
                    }
                  }
                }
              }
            }
          }
        }
      }

      const terms = new Terms(definition)

      assert.ok(terms instanceof Terms)
      assert.deepEqual(terms.definition, definition)
    })

    it("creates Terms with empty definition", () => {
      const terms = new Terms({})

      assert.ok(terms instanceof Terms)
      assert.deepEqual(terms.definition, {})
    })
  })

  describe("definition getter", () => {
    it("returns the definition object", () => {
      const definition = {
        provides: {type: "string"}
      }

      const terms = new Terms(definition)

      assert.deepEqual(terms.definition, definition)
    })

    it("returns immutable reference to original definition", () => {
      const definition = {
        provides: {type: "string"}
      }

      const terms = new Terms(definition)
      const retrievedDefinition = terms.definition

      // Should be the same reference
      assert.strictEqual(retrievedDefinition, definition)
    })
  })

  describe("parse() static method", () => {
    describe("object parsing", () => {
      it("returns object as-is", async () => {
        const input = {
          accepts: {
            type: "number",
            minimum: 0
          }
        }

        const result = await Terms.parse(input)

        assert.deepEqual(result, input)
        assert.strictEqual(result, input) // Same reference
      })

      it("handles complex object definitions", async () => {
        const input = {
          provides: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {type: "string"}
              },
              metadata: {
                type: "object",
                properties: {
                  timestamp: {type: "string"},
                  version: {type: "number"}
                }
              }
            }
          }
        }

        const result = await Terms.parse(input)

        assert.deepEqual(result, input)
      })

      it("handles empty object", async () => {
        const result = await Terms.parse({})

        assert.deepEqual(result, {})
      })
    })

    describe("JSON string parsing", () => {
      it("parses valid JSON string", async () => {
        const jsonString = `{
          "accepts": {
            "type": "string",
            "minLength": 1
          }
        }`

        const result = await Terms.parse(jsonString)

        assert.deepEqual(result, {
          accepts: {
            type: "string",
            minLength: 1
          }
        })
      })

      it("parses JSON5 string with comments", async () => {
        const json5String = `{
          // This accepts a user object
          "accepts": {
            "type": "object",
            "properties": {
              "name": {"type": "string"},
              // Age is optional
              "age": {"type": "number"}
            }
          }
        }`

        const result = await Terms.parse(json5String)

        // JSON5 successfully parses comments and returns the expected structure
        assert.deepEqual(result, {
          accepts: {
            type: "object",
            properties: {
              name: {type: "string"},
              age: {type: "number"}
            }
          }
        })
      })

      it("throws Sass error for invalid JSON", async () => {
        const invalidJson = `{
          "accepts": {
            "type": "string"
            // Missing comma
            "minLength": 1
          }
        }`

        await assert.rejects(async () => {
          await Terms.parse(invalidJson)
        }, (error) => {
          return error instanceof Sass &&
                 error.message.includes("Could not parse terms data as YAML or JSON")
        })
      })
    })

    describe("YAML string parsing", () => {
      it("parses valid YAML string", async () => {
        const yamlString = `
accepts:
  type: object
  properties:
    title:
      type: string
      minLength: 1
    count:
      type: number
      minimum: 0
  required:
    - title
`

        const result = await Terms.parse(yamlString)

        assert.deepEqual(result, {
          accepts: {
            type: "object",
            properties: {
              title: {
                type: "string",
                minLength: 1
              },
              count: {
                type: "number",
                minimum: 0
              }
            },
            required: ["title"]
          }
        })
      })

      it("parses YAML with arrays and nested objects", async () => {
        const yamlString = `
provides:
  type: object
  properties:
    users:
      type: array
      items:
        type: object
        properties:
          id:
            type: string
          tags:
            type: array
            items:
              type: string
        required:
          - id
`

        const result = await Terms.parse(yamlString)

        assert.equal(result.provides.type, "object")
        assert.equal(result.provides.properties.users.type, "array")
        assert.deepEqual(result.provides.properties.users.items.required, ["id"])
      })

      it("throws Sass error for invalid YAML", async () => {
        const invalidYaml = `
accepts:
  type: object
    invalid_indentation: true
  properties:
    name: string
`

        await assert.rejects(async () => {
          await Terms.parse(invalidYaml)
        }, (error) => {
          return error instanceof Sass &&
                 error.message.includes("Could not parse terms data as YAML or JSON")
        })
      })
    })

    describe("file reference parsing", () => {
      it("parses ref:// file reference", async () => {
        const schemaPath = join(tmpdir(), "test-terms.json")
        const schemaContent = {
          provides: {
            type: "string",
            pattern: "^[A-Z][a-z]+"
          }
        }

        await fs.writeFile(schemaPath, JSON.stringify(schemaContent, null, 2))

        try {
          const directory = new DirectoryObject(tmpdir())
          const result = await Terms.parse("ref://test-terms.json", directory)

          assert.deepEqual(result, schemaContent)
        } finally {
          await fs.unlink(schemaPath).catch(() => {}) // Clean up
        }
      })

      it("parses ref:// with YAML file", async () => {
        const schemaPath = join(tmpdir(), "test-terms.yaml")
        const yamlContent = `
accepts:
  type: object
  properties:
    name:
      type: string
    age:
      type: number
      minimum: 0
`

        await fs.writeFile(schemaPath, yamlContent)

        try {
          const directory = new DirectoryObject(tmpdir())
          const result = await Terms.parse("ref://test-terms.yaml", directory)

          assert.equal(result.accepts.type, "object")
          assert.equal(result.accepts.properties.name.type, "string")
          assert.equal(result.accepts.properties.age.minimum, 0)
        } finally {
          await fs.unlink(schemaPath).catch(() => {})
        }
      })

      it("requires DirectoryObject for file references", async () => {
        await assert.rejects(async () => {
          await Terms.parse("ref://some-file.json")
        }, (error) => {
          return error instanceof Sass &&
                 error.message.includes("Invalid type")
        })
      })

      it("throws error for non-existent file reference", async () => {
        const directory = new DirectoryObject(tmpdir())

        await assert.rejects(async () => {
          await Terms.parse("ref://non-existent-file.json", directory)
        }, Error) // FileObject loading error
      })

      it("handles relative file paths in references", async () => {
        const schemaPath = join(tmpdir(), "schemas", "user-schema.json")
        const schemaContent = {
          accepts: {
            type: "object",
            properties: {
              username: {type: "string"},
              email: {type: "string"}
            }
          }
        }

        // Create subdirectory
        await fs.mkdir(join(tmpdir(), "schemas"), {recursive: true})
        await fs.writeFile(schemaPath, JSON.stringify(schemaContent))

        try {
          const directory = new DirectoryObject(join(tmpdir(), "schemas"))
          const result = await Terms.parse("ref://user-schema.json", directory)

          assert.deepEqual(result, schemaContent)
        } finally {
          await fs.unlink(schemaPath).catch(() => {})
          await fs.rmdir(join(tmpdir(), "schemas")).catch(() => {})
        }
      })
    })

    describe("edge cases and error handling", () => {
      it("throws Sass error for invalid termsData type", async () => {
        await assert.rejects(async () => {
          await Terms.parse(123)
        }, (error) => {
          return error instanceof Sass &&
                 error.message.includes("Invalid terms data type")
        })
      })

      it("throws Sass error for null termsData", async () => {
        await assert.rejects(async () => {
          await Terms.parse(null)
        }, (error) => {
          return error instanceof Sass &&
                 error.message.includes("Invalid terms data type")
        })
      })

      it("throws Sass error for undefined termsData", async () => {
        await assert.rejects(async () => {
          await Terms.parse(undefined)
        }, (error) => {
          return error instanceof Sass &&
                 error.message.includes("Invalid terms data type")
        })
      })

      it("handles empty string gracefully", async () => {
        // YAML parses empty strings as null
        const result = await Terms.parse("")
        assert.equal(result, null)
      })

      it("handles whitespace-only string", async () => {
        // YAML parses whitespace-only strings as null
        const result = await Terms.parse("   \n  \t  ")
        assert.equal(result, null)
      })

      it("handles malformed ref:// URL", async () => {
        // "ref://" without a filename doesn't match the regex, so it gets parsed as YAML
        const result = await Terms.parse("ref://")

        // YAML parses this as a simple string value
        assert.equal(result, "ref://")
      })

      it("validates DirectoryObject type for file references", async () => {
        await assert.rejects(async () => {
          await Terms.parse("ref://test.json", "/not/a/directory/object")
        }, (error) => {
          return error instanceof Sass &&
                 error.message.includes("Invalid type")
        })
      })
    })

    describe("format fallback behavior", () => {
      it("tries YAML first, then JSON5 for ambiguous strings", async () => {
        // This could be valid in both formats, but YAML is tried first
        const ambiguousString = "key: value"

        const result = await Terms.parse(ambiguousString)

        assert.deepEqual(result, {key: "value"})
      })

      it("falls back to JSON5 when YAML parsing fails", async () => {
        // Valid JSON5 but invalid YAML due to quotes
        const json5String = '{"key": "value with: colon"}'

        const result = await Terms.parse(json5String)

        assert.deepEqual(result, {"key": "value with: colon"})
      })

      it("handles complex YAML structures", async () => {
        const complexString = "{{{{ invalid syntax }}}}"

        // YAML can actually parse this as a complex object structure
        const result = await Terms.parse(complexString)

        // Should return an object (YAML parsed it successfully)
        assert.equal(typeof result, "object")
        assert.ok(result !== null)
      })
    })
  })

  describe("real-world usage patterns", () => {
    it("handles API contract definitions", async () => {
      const apiContract = {
        provides: {
          type: "object",
          properties: {
            users: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {type: "string"},
                  name: {type: "string"},
                  email: {type: "string", format: "email"}
                },
                required: ["id", "name", "email"]
              }
            },
            pagination: {
              type: "object",
              properties: {
                page: {type: "number", minimum: 1},
                total: {type: "number", minimum: 0}
              },
              required: ["page", "total"]
            }
          },
          required: ["users", "pagination"]
        }
      }

      const terms = new Terms(apiContract)

      assert.deepEqual(terms.definition, apiContract)
    })

    it("handles data transformation pipeline terms", async () => {
      const yamlTerms = `
accepts:
  type: array
  items:
    type: object
    properties:
      timestamp:
        type: string
        format: date-time
      value:
        type: number
      metadata:
        type: object
        additionalProperties: true
    required:
      - timestamp
      - value

provides:
  type: object
  properties:
    processed_data:
      type: array
      items:
        type: object
        properties:
          date:
            type: string
          average:
            type: number
          count:
            type: number
    summary:
      type: object
      properties:
        total_records:
          type: number
        date_range:
          type: object
          properties:
            start:
              type: string
            end:
              type: string
`

      const result = await Terms.parse(yamlTerms)
      const terms = new Terms(result)

      assert.equal(terms.definition.accepts.type, "array")
      assert.equal(terms.definition.provides.type, "object")
      assert.ok(Array.isArray(terms.definition.accepts.items.required))
    })

    it("handles microservice interface definitions", async () => {
      const serviceTerms = {
        accepts: {
          type: "object",
          properties: {
            query: {
              type: "object",
              properties: {
                filters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: {type: "string"},
                      operator: {type: "string", enum: ["=", "!=", ">", "<"]},
                      value: {type: ["string", "number", "boolean"]}
                    }
                  }
                },
                pagination: {
                  type: "object",
                  properties: {
                    page: {type: "number", minimum: 1},
                    limit: {type: "number", minimum: 1, maximum: 100}
                  }
                }
              }
            }
          }
        },
        provides: {
          type: "object",
          properties: {
            data: {type: "array"},
            meta: {
              type: "object",
              properties: {
                total: {type: "number"},
                page: {type: "number"},
                has_next: {type: "boolean"}
              }
            }
          }
        }
      }

      const terms = new Terms(serviceTerms)

      assert.equal(terms.definition.accepts.type, "object")
      assert.equal(terms.definition.provides.type, "object")
      assert.ok(Array.isArray(terms.definition.accepts.properties.query.properties.filters.items.properties.operator.enum))
    })

    it("supports schema composition via file references", async () => {
      // Create base schema file
      const baseSchemaPath = join(tmpdir(), "base-user.json")
      const baseSchema = {
        type: "object",
        properties: {
          id: {type: "string"},
          name: {type: "string"},
          email: {type: "string"}
        },
        required: ["id", "name"]
      }

      await fs.writeFile(baseSchemaPath, JSON.stringify(baseSchema))

      try {
        const directory = new DirectoryObject(tmpdir())
        const parsedBase = await Terms.parse("ref://base-user.json", directory)

        // Extend the base schema
        const extendedTerms = {
          accepts: parsedBase,
          provides: {
            type: "object",
            properties: {
              success: {type: "boolean"},
              user: parsedBase
            }
          }
        }

        const terms = new Terms(extendedTerms)

        assert.equal(terms.definition.accepts.type, "object")
        assert.deepEqual(terms.definition.accepts.required, ["id", "name"])
        assert.equal(terms.definition.provides.properties.user.type, "object")
      } finally {
        await fs.unlink(baseSchemaPath).catch(() => {})
      }
    })

    it("handles complex validation rules", async () => {
      const complexTerms = await Terms.parse(`
accepts:
  type: object
  properties:
    user_input:
      type: object
      properties:
        personal_info:
          type: object
          properties:
            name:
              type: string
              pattern: "^[A-Za-z\\\\s]{2,50}$"
            age:
              type: number
              minimum: 13
              maximum: 120
            email:
              type: string
              format: email
          required:
            - name
            - age
            - email
        preferences:
          type: object
          properties:
            notifications:
              type: boolean
            theme:
              type: string
              enum:
                - light
                - dark
                - auto
          additionalProperties: false
      required:
        - personal_info
  required:
    - user_input

provides:
  type: object
  properties:
    validation_result:
      type: object
      properties:
        is_valid:
          type: boolean
        errors:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string
            required:
              - field
              - message
        user_id:
          type: string
          format: uuid
      required:
        - is_valid
        - errors
  required:
    - validation_result
`)

      const terms = new Terms(complexTerms)

      // Verify complex nested structure
      assert.equal(terms.definition.accepts.properties.user_input.properties.personal_info.properties.name.pattern, "^[A-Za-z\\s]{2,50}$")
      assert.equal(terms.definition.accepts.properties.user_input.properties.preferences.additionalProperties, false)
      assert.deepEqual(terms.definition.provides.properties.validation_result.properties.errors.items.required, ["field", "message"])
    })
  })
})
