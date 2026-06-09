#!/usr/bin/env node

import assert from 'node:assert/strict'
import console from 'node:console'
import {afterEach,beforeEach,describe,it} from 'node:test'

import {Glog, Term} from "../../src/node/index.js"

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

    it('withColours static method works', () => {
      const customColours = { debug: ['{F001}'], info: '{F002}' }
      Glog.withColours(customColours)

      // Should merge with defaults, not replace
      assert.equal(Glog.colours.debug, customColours.debug)
      assert.equal(Glog.colours.info, customColours.info)
      assert.equal(typeof Glog.colours.warn, 'string')
      assert.equal(typeof Glog.colours.error, 'string')
      assert.equal(typeof Glog.colours.reset, 'string')

      // Reset
      Glog.colours = null
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

    it('static colourize method is accessible', () => {
      assert.equal(typeof Glog.colourize, 'function')
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

      // colours, stackTrace, and name can be various types
      assert.ok('colours' in Glog)
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

  describe('use() method for temporary prefixes', () => {
    let originalConsoleInfo, originalConsoleWarn, originalConsoleError
    let infoOutput, warnOutput, errorOutput

    beforeEach(() => {
      // Mock console methods for different log types
      infoOutput = []
      warnOutput = []
      errorOutput = []

      originalConsoleInfo = console.info
      originalConsoleWarn = console.warn
      originalConsoleError = console.error

      console.info = (...args) => infoOutput.push(args)
      console.warn = (...args) => warnOutput.push(args)
      console.error = (...args) => errorOutput.push(args)
    })

    afterEach(() => {
      console.info = originalConsoleInfo
      console.warn = originalConsoleWarn
      console.error = originalConsoleError
    })

    it('creates a temporary scoped logger with custom prefix', () => {
      const logger = Glog.create({name: 'Test'})

      logger.use("=>").info("Indented message")

      assert.equal(infoOutput.length, 1)
      assert.equal(infoOutput[0][0], "=>Indented message")
    })

    it('does not affect subsequent regular logger calls', () => {
      const logger = Glog.create({name: 'Test'})

      logger.use("=>").info("With prefix")
      logger.info("Normal message")

      assert.equal(infoOutput.length, 2)
      assert.equal(infoOutput[0][0], "=>With prefix")
      // Second call should have formatted output with name/tags
      assert.ok(infoOutput[1][0].includes('Test'))
    })

    it('works with static Glog.use()', () => {
      Glog.use("-->").info("Arrow prefix")

      assert.equal(infoOutput.length, 1)
      assert.equal(infoOutput[0][0], "-->Arrow prefix")
    })

    it('supports all log methods (info, warn, error)', () => {
      const logger = Glog.create({name: 'Test'})

      logger.use("=>").info("Info message")
      logger.use("=>").warn("Warning message")
      logger.use("=>").error("Error message")

      assert.equal(infoOutput.length, 1)
      assert.equal(infoOutput[0][0], "=>Info message")

      assert.equal(warnOutput.length, 1)
      assert.equal(warnOutput[0][0], "=>Warning message")

      assert.equal(errorOutput.length, 1)
      assert.equal(errorOutput[0][0], "=>Error message")
    })

    it('handles different prefix patterns', () => {
      const logger = Glog.create()

      logger.use("  ").info("Two spaces")
      logger.use("\t").info("Tab character")
      logger.use(">>").info("Arrows")

      assert.equal(infoOutput.length, 3)
      assert.equal(infoOutput[0][0], "  Two spaces")
      assert.equal(infoOutput[1][0], "\tTab character")
      assert.equal(infoOutput[2][0], ">>Arrows")
    })

    it('supports success method with custom prefix', () => {
      const logger = Glog.create()

      logger.use("✓ ").success("Success message")

      assert.equal(consoleOutput.length, 1)
      assert.equal(consoleOutput[0][0], "✓ Success message")
    })

    it('is truly scoped - cannot be reused', () => {
      const logger = Glog.create()

      // First use
      logger.use("=>").info("First")
      // Second use requires new .use() call
      logger.use("=>").info("Second")

      assert.equal(infoOutput.length, 2)
      assert.equal(infoOutput[0][0], "=>First")
      assert.equal(infoOutput[1][0], "=>Second")
    })

    it('handles debug method with level filtering', () => {
      let debugOutput = []
      const originalConsoleDebug = console.debug

      console.debug = (...args) => debugOutput.push(args)

      try {
        const logger = Glog.create({logLevel: 2})

        logger.use("=>").debug("Level 1", 1)  // Should show
        logger.use("=>").debug("Level 2", 2)  // Should show
        logger.use("=>").debug("Level 3", 3)  // Should NOT show

        assert.equal(debugOutput.length, 2)
        assert.equal(debugOutput[0][0], "=>Level 1")
        assert.equal(debugOutput[1][0], "=>Level 2")
      } finally {
        console.debug = originalConsoleDebug
      }
    })

    it('works inside groups for indentation', () => {
      const logger = Glog.create({name: 'Test'})

      logger.group("Processing")
      logger.use("  ").info("Item 1")
      logger.use("  ").info("Item 2")
      logger.groupEnd()

      assert.equal(infoOutput.length, 2)
      assert.equal(infoOutput[0][0], "  Item 1")
      assert.equal(infoOutput[1][0], "  Item 2")
    })

    it('static use() respects static logLevel', () => {
      let debugOutput = []
      const originalConsoleDebug = console.debug

      console.debug = (...args) => debugOutput.push(args)

      try {
        Glog.setLogLevel(1)

        Glog.use("=>").debug("Should show", 1)
        Glog.use("=>").debug("Should not show", 2)

        assert.equal(debugOutput.length, 1)
        assert.equal(debugOutput[0][0], "=>Should show")
      } finally {
        console.debug = originalConsoleDebug
        Glog.setLogLevel(0)
      }
    })
  })

  describe('withSymbols() - custom log symbols', () => {
    let originalConsoleInfo, originalConsoleWarn, originalConsoleError, originalConsoleDebug
    let infoOutput, warnOutput, errorOutput, debugOutput

    beforeEach(() => {
      // Mock console methods for different log types
      infoOutput = []
      warnOutput = []
      errorOutput = []
      debugOutput = []

      originalConsoleInfo = console.info
      originalConsoleWarn = console.warn
      originalConsoleError = console.error
      originalConsoleDebug = console.debug

      console.info = (...args) => infoOutput.push(args)
      console.warn = (...args) => warnOutput.push(args)
      console.error = (...args) => errorOutput.push(args)
      console.debug = (...args) => debugOutput.push(args)

      // Reset Glog static symbols
      Glog.symbols = null
    })

    afterEach(() => {
      console.info = originalConsoleInfo
      console.warn = originalConsoleWarn
      console.error = originalConsoleError
      console.debug = originalConsoleDebug
      Glog.symbols = null
    })

    it('customizes symbols for instance logger', () => {
      const logger = Glog.create({name: 'Test'})
        .withSymbols({info: '🚒', warn: '🚨', error: '🔥', success: '💧'})
        .withColours()

      logger.info("Fire truck info")
      logger.warn("Siren warning")
      logger.error("Fire error")
      logger.success("Water success")

      assert.equal(infoOutput.length, 1)
      assert.ok(infoOutput[0][0].includes('🚒'), 'Should use fire truck emoji')

      assert.equal(warnOutput.length, 1)
      assert.ok(warnOutput[0][0].includes('🚨'), 'Should use siren emoji')

      assert.equal(errorOutput.length, 1)
      assert.ok(errorOutput[0][0].includes('🔥'), 'Should use fire emoji')

      assert.equal(consoleOutput.length, 1)
      assert.ok(consoleOutput[0][0].includes('💧'), 'Should use water droplet emoji')
    })

    it('customizes symbols for static logger', () => {
      Glog.withSymbols({info: '🏃', warn: '⚠️', error: '❌', success: '✅'})
        .withColours()

      Glog.create({name: 'Static'}).info("Running info")

      assert.equal(infoOutput.length, 1)
      assert.ok(infoOutput[0][0].includes('🏃'), 'Should use running emoji')
    })

    it('allows partial symbol override', () => {
      const logger = Glog.create({name: 'Test'})
        .withSymbols({error: '🔥'}) // Only override error symbol
        .withColours()

      logger.info("Normal info")
      logger.error("Fire error")

      assert.equal(infoOutput.length, 1)
      assert.ok(infoOutput[0][0].includes('i'), 'Should use default info symbol')

      assert.equal(errorOutput.length, 1)
      assert.ok(errorOutput[0][0].includes('🔥'), 'Should use fire emoji for error')
    })

    it('does not affect tagsAsStrings mode', () => {
      const logger = Glog.create({name: 'Test'})
        .withSymbols({info: '🚒'})
        .withTagsAsStrings(true)
        .withColours()

      logger.info("Info message")

      assert.equal(infoOutput.length, 1)
      // Should use "Info:" not "🚒" because tagsAsStrings is enabled
      // The output should look like: "[Test] Info: Info message"
      assert.ok(infoOutput[0][0].includes('Info'), 'Should use string tag')
      assert.ok(!infoOutput[0][0].includes('🚒'), 'Should not use custom symbol')
    })

    it('symbols only affect output when tagsAsStrings is false', () => {
      const logger = Glog.create({name: 'Test'})
        .withSymbols({info: '📢'})
        .withTagsAsStrings(false)
        .withColours()

      logger.info("Announcement")

      assert.equal(infoOutput.length, 1)
      assert.ok(infoOutput[0][0].includes('📢'), 'Should use megaphone emoji')
    })

    it('is chainable with other fluent methods', () => {
      const logger = Glog.create()
        .withName('Fire')
        .withSymbols({error: '🔥', warn: '🚨'})
        .withLogLevel(3)
        .withColours()

      assert.equal(logger.name, 'Fire')
      assert.equal(logger.debugLevel, 3)

      logger.error("Chained error")
      assert.equal(errorOutput.length, 1)
      assert.ok(errorOutput[0][0].includes('🔥'), 'Should use custom symbol')
    })

    it('supports debug symbol customization', () => {
      const logger = Glog.create({name: 'Test', logLevel: 2})
        .withSymbols({debug: '🧯'})
        .withColours()

      logger.debug("Fire extinguisher", 1)

      assert.equal(debugOutput.length, 1)
      assert.ok(debugOutput[0][0].includes('🧯'), 'Should use fire extinguisher emoji')
    })

    it('handles group methods with custom symbols', () => {
      const logger = Glog.create({name: 'Test'})
        .withSymbols({success: '🎉'})
        .withColours()

      logger.groupSuccess("Party time")

      // Check that consoleOutput contains the success symbol
      // The group call happens via Term.group which uses console.log
      assert.ok(consoleOutput.length > 0, 'Should have console output')
      assert.ok(consoleOutput[0][0].includes('🎉'), 'Should use party emoji')
    })

    it('instance symbols do not affect other instances', () => {
      const logger1 = Glog.create({name: 'Fire'})
        .withSymbols({info: '🚒'})
        .withColours()

      const logger2 = Glog.create({name: 'Police'})
        .withSymbols({info: '🚓'})
        .withColours()

      logger1.info("Fire truck")
      logger2.info("Police car")

      assert.equal(infoOutput.length, 2)
      assert.ok(infoOutput[0][0].includes('🚒'), 'First logger uses fire truck')
      assert.ok(infoOutput[1][0].includes('🚓'), 'Second logger uses police car')
    })

    it('static symbols persist across calls', () => {
      Glog.withSymbols({info: '🌟'})
        .withColours()

      const logger1 = Glog.create({name: 'Test1'})
      const logger2 = Glog.create({name: 'Test2'})

      logger1.info("Star info 1")
      logger2.info("Star info 2")

      assert.equal(infoOutput.length, 2)
      assert.ok(infoOutput[0][0].includes('🌟'), 'First logger inherits static symbol')
      assert.ok(infoOutput[1][0].includes('🌟'), 'Second logger inherits static symbol')
    })

    it('constructor merges partial symbols with defaults', () => {
      const logger = Glog.create({
        name: 'Test',
        symbols: {error: '🔥'},
        colours: {}
      })

      logger.info("Normal info")
      logger.error("Fire error")

      assert.equal(infoOutput.length, 1)
      assert.ok(infoOutput[0][0].includes('i'), 'Should use default info symbol')

      assert.equal(errorOutput.length, 1)
      assert.ok(errorOutput[0][0].includes('🔥'), 'Should use custom fire emoji for error')
    })

    it('setOptions merges partial symbols with defaults', () => {
      const logger = Glog.create({name: 'Test'})

      logger.setOptions({symbols: {warn: '⚠️'}, colours: {}})

      logger.info("Normal info")
      logger.warn("Custom warning")

      assert.equal(infoOutput.length, 1)
      assert.ok(infoOutput[0][0].includes('i'), 'Should use default info symbol')

      assert.equal(warnOutput.length, 1)
      assert.ok(warnOutput[0][0].includes('⚠️'), 'Should use custom warning emoji')
    })
  })

  describe('colour features (paint)', () => {
    const ESC = '\x1b'

    let originalHasColor
    let origLog, origInfo, origWarn, origError, origDebug
    let logOutput, infoOutput, warnOutput, errorOutput, debugOutput

    const setHasColor = value => {
      Object.defineProperty(Term, 'hasColor', {get: () => value, configurable: true})
    }

    beforeEach(() => {
      // Preserve the real (cached) hasColor descriptor so each test can stub it.
      originalHasColor = Object.getOwnPropertyDescriptor(Term, 'hasColor')

      logOutput = []
      infoOutput = []
      warnOutput = []
      errorOutput = []
      debugOutput = []

      origLog = console.log
      origInfo = console.info
      origWarn = console.warn
      origError = console.error
      origDebug = console.debug

      console.log = (...args) => logOutput.push(args)
      console.info = (...args) => infoOutput.push(args)
      console.warn = (...args) => warnOutput.push(args)
      console.error = (...args) => errorOutput.push(args)
      console.debug = (...args) => debugOutput.push(args)

      Glog.setLogLevel(0).setLogPrefix('')
      Glog.symbols = null
      Glog.colours = null
      Glog.name = ''
    })

    afterEach(() => {
      Object.defineProperty(Term, 'hasColor', originalHasColor)

      console.log = origLog
      console.info = origInfo
      console.warn = origWarn
      console.error = origError
      console.debug = origDebug

      Glog.symbols = null
      Glog.colours = null
      Glog.name = ''
    })

    it('colourize strips ANSI escapes when colour is unsupported', () => {
      setHasColor(false)

      Glog.colourize`{success}done{/}`

      assert.equal(logOutput.length, 1)
      assert.equal(logOutput[0][0], '[Log] done')
    })

    it('colourize preserves ANSI escapes when colour is supported', () => {
      setHasColor(true)

      Glog.colourize`{success}done{/}`

      assert.equal(logOutput.length, 1)

      const out = logOutput[0][0]

      assert.ok(out.includes(ESC), 'expected ANSI escape sequence')
      assert.ok(out.includes('done'), 'expected the literal text')
    })

    it('always resolves colour tokens out of the text, regardless of support', () => {
      // The format template must be evaluated either way; literal `{F019}` /
      // `{success}` tokens should never leak into the output.
      setHasColor(false)
      Glog.colourize`{F019}blue{/} and {success}green{/}`

      setHasColor(true)
      Glog.colourize`{F019}blue{/} and {success}green{/}`

      assert.equal(logOutput.length, 2)

      for(const entry of logOutput) {
        const out = entry[0]

        assert.ok(!out.includes('{F019}'), 'colour code token resolved')
        assert.ok(!out.includes('{success}'), 'alias token resolved')
        assert.ok(!out.includes('{/}'), 'reset token resolved')
        assert.ok(out.includes('blue') && out.includes('green'), 'text preserved')
      }
    })

    it('instance colourize uses the logger name and strips ANSI when unsupported', () => {
      setHasColor(false)

      const logger = Glog.create({name: 'App'})

      logger.colourize`{F019}blue{/} text`

      assert.equal(logOutput.length, 1)
      assert.equal(logOutput[0][0], '[App] blue text')
    })

    it('formatted info output strips ANSI when colour is unsupported', () => {
      setHasColor(false)

      const logger = Glog.create({name: 'App'})

      logger.info('hello')

      assert.equal(infoOutput.length, 1)

      const out = infoOutput[0][0]

      assert.ok(!out.includes(ESC), 'no ANSI escapes when unsupported')
      assert.ok(out.includes('[App]'), 'includes the logger name')
      assert.ok(out.includes('hello'), 'includes the message')
    })

    it('formatted info output keeps ANSI when colour is supported', () => {
      setHasColor(true)

      const logger = Glog.create({name: 'App'})

      logger.info('hello')

      assert.equal(infoOutput.length, 1)
      assert.ok(infoOutput[0][0].includes(ESC), 'ANSI escapes preserved when supported')
    })

    it('warn and error output strip ANSI when colour is unsupported', () => {
      setHasColor(false)

      const logger = Glog.create({name: 'App'})

      logger.warn('careful')
      logger.error('boom')

      assert.equal(warnOutput.length, 1)
      assert.equal(errorOutput.length, 1)
      assert.ok(!warnOutput[0][0].includes(ESC), 'warn stripped')
      assert.ok(!errorOutput[0][0].includes(ESC), 'error stripped')
      assert.ok(warnOutput[0][0].includes('careful'))
      assert.ok(errorOutput[0][0].includes('boom'))
    })

    it('debug output strips ANSI when colour is unsupported', () => {
      setHasColor(false)

      const logger = Glog.create({name: 'App', logLevel: 1})

      logger.debug('dbg')

      assert.equal(debugOutput.length, 1)
      assert.ok(!debugOutput[0][0].includes(ESC), 'debug stripped')
      assert.ok(debugOutput[0][0].includes('dbg'))
    })

    it('debug output keeps ANSI when colour is supported', () => {
      setHasColor(true)

      const logger = Glog.create({name: 'App', logLevel: 1})

      logger.debug('dbg')

      assert.equal(debugOutput.length, 1)
      assert.ok(debugOutput[0][0].includes(ESC), 'debug ANSI preserved')
    })

    it('success output strips ANSI when colour is unsupported', () => {
      setHasColor(false)

      const logger = Glog.create({name: 'App'})

      logger.success('yay')

      assert.equal(logOutput.length, 1)
      assert.ok(!logOutput[0][0].includes(ESC), 'success stripped')
      assert.ok(logOutput[0][0].includes('yay'))
    })

    it('group labels strip ANSI when colour is unsupported', () => {
      setHasColor(false)

      const logger = Glog.create({name: 'App'})

      logger.groupSuccess('grp')

      assert.ok(logOutput.length > 0, 'expected a group label')
      assert.ok(!logOutput[0][0].includes(ESC), 'group label stripped')
      assert.ok(logOutput[0][0].includes('grp'))
    })

    it('group labels keep ANSI when colour is supported', () => {
      setHasColor(true)

      const logger = Glog.create({name: 'App'})

      logger.groupSuccess('grp')

      assert.ok(logOutput.length > 0, 'expected a group label')
      assert.ok(logOutput[0][0].includes(ESC), 'group label ANSI preserved')
    })
  })
})

// TODO: Add tests for remaining Glog features
// - VSCode integration (vscodeError, vscodeWarn, vscodeInfo)
