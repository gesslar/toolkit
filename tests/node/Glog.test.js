#!/usr/bin/env node

import assert from 'node:assert/strict'
import console from 'node:console'
import {afterEach,beforeEach,describe,it} from 'node:test'

import {Glog} from "../../src/node/index.js"

describe('Glog', () => {
  let originalConsoleLog
  let consoleOutput

  beforeEach(() => {
    // Mock console.log to capture output
    consoleOutput = []
    originalConsoleLog = console.log
    console.log = (...args) => {
      consoleOutput.push(args)
    }

    // Reset Glog state
    Glog.setLogLevel(0).setLogPrefix('')
  })

  afterEach(() => {
    // Restore original console.log
    console.log = originalConsoleLog
  })

  describe('proxy functionality', () => {
    it('can be called as a function', () => {
      Glog('test message')

      assert.equal(consoleOutput.length, 1)
      assert.deepEqual(consoleOutput[0], ['test message'])
    })

    it('can be called with log level', () => {
      Glog.setLogLevel(1) // Allow level 1 messages
      Glog(1, 'level 1 message')

      assert.equal(consoleOutput.length, 1)
      assert.deepEqual(consoleOutput[0], ['level 1 message'])
    })

    it('can use static methods', () => {
      const result = Glog.setLogLevel(2)

      assert.equal(result, Glog) // Should return Glog for chaining
    })

    it('supports method chaining', () => {
      const result = Glog.setLogLevel(3).setLogPrefix('[TEST]')

      assert.equal(result, Glog)

      // Test that both settings were applied
      Glog(2, 'test message')
      assert.equal(consoleOutput.length, 1)
      assert.deepEqual(consoleOutput[0], ['[TEST]', 'test message'])
    })
  })

  describe('log level filtering', () => {
    it('shows messages at or below log level', () => {
      Glog.setLogLevel(2)

      Glog(0, 'level 0') // Should show
      Glog(1, 'level 1') // Should show
      Glog(2, 'level 2') // Should show
      Glog(3, 'level 3') // Should NOT show

      assert.equal(consoleOutput.length, 3)
      assert.deepEqual(consoleOutput[0], ['level 0'])
      assert.deepEqual(consoleOutput[1], ['level 1'])
      assert.deepEqual(consoleOutput[2], ['level 2'])
    })

    it('defaults to level 0 when no level specified', () => {
      Glog.setLogLevel(0) // Only show level 0

      Glog('no level specified') // Should show (defaults to 0)
      Glog(1, 'level 1')          // Should NOT show

      assert.equal(consoleOutput.length, 1)
      assert.deepEqual(consoleOutput[0], ['no level specified'])
    })

    it('clamps log level to valid range (0-5)', () => {
      Glog.setLogLevel(-1) // Should clamp to 0
      Glog(0, 'should show')
      assert.equal(consoleOutput.length, 1)

      consoleOutput = []
      Glog.setLogLevel(10) // Should clamp to 5
      Glog(5, 'should show at max level')
      assert.equal(consoleOutput.length, 1)
    })
  })

  describe('prefix handling', () => {
    it('adds prefix to all messages', () => {
      Glog.setLogPrefix('[APP]')

      Glog('test message')

      assert.equal(consoleOutput.length, 1)
      assert.deepEqual(consoleOutput[0], ['[APP]', 'test message'])
    })

    it('works with multiple arguments', () => {
      Glog.setLogPrefix('[DEBUG]').setLogLevel(1) // Allow level 1 messages

      Glog(1, 'user:', 'john', 'action:', 'login')

      assert.equal(consoleOutput.length, 1)
      assert.deepEqual(consoleOutput[0], ['[DEBUG]', 'user:', 'john', 'action:', 'login'])
    })

    it('handles empty prefix', () => {
      Glog.setLogPrefix('')

      Glog('no prefix')

      assert.equal(consoleOutput.length, 1)
      assert.deepEqual(consoleOutput[0], ['no prefix'])
    })

    it('can change prefix multiple times', () => {
      Glog.setLogPrefix('[FIRST]')
      Glog('first message')

      Glog.setLogPrefix('[SECOND]')
      Glog('second message')

      assert.equal(consoleOutput.length, 2)
      assert.deepEqual(consoleOutput[0], ['[FIRST]', 'first message'])
      assert.deepEqual(consoleOutput[1], ['[SECOND]', 'second message'])
    })
  })

  describe('argument parsing edge cases', () => {
    it('handles empty arguments', () => {
      // This might be problematic based on line 78 in implementation
      try {
        Glog()
        // If it doesn't throw, check what got logged
        assert.equal(consoleOutput.length, 1)
      } catch (error) {
        // Expected to throw due to destructuring null
        assert.ok(error.message.includes('Cannot destructure'))
      }
    })

    it('handles single argument (message only)', () => {
      Glog('single argument')

      assert.equal(consoleOutput.length, 1)
      assert.deepEqual(consoleOutput[0], ['single argument'])
    })

    it('handles multiple message arguments', () => {
      Glog.setLogLevel(1) // Allow level 1 messages
      Glog(1, 'arg1', 'arg2', 'arg3', { key: 'value' })

      assert.equal(consoleOutput.length, 1)
      assert.deepEqual(consoleOutput[0], ['arg1', 'arg2', 'arg3', { key: 'value' }])
    })

    it('handles non-numeric first argument', () => {
      // Should treat 'not-a-number' as level 0 and message
      Glog('not-a-number', 'actual message')

      assert.equal(consoleOutput.length, 1)
      // This behavior might be unexpected - check what actually happens
    })
  })

  describe('state management', () => {
    it('maintains state across multiple calls', () => {
      Glog.setLogLevel(1).setLogPrefix('[PERSIST]')

      Glog(0, 'first call')
      Glog(1, 'second call')
      Glog(2, 'third call - should not show')

      assert.equal(consoleOutput.length, 2)
      assert.deepEqual(consoleOutput[0], ['[PERSIST]', 'first call'])
      assert.deepEqual(consoleOutput[1], ['[PERSIST]', 'second call'])
    })

    it('state persists between function and static method calls', () => {
      Glog.setLogLevel(1)

      Glog(0, 'function call') // Should show
      Glog(1, 'second call') // Should show
      Glog(2, 'filtered') // Should NOT show

      assert.equal(consoleOutput.length, 2)
    })
  })

  describe('method visibility', () => {
    it('hides execute method from public API', () => {
      assert.equal(typeof Glog.setLogLevel, 'function')
      assert.equal(typeof Glog.setLogPrefix, 'function')
      assert.equal(typeof Glog.execute, 'undefined') // Should be hidden
    })
  })

  describe('static method accessibility', () => {
    it('static methods are accessible and functional', () => {
      // Verify setLogLevel actually works
      Glog.setLogLevel(3)
      assert.equal(Glog.logLevel, 3)

      // Verify setLogPrefix actually works
      Glog.setLogPrefix('[TEST]')
      assert.equal(Glog.logPrefix, '[TEST]')

      // Reset for other tests
      Glog.setLogLevel(0).setLogPrefix('')
    })

    it('withName static method works', () => {
      Glog.withName('MyApp')
      assert.equal(Glog.name, 'MyApp')

      // Reset
      Glog.name = ''
    })

    it('withColors static method works', () => {
      const customColors = { debug: ['{F001}'], info: '{F002}' }
      Glog.withColors(customColors)
      assert.equal(Glog.colors, customColors)

      // Reset
      Glog.colors = null
    })

    it('withStackTrace static method works', () => {
      Glog.withStackTrace(true)
      assert.equal(Glog.stackTrace, true)

      Glog.withStackTrace(false)
      assert.equal(Glog.stackTrace, false)
    })

    it('create static method returns new instance', () => {
      const logger = Glog.create({ name: 'Test', logLevel: 2 })
      // Check that it's a Glog instance by verifying it has the expected methods
      assert.equal(typeof logger.debug, 'function')
      assert.equal(typeof logger.info, 'function')
      assert.equal(typeof logger.warn, 'function')
      assert.equal(typeof logger.error, 'function')
      assert.equal(logger.name, 'Test')
      assert.equal(logger.debugLevel, 2)
    })

    it('static success method is accessible', () => {
      assert.equal(typeof Glog.success, 'function')

      // Should not throw when called
      Glog.success('test success message')
      assert.equal(consoleOutput.length, 1)
    })

    it('static colorize method is accessible', () => {
      assert.equal(typeof Glog.colorize, 'function')
    })

    it('static setAlias method is accessible and functional', () => {
      assert.equal(typeof Glog.setAlias, 'function')

      const result = Glog.setAlias('testcolor', '{F123}')
      assert.equal(result, Glog) // Should return Glog for chaining
    })

    it('all expected static properties are accessible', () => {
      // Verify we can read static properties
      assert.equal(typeof Glog.logLevel, 'number')
      assert.equal(typeof Glog.logPrefix, 'string')

      // colors, stackTrace, and name can be various types
      assert.ok('colors' in Glog)
      assert.ok('stackTrace' in Glog)
      assert.ok('name' in Glog)
    })
  })

  describe('real-world usage patterns', () => {
    it('supports typical application logging', () => {
      // Setup like a real app might do
      Glog.setLogLevel(3).setLogPrefix('[MyApp]')

      Glog(0, 'Application started')
      Glog(1, 'Warning: deprecated API used')
      Glog(2, 'User logged in:', 'user123')
      Glog(3, 'Debug: cache hit for key:', 'session:abc123')
      Glog(4, 'Verbose: memory usage', '45MB') // Should NOT show

      assert.equal(consoleOutput.length, 4)
      assert.ok(consoleOutput.every(output => output[0] === '[MyApp]'))
    })

    it('handles object and complex data logging', () => {
      const user = { id: 123, name: 'John' }
      const error = new Error('Something went wrong')

      Glog(0, 'User data:', user, 'Error:', error.message)

      assert.equal(consoleOutput.length, 1)
      assert.deepEqual(consoleOutput[0], ['User data:', user, 'Error:', error.message])
    })
  })

  describe('debug() method', () => {
    let originalConsoleDebug
    let debugOutput

    beforeEach(() => {
      // Mock console.debug separately
      debugOutput = []
      originalConsoleDebug = console.debug
      console.debug = (...args) => {
        debugOutput.push(args)
      }
    })

    afterEach(() => {
      console.debug = originalConsoleDebug
    })

    it('does not show debug messages when logLevel is 0', () => {
      Glog.setLogLevel(0)
      const logger = new Glog({ name: 'Test' })

      logger.debug('should not show', 1)
      logger.debug('also not', 2)

      assert.equal(debugOutput.length, 0)
    })

    it('shows debug messages at level 1 when logLevel >= 1', () => {
      Glog.setLogLevel(1)
      const logger = new Glog({ name: 'Test' })

      logger.debug('should show')  // defaults to level 1

      assert.equal(debugOutput.length, 1)
      assert.ok(debugOutput[0][0].includes('should show'))
    })

    it('filters debug messages by level', () => {
      Glog.setLogLevel(2)
      const logger = new Glog({ name: 'Test' })

      logger.debug('level 1', 1)  // shows
      logger.debug('level 2', 2)  // shows
      logger.debug('level 3', 3)  // filtered
      logger.debug('level 4', 4)  // filtered

      assert.equal(debugOutput.length, 2)
    })

    it('throws error when debug level is 0', () => {
      const logger = new Glog({ name: 'Test' })

      assert.throws(
        () => logger.debug('invalid', 0),
        /Debug level must be >= 1/
      )
    })

    it('throws error when debug level is negative', () => {
      const logger = new Glog({ name: 'Test' })

      assert.throws(
        () => logger.debug('invalid', -1),
        /Debug level must be >= 1/
      )
    })
  })
})

// TODO: Add tests for new Glog features (enhanced color functionality)
// - Instance usage: new Glog(options)
// - Fluent instance methods: withName(), withLogLevel(), withColors(), withStackTrace()
// - Logger-style methods: debug(), info(), warn(), error()
// - Color features: colorize(), success(), setAlias()
// - @gesslar/colours integration and loggerColours configuration
// - VSCode integration (vscodeError, vscodeWarn, vscodeInfo)
