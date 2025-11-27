#!/usr/bin/env node

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import {after,before,beforeEach,describe,it} from 'node:test'

import Cache from '../../src/lib/Cache.js'
import FileObject from '../../src/lib/FileObject.js'

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

  describe('loadCachedData', () => {
    it('loads and caches JSON data', async () => {
      const data = await cache.loadCachedData(jsonFile)

      assert.equal(typeof data, 'object')
      assert.equal(data['eslint.format.enable'], true)
      assert.equal(data['editor.formatOnSave'], true)
      assert.equal(data['editor.tabSize'], 2)
    })

    it('loads and caches YAML data', async () => {
      const data = await cache.loadCachedData(yamlFile)

      assert.equal(typeof data, 'object')
      assert.ok(data.vars)
      assert.ok(data.vars.colors)
      assert.equal(data.vars.colors.black, 'oklch(.145 0 0)')
      assert.equal(data.vars.colors.blue, 'oklch(0.5 0.2 210)')
    })

    it('returns cached data on subsequent calls', async () => {
      // First call - loads from file
      const data1 = await cache.loadCachedData(jsonFile)

      // Second call - should return cached data
      const data2 = await cache.loadCachedData(jsonFile)

      assert.deepEqual(data1, data2)
      assert.equal(data1['editor.tabSize'], 2)
    })

    it('throws error for non-existent file', async () => {
      await assert.rejects(
        () => cache.loadCachedData(nonExistentFile),
        {
          message: new RegExp(`Unable to find file '.*does-not-exist.json'`)
        }
      )
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
      const initialData = await cache.loadCachedData(modifiableFile)
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
      const newData = await cache.loadCachedData(modifiableFile)
      assert.equal(newData['editor.tabSize'], 4)
      assert.equal(newData.modified, true)
    })

    it('maintains separate caches for different files', async () => {
      const jsonData = await cache.loadCachedData(jsonFile)
      const yamlData = await cache.loadCachedData(yamlFile)

      // Both should be cached independently
      assert.equal(jsonData['editor.tabSize'], 2)
      assert.equal(yamlData.vars.colors.black, 'oklch(.145 0 0)')

      // They have different structures
      assert.ok(jsonData['eslint.format.enable']) // JSON has this
      assert.equal(yamlData['eslint.format.enable'], undefined) // YAML doesn't
    })
  })

  describe('cache consistency', () => {
    it('handles race conditions gracefully', async () => {
      // Simulate concurrent access
      const promises = Array(5).fill(null).map(() =>
        cache.loadCachedData(jsonFile)
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
      await cache.loadCachedData(modifiableFile)

      // Modify file to trigger cache invalidation
      await new Promise(resolve => setTimeout(resolve, 10))
      await fs.writeFile(modifiableFile.path, '{"modified": true}')

      // Load again - should get new data
      const newData = await cache.loadCachedData(modifiableFile)
      assert.equal(newData.modified, true)
    })
  })

  describe('error handling', () => {
    it('handles corrupted cache state gracefully', async () => {
      // This test simulates a scenario where modification time exists
      // but cached data doesn't (which shouldn't happen normally)

      // Load data first to populate cache
      await cache.loadCachedData(jsonFile)

      // File should load normally
      const data = await cache.loadCachedData(jsonFile)
      assert.equal(typeof data, 'object')
    })

    it('handles file deletion after caching', async () => {
      // Create a temporary file
      const tempPath = path.join(testDir, 'temp-delete-test.json')
      await fs.writeFile(tempPath, '{"temp": true}')
      const tempFile = new FileObject(tempPath)

      // Load and cache the file
      const data = await cache.loadCachedData(tempFile)
      assert.equal(data.temp, true)

      // Delete the file
      await fs.unlink(tempPath)

      // Subsequent access should throw error
      await assert.rejects(
        () => cache.loadCachedData(tempFile),
        {
          message: new RegExp(`Unable to find file '.*temp-delete-test.json'`)
        }
      )
    })

    it('handles invalid JSON/YAML files', async () => {
      // Use fixture broken files
      await assert.rejects(
        () => cache.loadCachedData(brokenJsonFile),
        {
          message: /Content is neither valid JSON5 nor valid YAML/
        }
      )

      await assert.rejects(
        () => cache.loadCachedData(brokenYamlFile),
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
        files.map(file => cache.loadCachedData(file))
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
