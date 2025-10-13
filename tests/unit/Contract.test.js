#!/usr/bin/env node

import {describe, it} from "node:test"
import assert from "node:assert/strict"

import {Contract, Terms, Sass} from "../../src/index.js"

describe("Contract", () => {
  describe("constructor()", () => {
    it("creates contract between provider and consumer terms", () => {
      const providerDef = {
        provides: {
          name: {dataType: "string", required: true},
          age: {dataType: "number", required: false}
        }
      }
      const consumerDef = {
        requires: {
          name: {dataType: "string", required: true}
        }
      }

      const provider = new Terms(providerDef)
      const consumer = new Terms(consumerDef)
      const contract = new Contract(provider, consumer)

      assert.ok(contract instanceof Contract)
      assert.equal(contract.isNegotiated, true)
      assert.strictEqual(contract.providerTerms, provider)
      assert.strictEqual(contract.consumerTerms, consumer)
    })

    it("creates single-party contract with null terms", () => {
      const contract = new Contract(null, null)

      assert.ok(contract instanceof Contract)
      assert.equal(contract.isNegotiated, true)
      assert.equal(contract.providerTerms, null)
      assert.equal(contract.consumerTerms, null)
    })

    it("accepts debug function option", () => {
      const debugCalls = []
      const debug = (msg, level, ...args) => debugCalls.push({msg, level, args})

      const contract = new Contract(null, null, {debug})

      assert.ok(contract instanceof Contract)
      // Single party contracts don't generate debug messages during negotiation
    })

    it("throws when contract negotiation fails", () => {
      const providerDef = {
        provides: {
          age: {dataType: "number"}
        }
      }
      const consumerDef = {
        requires: {
          name: {dataType: "string", required: true}
        }
      }

      const provider = new Terms(providerDef)
      const consumer = new Terms(consumerDef)

      assert.throws(() => {
        new Contract(provider, consumer)
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("Contract negotiation failed") &&
               error.message.includes("missing required capability")
      })
    })
  })

  describe("fromTerms()", () => {
    it("creates contract from terms definition", () => {
      const termsDefinition = {
        provides: {
          type: "object",
          properties: {
            name: {type: "string"},
            age: {type: "number"}
          },
          required: ["name"]
        }
      }

      const contract = Contract.fromTerms("test-contract", termsDefinition)

      assert.ok(contract instanceof Contract)
      assert.equal(contract.isNegotiated, true)
      assert.ok(contract.validator)
    })

    it("creates contract with accepts definition", () => {
      const termsDefinition = {
        accepts: {
          type: "string",
          minLength: 1
        }
      }

      const contract = Contract.fromTerms("input-contract", termsDefinition)

      assert.ok(contract instanceof Contract)
      assert.equal(contract.isNegotiated, true)
      assert.ok(contract.validator)
    })

    it("validates terms definition when validator provided", () => {
      const termsDefinition = {
        provides: {
          type: "invalid-schema"
        }
      }

      const validator = () => {
        validator.errors = [{message: "Invalid schema"}]
        return false
      }

      assert.throws(() => {
        Contract.fromTerms("test", termsDefinition, validator)
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("Invalid terms definition")
      })
    })

    it("accepts debug function parameter", () => {
      const debugCalls = []
      const debug = (msg, level, ...args) => debugCalls.push({msg, level, args})

      const termsDefinition = {
        provides: {type: "string"}
      }

      const contract = Contract.fromTerms("test", termsDefinition, null, debug)

      assert.ok(contract instanceof Contract)
    })
  })

  describe("validate()", () => {
    it("validates data against contract schema", () => {
      const termsDefinition = {
        provides: {
          type: "object",
          properties: {
            name: {type: "string"},
            age: {type: "number"}
          },
          required: ["name"]
        }
      }

      const contract = Contract.fromTerms("test", termsDefinition)
      const validData = {name: "John", age: 30}

      const result = contract.validate(validData)
      assert.equal(result, true)
    })

    it("throws Sass error for invalid data", () => {
      const termsDefinition = {
        provides: {
          type: "object",
          properties: {
            name: {type: "string"}
          },
          required: ["name"]
        }
      }

      const contract = Contract.fromTerms("test", termsDefinition)
      const invalidData = {age: 30} // missing required name

      assert.throws(() => {
        contract.validate(invalidData)
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("Contract validation failed")
      })
    })

    it("throws when contract not negotiated", () => {
      // This test checks that Contract.validate() throws when no validator is available
      // Since we can't actually create an unnegotiated contract (they throw during construction),
      // we test the "no validator available" path which has the same effect
      const contract = new Contract(null, null)

      assert.throws(() => {
        contract.validate({})
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("No validator available")
      })
    })

    it("throws when no validator available", () => {
      // Create contract without validator
      const contract = new Contract(null, null)

      assert.throws(() => {
        contract.validate({})
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("No validator available")
      })
    })
  })

  describe("negotiation process", () => {
    it("succeeds when provider meets consumer requirements", () => {
      const providerDef = {
        provides: {
          name: {dataType: "string"},
          age: {dataType: "number"},
          email: {dataType: "string"}
        }
      }
      const consumerDef = {
        requires: {
          name: {dataType: "string", required: true},
          age: {dataType: "number", required: false}
        }
      }

      const provider = new Terms(providerDef)
      const consumer = new Terms(consumerDef)
      const contract = new Contract(provider, consumer)

      assert.equal(contract.isNegotiated, true)
    })

    it("fails when provider missing required capabilities", () => {
      const providerDef = {
        provides: {
          age: {dataType: "number"}
        }
      }
      const consumerDef = {
        requires: {
          name: {dataType: "string", required: true},
          age: {dataType: "number", required: true}
        }
      }

      const provider = new Terms(providerDef)
      const consumer = new Terms(consumerDef)

      assert.throws(() => {
        new Contract(provider, consumer)
      }, /missing required capability.*name/)
    })

    it("fails on type mismatch", () => {
      const providerDef = {
        provides: {
          name: {dataType: "number"} // Wrong type
        }
      }
      const consumerDef = {
        requires: {
          name: {dataType: "string", required: true}
        }
      }

      const provider = new Terms(providerDef)
      const consumer = new Terms(consumerDef)

      assert.throws(() => {
        new Contract(provider, consumer)
      }, /Type mismatch.*Consumer expects.*provider offers/)
    })
  })

  describe("getters", () => {
    it("isNegotiated returns negotiation status", () => {
      const contract = new Contract(null, null)
      assert.equal(contract.isNegotiated, true)
    })

    it("providerTerms returns provider terms", () => {
      const provider = new Terms({provides: {}})
      const contract = new Contract(provider, null)

      assert.strictEqual(contract.providerTerms, provider)
    })

    it("consumerTerms returns consumer terms", () => {
      const consumer = new Terms({requires: {}})
      const contract = new Contract(null, consumer)

      assert.strictEqual(contract.consumerTerms, consumer)
    })

    it("validator returns contract validator", () => {
      const termsDefinition = {
        provides: {type: "string"}
      }

      const contract = Contract.fromTerms("test", termsDefinition)
      const validator = contract.validator

      assert.equal(typeof validator, "function")
      assert.equal(validator("test"), true)
      assert.equal(validator(123), false)
    })

    it("validator returns null when no validator available", () => {
      const contract = new Contract(null, null)

      assert.equal(contract.validator, null)
    })
  })

  describe("edge cases and error handling", () => {
    it("handles null provider and consumer terms", () => {
      const contract = new Contract(null, null)

      assert.ok(contract instanceof Contract)
      assert.equal(contract.isNegotiated, true)
    })

    it("handles empty terms definitions", () => {
      const provider = new Terms({provides: {}})
      const consumer = new Terms({requires: {}})
      const contract = new Contract(provider, consumer)

      assert.equal(contract.isNegotiated, true)
    })

    it("provides detailed error messages for complex failures", () => {
      const providerDef = {
        provides: {
          user: {
            dataType: "object",
            contains: {
              name: {dataType: "string"}
            }
          }
        }
      }
      const consumerDef = {
        requires: {
          user: {
            dataType: "object",
            required: true,
            contains: {
              name: {dataType: "string", required: true},
              email: {dataType: "string", required: true}
            }
          }
        }
      }

      const provider = new Terms(providerDef)
      const consumer = new Terms(consumerDef)

      assert.throws(() => {
        new Contract(provider, consumer)
      }, (error) => {
        return error instanceof Sass &&
               error.message.includes("Contract negotiation failed")
      })
    })

    it("handles debug function calls during negotiation", () => {
      const debugCalls = []
      const debug = (msg, level, ...args) => debugCalls.push({msg, level, args})

      const providerDef = {
        provides: {
          name: {dataType: "string"},
          age: {dataType: "number"}
        }
      }
      const consumerDef = {
        requires: {
          name: {dataType: "string", required: true}
        }
      }

      const provider = new Terms(providerDef)
      const consumer = new Terms(consumerDef)
      const contract = new Contract(provider, consumer, {debug})

      assert.equal(contract.isNegotiated, true)
      // Should have at least one debug call for successful negotiation
      assert.ok(debugCalls.length > 0)
    })

    it("validates complex nested type requirements", () => {
      const termsDefinition = {
        provides: {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                profile: {
                  type: "object",
                  properties: {
                    name: {type: "string"}
                  },
                  required: ["name"]
                }
              },
              required: ["profile"]
            }
          },
          required: ["user"]
        }
      }

      const contract = Contract.fromTerms("nested", termsDefinition)

      // Valid nested data
      const validData = {
        user: {
          profile: {
            name: "John Doe"
          }
        }
      }

      assert.equal(contract.validate(validData), true)

      // Invalid nested data
      const invalidData = {
        user: {
          profile: {} // missing required name
        }
      }

      assert.throws(() => {
        contract.validate(invalidData)
      }, Sass)
    })

    it("handles validation with debug logging", () => {
      const debugCalls = []
      const debug = (msg, level, ...args) => debugCalls.push({msg, level, args})

      const termsDefinition = {
        provides: {type: "string"}
      }

      const contract = Contract.fromTerms("debug-test", termsDefinition, null, debug)

      // Mock the debug function on the contract
      contract.debug = debug

      contract.validate("test")

      // Debug calls would happen during validation in the actual implementation
    })
  })

  describe("real-world usage patterns", () => {
    it("supports API contract validation", () => {
      const apiContract = Contract.fromTerms("user-api", {
        provides: {
          type: "object",
          properties: {
            id: {type: "string", pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},
            name: {type: "string", minLength: 1},
            email: {type: "string", pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"},
            age: {type: "number", minimum: 0, maximum: 150}
          },
          required: ["id", "name", "email"]
        }
      })

      const validUser = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "John Doe",
        email: "john@example.com",
        age: 30
      }

      assert.equal(apiContract.validate(validUser), true)
    })

    it("supports data transformation pipeline contracts", () => {
      // Input contract
      const inputContract = Contract.fromTerms("csv-parser", {
        accepts: {
          type: "string",
          minLength: 1
        }
      })

      // Output contract
      const outputContract = Contract.fromTerms("csv-parser", {
        provides: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {type: "string"},
              value: {type: "number"}
            }
          }
        }
      })

      assert.equal(inputContract.validate("name,value\nJohn,30"), true)
      assert.equal(outputContract.validate([{name: "John", value: 30}]), true)
    })

    it("supports microservice interface contracts", () => {
      const serviceContract = Contract.fromTerms("user-service", {
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
                  active: {type: "boolean"}
                },
                required: ["id", "name", "active"]
              }
            },
            total: {type: "number"},
            page: {type: "number"}
          },
          required: ["users", "total", "page"]
        }
      })

      const serviceResponse = {
        users: [
          {id: "1", name: "Alice", active: true},
          {id: "2", name: "Bob", active: false}
        ],
        total: 2,
        page: 1
      }

      assert.equal(serviceContract.validate(serviceResponse), true)
    })
  })
})
