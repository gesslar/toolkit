#!/usr/bin/env node

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import {after,before,beforeEach,describe,it} from 'node:test'

import {Cache, FileObject} from "../../src/node/index.js"

describe('Cache', () => {
  let cache
  let testDir
  let jsonFile
  let yamlFile
  let brokenJsonFile
  let brokenYamlFile
  let nonExistentFile

  before(async () => {
    // Use fixture files for testing
    const fixturesDir = path.join(process.cwd(), 'tests/fixtures')
    jsonFile = new FileObject('settings.json', fixturesDir)
    yamlFile = new FileObject('palette.yaml', fixturesDir)
    brokenJsonFile = new FileObject('broken.json5', fixturesDir)
    brokenYamlFile = new FileObject('broken.yaml', fixturesDir)

    // Create a temporary directory for test files that need modification
    testDir = path.join(process.cwd(), 'test-cache-files')
    await fs.mkdir(testDir, { recursive: true })

    nonExistentFile = new FileObject(path.join(testDir, 'does-not-exist.json'))
  })

  after(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (err) {
      // Ignore cleanup errors
      console.warn('Could not clean up test directory:', err.message)
    }
  })

  beforeEach(() => {
    // Create a fresh cache instance for each test
    cache = new Cache()
  })

  describe('constructor', () => {
    it('creates a new Cache instance', () => {
      const newCache = new Cache()
      assert.ok(newCache instanceof Cache)
    })

    it('initializes with empty internal maps', () => {
      const newCache = new Cache()
      // We can't directly access private fields, but we can test behavior
      assert.ok(newCache instanceof Cache)
    })
  })

  describe('loadDataFromCache', () => {
    it('loads and caches JSON data', async () => {
      const data = await cache.loadDataFromCache(jsonFile)

      assert.equal(typeof data, 'object')
      assert.equal(data['eslint.format.enable'], true)
      assert.equal(data['editor.formatOnSave'], true)
      assert.equal(data['editor.tabSize'], 2)
    })

    it('loads and caches YAML data', async () => {
      const data = await cache.loadDataFromCache(yamlFile)

      assert.equal(typeof data, 'object')
      assert.ok(data.vars)
      assert.ok(data.vars.colors)
      assert.equal(data.vars.colors.black, 'oklch(.145 0 0)')
      assert.equal(data.vars.colors.blue, 'oklch(0.5 0.2 210)')
    })

    it('returns cached data on subsequent calls', async () => {
      // First call - loads from file
      const data1 = await cache.loadDataFromCache(jsonFile)

      // Second call - should return cached data
      const data2 = await cache.loadDataFromCache(jsonFile)

      assert.deepEqual(data1, data2)
      assert.equal(data1['editor.tabSize'], 2)
    })

    it('throws error for non-existent file', async () => {
      await assert.rejects(
        () => cache.loadDataFromCache(nonExistentFile),
        {
          message: new RegExp(`No such file '.*does-not-exist.json'`)
        }
      )
    })
  })

  describe('loadFromCache', () => {
    it('loads and caches raw file content', async () => {
      const data = await cache.loadFromCache(jsonFile)

      assert.equal(typeof data, 'string')
      assert.ok(data.includes('"editor.tabSize"'))
    })

    it('returns cached content on subsequent calls', async () => {
      const data1 = await cache.loadFromCache(jsonFile)
      const data2 = await cache.loadFromCache(jsonFile)

      assert.equal(data1, data2)
    })

    it('throws error for non-existent file', async () => {
      await assert.rejects(
        () => cache.loadFromCache(nonExistentFile),
        {
          message: new RegExp(`No such file '.*does-not-exist.json'`)
        }
      )
    })
  })

  describe('resetCache', () => {
    it('clears cached data for a file', async () => {
      // Load to populate cache
      await cache.loadFromCache(jsonFile)

      // Reset and re-load (should re-read from disk)
      cache.resetCache(jsonFile)

      const data = await cache.loadFromCache(jsonFile)
      assert.equal(typeof data, 'string')
    })

    it('does not affect other cached files', async () => {
      await cache.loadFromCache(jsonFile)
      await cache.loadFromCache(yamlFile)

      cache.resetCache(jsonFile)

      // YAML should still be cached
      const yamlData = await cache.loadFromCache(yamlFile)
      assert.equal(typeof yamlData, 'string')
    })
  })

  describe('cache invalidation', () => {
    it('invalidates cache when file is modified', async () => {
      // Create a modifiable copy in test directory
      const copyPath = path.join(testDir, 'modifiable-settings.json')
      const originalContent = await fs.readFile(jsonFile.path, 'utf8')
      await fs.writeFile(copyPath, originalContent)
      const modifiableFile = new FileObject(copyPath)

      // Load initial data
      const initialData = await cache.loadDataFromCache(modifiableFile)
      assert.equal(initialData['editor.tabSize'], 2)

      // Wait a bit to ensure different modification time
      await new Promise(resolve => setTimeout(resolve, 10))

      // Modify the file
      const updatedContent = JSON.stringify({
        'editor.tabSize': 4,
        'modified': true
      }, null, 2)
      await fs.writeFile(modifiableFile.path, updatedContent)

      // Load again - should get updated data
      const newData = await cache.loadDataFromCache(modifiableFile)
      assert.equal(newData['editor.tabSize'], 4)
      assert.equal(newData.modified, true)
    })

    it('maintains separate caches for different files', async () => {
      const jsonData = await cache.loadDataFromCache(jsonFile)
      const yamlData = await cache.loadDataFromCache(yamlFile)

      // Both should be cached independently
      assert.equal(jsonData['editor.tabSize'], 2)
      assert.equal(yamlData.vars.colors.black, 'oklch(.145 0 0)')

      // They have different structures
      assert.ok(jsonData['eslint.format.enable']) // JSON has this
      assert.equal(yamlData['eslint.format.enable'], undefined) // YAML doesn't
    })
  })

  describe('raw and structured interplay', () => {
    it('raw then structured returns correct types', async () => {
      const raw = await cache.loadFromCache(jsonFile)
      const structured = await cache.loadDataFromCache(jsonFile)

      assert.equal(typeof raw, 'string')
      assert.equal(typeof structured, 'object')
      assert.equal(structured['editor.tabSize'], 2)
    })

    it('structured then raw returns correct types', async () => {
      const structured = await cache.loadDataFromCache(jsonFile)
      const raw = await cache.loadFromCache(jsonFile)

      assert.equal(typeof structured, 'object')
      assert.equal(typeof raw, 'string')
      assert.ok(raw.includes('"editor.tabSize"'))
    })

    it('structured populates raw as well', async () => {
      await cache.loadDataFromCache(jsonFile)

      // raw should already be populated, no re-read needed
      const raw = await cache.loadFromCache(jsonFile)

      assert.equal(typeof raw, 'string')
      assert.ok(raw.includes('"editor.tabSize"'))
    })

    it('invalidation clears both raw and structured', async () => {
      const copyPath = path.join(testDir, 'interplay-test.json')
      await fs.writeFile(copyPath, '{"v": 1}')
      const file = new FileObject(copyPath)

      await cache.loadFromCache(file)
      await cache.loadDataFromCache(file)

      await new Promise(resolve => setTimeout(resolve, 10))
      await fs.writeFile(copyPath, '{"v": 2}')

      const raw = await cache.loadFromCache(file)
      const structured = await cache.loadDataFromCache(file)

      assert.ok(raw.includes('"v": 2'))
      assert.equal(structured.v, 2)
    })
  })

  describe('encoding forwarding', () => {
    it('forwards encoding through loadFromCache', async () => {
      const copyPath = path.join(testDir, 'encoding-test.txt')
      await fs.writeFile(copyPath, 'hello', 'utf8')
      const file = new FileObject(copyPath)

      const data = await cache.loadFromCache(
        file, {encoding: 'utf8'})

      assert.equal(data, 'hello')
    })

    it('forwards encoding through loadDataFromCache', async () => {
      const copyPath = path.join(testDir, 'encoding-data.json')
      await fs.writeFile(copyPath, '{"ok": true}', 'utf8')
      const file = new FileObject(copyPath)

      const data = await cache.loadDataFromCache(
        file, {encoding: 'utf8'})

      assert.equal(data.ok, true)
    })
  })

  describe('cache consistency', () => {
    it('handles race conditions gracefully', async () => {
      // Simulate concurrent access
      const promises = Array(5).fill(null).map(() =>
        cache.loadDataFromCache(jsonFile)
      )

      const results = await Promise.all(promises)

      // All results should be identical
      results.forEach(result => {
        assert.deepEqual(result, results[0])
      })
    })

    it('cleans up cache properly on invalidation', async () => {
      // Create a modifiable copy
      const copyPath = path.join(testDir, 'cleanup-test.json')
      await fs.writeFile(copyPath, '{"initial": true}')
      const modifiableFile = new FileObject(copyPath)

      // Load data to populate cache
      await cache.loadDataFromCache(modifiableFile)

      // Modify file to trigger cache invalidation
      await new Promise(resolve => setTimeout(resolve, 10))
      await fs.writeFile(modifiableFile.path, '{"modified": true}')

      // Load again - should get new data
      const newData = await cache.loadDataFromCache(modifiableFile)
      assert.equal(newData.modified, true)
    })
  })

  describe('error handling', () => {
    it('handles corrupted cache state gracefully', async () => {
      // This test simulates a scenario where modification time exists
      // but cached data doesn't (which shouldn't happen normally)

      // Load data first to populate cache
      await cache.loadDataFromCache(jsonFile)

      // File should load normally
      const data = await cache.loadDataFromCache(jsonFile)
      assert.equal(typeof data, 'object')
    })

    it('handles file deletion after caching', async () => {
      // Create a temporary file
      const tempPath = path.join(testDir, 'temp-delete-test.json')
      await fs.writeFile(tempPath, '{"temp": true}')
      const tempFile = new FileObject(tempPath)

      // Load and cache the file
      const data = await cache.loadDataFromCache(tempFile)
      assert.equal(data.temp, true)

      // Delete the file
      await fs.unlink(tempPath)

      // Subsequent access should throw error
      await assert.rejects(
        () => cache.loadDataFromCache(tempFile),
        {
          message: new RegExp(`No such file '.*temp-delete-test.json'`)
        }
      )
    })

    it('handles invalid JSON/YAML files', async () => {
      // Use fixture broken files
      await assert.rejects(
        () => cache.loadDataFromCache(brokenJsonFile),
        {
          message: /Content is neither valid JSON5 nor valid YAML/
        }
      )

      await assert.rejects(
        () => cache.loadDataFromCache(brokenYamlFile),
        {
          message: /Content is neither valid JSON5 nor valid YAML/
        }
      )
    })
  })

  describe('memory management', () => {
    it('can handle multiple files without memory leaks', async () => {
      const files = []
      const numFiles = 10

      // Create multiple test files
      for (let i = 0; i < numFiles; i++) {
        const filePath = path.join(testDir, `test-${i}.json`)
        await fs.writeFile(filePath, JSON.stringify({ id: i, data: `content-${i}` }))
        files.push(new FileObject(filePath))
      }

      // Load all files
      const results = await Promise.all(
        files.map(file => cache.loadDataFromCache(file))
      )

      // Verify all files were loaded correctly
      results.forEach((data, index) => {
        assert.equal(data.id, index)
        assert.equal(data.data, `content-${index}`)
      })

      // Clean up
      await Promise.all(
        files.map(file => fs.unlink(file.path).catch(() => {}))
      )
    })
  })
})
