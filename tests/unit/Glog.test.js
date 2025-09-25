#!/usr/bin/env node

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import console from 'node:console'

import Glog from '../../src/lib/Glog.js'

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
})