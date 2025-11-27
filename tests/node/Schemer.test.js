#!/usr/bin/env node

import {describe, it} from "node:test"
import assert from "node:assert/strict"
import {promises as fs} from "node:fs"
import {join} from "node:path"
import {tmpdir} from "node:os"

import {Schemer, FileObject, Sass} from "../../src/index.js"

describe("Schemer", () => {
  describe("fromFile()", () => {
    it("creates validator from valid JSON schema file", async () => {
      // Create a temporary schema file
      const schemaPath = join(tmpdir(), "test-schema.json")
      const schema = {
        type: "object",
        properties: {
          name: {type: "string"},
          age: {type: "number"}
        },
        required: ["name"]
      }
      
      await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2))
      
      try {
        const file = new FileObject(schemaPath)
        const validator = await Schemer.fromFile(file)
        
        assert.equal(typeof validator, "function")
        assert.equal(validator({name: "John", age: 30}), true)
        assert.equal(validator({age: 30}), false) // missing required name
        assert.ok(Array.isArray(validator.errors))
      } finally {
        await fs.unlink(schemaPath).catch(() => {}) // Clean up
      }
    })

    it("creates validator from YAML schema file", async () => {
      const schemaPath = join(tmpdir(), "test-schema.yaml")
      const yamlSchema = `
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
      
      await fs.writeFile(schemaPath, yamlSchema)
      
      try {
        const file = new FileObject(schemaPath)
        const validator = await Schemer.fromFile(file)
        
        assert.equal(typeof validator, "function")
        assert.equal(validator({title: "Test", count: 5}), true)
        assert.equal(validator({count: 5}), false) // missing required title
      } finally {
        await fs.unlink(schemaPath).catch(() => {}) // Clean up
      }
    })

    it("accepts AJV options", async () => {
      const schemaPath = join(tmpdir(), "test-schema-ajv.json")
      const schema = {type: "string"}
      
      await fs.writeFile(schemaPath, JSON.stringify(schema))
      
      try {
        const file = new FileObject(schemaPath)
        const options = {allErrors: false, verbose: false}
        const validator = await Schemer.fromFile(file, options)
        
        assert.equal(typeof validator, "function")
        assert.equal(validator("hello"), true)
        assert.equal(validator(123), false)
      } finally {
        await fs.unlink(schemaPath).catch(() => {})
      }
    })

    it("throws Sass error for invalid file parameter", async () => {
      await assert.rejects(async () => {
        await Schemer.fromFile("not a FileObject")
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("Invalid type")
      })
    })

    it("throws Sass error for invalid options parameter", async () => {
      const schemaPath = join(tmpdir(), "test-schema-invalid-options.json")
      const schema = {type: "string"}
      
      await fs.writeFile(schemaPath, JSON.stringify(schema))
      
      try {
        const file = new FileObject(schemaPath)
        
        await assert.rejects(async () => {
          await Schemer.fromFile(file, "not an object")
        }, (error) => {
          return error instanceof Sass &&
                 error.message.includes("Options must be a plain object")
        })
      } finally {
        await fs.unlink(schemaPath).catch(() => {})
      }
    })

    it("throws error for non-existent file", async () => {
      const file = new FileObject(join(tmpdir(), "non-existent-schema.json"))
      
      await assert.rejects(async () => {
        await Schemer.fromFile(file)
      }, Error) // Will throw filesystem error
    })

    it("throws error for invalid JSON schema file", async () => {
      const schemaPath = join(tmpdir(), "invalid-schema.json")
      await fs.writeFile(schemaPath, "{ invalid json }")
      
      try {
        const file = new FileObject(schemaPath)
        
        await assert.rejects(async () => {
          await Schemer.fromFile(file)
        }, Error) // JSON parsing error
      } finally {
        await fs.unlink(schemaPath).catch(() => {})
      }
    })
  })

  describe("from()", () => {
    it("creates validator from schema object", async () => {
      const schema = {
        type: "object",
        properties: {
          id: {type: "string"},
          value: {type: "number"}
        }
      }
      
      const validator = await Schemer.from(schema)
      
      assert.equal(typeof validator, "function")
      assert.equal(validator({id: "123", value: 42}), true)
      assert.equal(validator({id: 123, value: "not a number"}), false)
    })

    it("creates validator with empty schema", async () => {
      const validator = await Schemer.from()
      
      assert.equal(typeof validator, "function")
      // Empty schema should accept anything
      assert.equal(validator({anything: true}), true)
      assert.equal(validator("string"), true)
      assert.equal(validator(123), true)
    })

    it("accepts AJV options", async () => {
      const schema = {type: "string", minLength: 1}
      const options = {allErrors: false, verbose: false}
      
      const validator = await Schemer.from(schema, options)
      
      assert.equal(typeof validator, "function")
      assert.equal(validator("hello"), true)
      assert.equal(validator(""), false) // violates minLength
      assert.equal(validator(123), false) // not a string
    })

    it("throws Sass error for non-object schema", async () => {
      await assert.rejects(async () => {
        await Schemer.from("not an object")
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("Schema data must be a plain object")
      })
    })

    it("throws Sass error for non-object options", async () => {
      await assert.rejects(async () => {
        await Schemer.from({type: "string"}, "not an object")
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("Options must be a plain object")
      })
    })

    it("throws error for invalid schema", async () => {
      const invalidSchema = {
        type: "nonexistent-type"
      }
      
      await assert.rejects(async () => {
        await Schemer.from(invalidSchema)
      }, Error) // AJV compilation error
    })
  })

  describe("getValidator()", () => {
    it("returns AJV validator function", () => {
      const schema = {
        type: "string",
        minLength: 1
      }
      
      const validator = Schemer.getValidator(schema)
      
      assert.equal(typeof validator, "function")
      assert.equal(validator("hello"), true)
      assert.equal(validator(""), false)
      assert.ok(Array.isArray(validator.errors))
    })

    it("uses default AJV options", () => {
      const schema = {type: "number"}
      const validator = Schemer.getValidator(schema)
      
      assert.equal(validator(123), true)
      assert.equal(validator("123"), false)
      
      // Default options should include allErrors: true, verbose: true
      assert.ok(validator.errors)
    })

    it("accepts custom AJV options", () => {
      const schema = {type: "string", pattern: "^test"}
      const options = {allErrors: false, verbose: false}
      
      const validator = Schemer.getValidator(schema, options)
      
      assert.equal(typeof validator, "function")
      // Test pattern validation instead of email format
      assert.equal(validator("test@example.com"), true)
      assert.equal(validator("invalid-email"), false)
    })

    it("handles complex schema structures", () => {
      const schema = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              name: {type: "string"},
              contacts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {type: "string", enum: ["email", "phone"]},
                    value: {type: "string"}
                  },
                  required: ["type", "value"]
                }
              }
            },
            required: ["name"]
          }
        },
        required: ["user"]
      }
      
      const validator = Schemer.getValidator(schema)
      
      const validData = {
        user: {
          name: "John",
          contacts: [
            {type: "email", value: "john@example.com"},
            {type: "phone", value: "555-1234"}
          ]
        }
      }
      
      const invalidData = {
        user: {
          contacts: [] // missing required name
        }
      }
      
      assert.equal(validator(validData), true)
      assert.equal(validator(invalidData), false)
      assert.ok(validator.errors.length > 0)
    })

    it("throws error for invalid schema", () => {
      const invalidSchema = {
        type: "invalid-type"
      }
      
      assert.throws(() => {
        Schemer.getValidator(invalidSchema)
      }, Error) // AJV compilation error
    })
  })

  describe("reportValidationErrors()", () => {
    it("formats basic validation errors", () => {
      const errors = [
        {
          instancePath: "/name",
          message: "must be string",
          params: {type: "string"},
          data: 123
        }
      ]
      
      const report = Schemer.reportValidationErrors(errors)
      
      assert.match(report, /- "\/name" must be string/)
      assert.match(report, /Expected type: string/)
    })

    it("handles missing property errors", () => {
      const errors = [
        {
          instancePath: "",
          message: "must have required property 'name'",
          params: {missingProperty: "name"}
        }
      ]
      
      const report = Schemer.reportValidationErrors(errors)
      
      assert.match(report, /- "\(root\)" must have required property/)
      assert.match(report, /Missing required field: name/)
    })

    it("handles enum validation errors with suggestions", () => {
      const errors = [
        {
          instancePath: "/status",
          message: "must be equal to one of the allowed values",
          params: {
            allowedValues: ["active", "inactive", "pending"],
          },
          data: "activ"
        }
      ]
      
      const report = Schemer.reportValidationErrors(errors)
      
      assert.match(report, /- "\/status" must be equal to/)
      assert.match(report, /Allowed values: "active", "inactive", "pending"/)
      assert.match(report, /Received value: "activ"/)
      assert.match(report, /Did you mean: "active"?/)
    })

    it("handles pattern validation errors", () => {
      const errors = [
        {
          instancePath: "/email",
          message: "must match pattern",
          params: {pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"}
        }
      ]
      
      const report = Schemer.reportValidationErrors(errors)
      
      assert.match(report, /- "\/email" must match pattern/)
      assert.match(report, /Expected pattern:/)
    })

    it("handles format validation errors", () => {
      const errors = [
        {
          instancePath: "/date",
          message: "must match format \"date\"",
          params: {format: "date"}
        }
      ]
      
      const report = Schemer.reportValidationErrors(errors)
      
      assert.match(report, /- "\/date" must match format/)
      assert.match(report, /Expected format: date/)
    })

    it("handles additional property errors", () => {
      const errors = [
        {
          instancePath: "",
          message: "must NOT have additional properties",
          params: {additionalProperty: "extra"}
        }
      ]
      
      const report = Schemer.reportValidationErrors(errors)
      
      assert.match(report, /- "\(root\)" must NOT have additional/)
      assert.match(report, /Unexpected property: extra/)
    })

    it("combines multiple errors into single report", () => {
      const errors = [
        {
          instancePath: "/name",
          message: "must be string",
          params: {type: "string"},
          data: 123
        },
        {
          instancePath: "/age",
          message: "must be number",
          params: {type: "number"},
          data: "not a number"
        }
      ]
      
      const report = Schemer.reportValidationErrors(errors)
      
      assert.match(report, /- "\/name" must be string/)
      assert.match(report, /- "\/age" must be number/)
      assert.ok(report.includes("\n")) // Multiple errors separated by newlines
    })

    it("handles errors without params", () => {
      const errors = [
        {
          instancePath: "/data",
          message: "custom validation failed"
          // no params
        }
      ]
      
      const report = Schemer.reportValidationErrors(errors)
      
      assert.match(report, /- "\/data" custom validation failed/)
    })

    it("handles empty errors array", () => {
      const report = Schemer.reportValidationErrors([])
      
      assert.equal(report, "")
    })

    it("handles null and undefined errors", () => {
      assert.equal(Schemer.reportValidationErrors(null), "")
      assert.equal(Schemer.reportValidationErrors(undefined), "")
    })

    it("uses root path for empty instancePath", () => {
      const errors = [
        {
          instancePath: "",
          message: "must be object",
          params: {type: "object"}
        }
      ]
      
      const report = Schemer.reportValidationErrors(errors)
      
      assert.match(report, /- "\(root\)" must be object/)
    })
  })

  describe("error scenarios", () => {
    it("handles AJV compilation failures gracefully", () => {
      const invalidSchema = {
        type: "nonexistent-type" // This will definitely cause a compilation error
      }
      
      assert.throws(() => {
        Schemer.getValidator(invalidSchema)
      }, Error)
    })

    it("handles file loading errors in fromFile", async () => {
      const file = new FileObject("/tmp/does-not-exist.json")
      
      await assert.rejects(async () => {
        await Schemer.fromFile(file)
      }, Error)
    })

    it("handles malformed YAML in fromFile", async () => {
      const schemaPath = "/tmp/malformed.yaml"
      const badYaml = `
type: object
properties:
  name: string
    invalid_indentation: true
`
      
      await fs.writeFile(schemaPath, badYaml)
      
      try {
        const file = new FileObject(schemaPath)
        
        await assert.rejects(async () => {
          await Schemer.fromFile(file)
        }, Error)
      } finally {
        await fs.unlink(schemaPath).catch(() => {})
      }
    })

    it("propagates AJV errors with proper context", async () => {
      const schema = {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {type: "definitely-not-a-valid-type"}
          }
        }
      }
      
      await assert.rejects(async () => {
        await Schemer.from(schema)
      }, Error)
    })
  })

  describe("updated API behavior", () => {
    it("fromFile() returns validator function directly", async () => {
      const schemaPath = join(tmpdir(), "direct-validator.json")
      const schema = {
        type: "object",
        properties: {
          name: {type: "string"},
          age: {type: "number", minimum: 0}
        },
        required: ["name"]
      }
      
      await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2))
      
      try {
        const file = new FileObject(schemaPath)
        const validator = await Schemer.fromFile(file)
        
        // Should be a function, not a Schemer instance
        assert.equal(typeof validator, "function")
        assert.ok(validator.name.includes("validate") || validator.constructor.name === "Function")
        
        // Should work like a direct AJV validator
        const validData = {name: "Alice", age: 25}
        const invalidData = {age: -5} // missing name, negative age
        
        assert.equal(validator(validData), true)
        assert.equal(validator.errors, null)
        
        assert.equal(validator(invalidData), false)
        assert.ok(Array.isArray(validator.errors))
        assert.ok(validator.errors.length > 0)
      } finally {
        await fs.unlink(schemaPath).catch(() => {})
      }
    })

    it("from() returns validator function directly", async () => {
      const schema = {
        type: "array",
        items: {type: "string"},
        minItems: 1
      }
      
      const validator = await Schemer.from(schema)
      
      // Should be a function, not a Schemer instance
      assert.equal(typeof validator, "function")
      assert.ok(validator.name.includes("validate") || validator.constructor.name === "Function")
      
      // Should work like a direct AJV validator
      const validData = ["item1", "item2"]
      const invalidData = [] // empty array violates minItems
      
      assert.equal(validator(validData), true)
      assert.equal(validator.errors, null)
      
      assert.equal(validator(invalidData), false)
      assert.ok(Array.isArray(validator.errors))
      assert.ok(validator.errors.length > 0)
    })

    it("static methods and getValidator() return same type", async () => {
      const schema = {type: "string", minLength: 5}
      
      const validatorFromFile = await (async () => {
        const schemaPath = join(tmpdir(), "consistency-test.json")
        await fs.writeFile(schemaPath, JSON.stringify(schema))
        try {
          const file = new FileObject(schemaPath)
          return await Schemer.fromFile(file)
        } finally {
          await fs.unlink(schemaPath).catch(() => {})
        }
      })()
      
      const validatorFromObject = await Schemer.from(schema)
      const validatorDirect = Schemer.getValidator(schema)
      
      // All should return the same type of function
      assert.equal(typeof validatorFromFile, "function")
      assert.equal(typeof validatorFromObject, "function")
      assert.equal(typeof validatorDirect, "function")
      
      // All should behave identically
      const testData = "hello" // valid
      assert.equal(validatorFromFile(testData), true)
      assert.equal(validatorFromObject(testData), true)
      assert.equal(validatorDirect(testData), true)
      
      const badData = "hi" // too short
      assert.equal(validatorFromFile(badData), false)
      assert.equal(validatorFromObject(badData), false)
      assert.equal(validatorDirect(badData), false)
    })

    it("can be used directly without intermediate variables", async () => {
      const schema = {
        type: "object",
        properties: {
          name: {type: "string", minLength: 1}
        }
      }
      
      // This usage pattern should work seamlessly
      const isValid = (await Schemer.from(schema))({name: "John"})
      assert.equal(isValid, true)
      
      const isInvalid = (await Schemer.from(schema))({name: ""})
      assert.equal(isInvalid, false)
    })

    it("preserves AJV validator properties and methods", async () => {
      const schema = {
        type: "object",
        properties: {
          count: {type: "integer", minimum: 1}
        }
      }
      
      const validator = await Schemer.from(schema)
      
      // Test valid data
      const result1 = validator({count: 5})
      assert.equal(result1, true)
      assert.equal(validator.errors, null)
      
      // Test invalid data
      const result2 = validator({count: 0}) // violates minimum
      assert.equal(result2, false)
      assert.ok(Array.isArray(validator.errors))
      assert.ok(validator.errors.length > 0)
      
      // Test that errors property updates correctly
      const result3 = validator({count: 10}) // valid again
      assert.equal(result3, true)
      assert.equal(validator.errors, null)
    })
  })

  describe("real-world usage patterns", () => {
    it("validates API request schemas", () => {
      const requestSchema = {
        type: "object",
        properties: {
          method: {type: "string", enum: ["GET", "POST", "PUT", "DELETE"]},
          path: {type: "string", pattern: "^/"},
          headers: {
            type: "object",
            properties: {
              "content-type": {type: "string"},
              "authorization": {type: "string"}
            }
          },
          body: {type: "object"}
        },
        required: ["method", "path"]
      }
      
      const validator = Schemer.getValidator(requestSchema)
      
      const validRequest = {
        method: "POST",
        path: "/api/users",
        headers: {
          "content-type": "application/json"
        },
        body: {name: "John"}
      }
      
      const invalidRequest = {
        method: "PATCH", // not in enum
        path: "api/users" // doesn't start with /
      }
      
      assert.equal(validator(validRequest), true)
      assert.equal(validator(invalidRequest), false)
    })

    it("validates configuration file schemas", () => {
      const configSchema = {
        type: "object",
        properties: {
          database: {
            type: "object",
            properties: {
              host: {type: "string"},
              port: {type: "number", minimum: 1, maximum: 65535},
              name: {type: "string"}
            },
            required: ["host", "port", "name"]
          },
          logging: {
            type: "object",
            properties: {
              level: {type: "string", enum: ["debug", "info", "warn", "error"]},
              file: {type: "string"}
            }
          }
        },
        required: ["database"]
      }
      
      const validator = Schemer.getValidator(configSchema)
      
      const validConfig = {
        database: {
          host: "localhost",
          port: 5432,
          name: "myapp"
        },
        logging: {
          level: "info",
          file: "/var/log/app.log"
        }
      }
      
      assert.equal(validator(validConfig), true)
    })

    it("validates data transformation schemas", () => {
      const transformSchema = {
        type: "object",
        properties: {
          input: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp: {type: "string"},
                value: {type: "number"},
                tags: {
                  type: "array",
                  items: {type: "string"}
                }
              },
              required: ["timestamp", "value"]
            }
          },
          filters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: {type: "string"},
                operator: {type: "string", enum: ["=", "!=", ">", "<", ">=", "<="]},
                value: {type: ["string", "number", "boolean"]}
              },
              required: ["field", "operator", "value"]
            }
          }
        },
        required: ["input"]
      }
      
      const validator = Schemer.getValidator(transformSchema)
      
      const validData = {
        input: [
          {
            timestamp: "2023-01-01T00:00:00Z",
            value: 42.5,
            tags: ["sensor1", "temperature"]
          }
        ],
        filters: [
          {field: "value", operator: ">", value: 40}
        ]
      }
      
      assert.equal(validator(validData), true)
    })

    it("provides helpful error messages for complex failures", () => {
      const schema = {
        type: "object",
        properties: {
          users: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {type: "string", minLength: 1},
                email: {type: "string", pattern: "^[^@]+@[^@]+\\.[^@]+$"},
                role: {type: "string", enum: ["admin", "user", "guest"]}
              },
              required: ["name", "email"]
            }
          }
        }
      }
      
      const validator = Schemer.getValidator(schema)
      
      const invalidData = {
        users: [
          {
            name: "",
            email: "not-an-email",
            role: "superuser"
          }
        ]
      }
      
      assert.equal(validator(invalidData), false)
      
      const report = Schemer.reportValidationErrors(validator.errors)
      
      // Should contain multiple detailed error messages
      assert.ok(report.length > 0)
      assert.match(report, /minLength|pattern|enum/)
    })
  })
})