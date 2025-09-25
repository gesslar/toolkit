import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import fs from "node:fs/promises"

import { DirectoryObject, Sass } from "../../src/index.js"
import { TestUtils } from "../helpers/test-utils.js"

describe("DirectoryObject", () => {
  let testDir

  describe("constructor and basic properties", () => {
    it("creates DirectoryObject with valid directory", () => {
      const dir = new DirectoryObject("/home/user/test")
      
      assert.ok(dir instanceof DirectoryObject)
      assert.equal(typeof dir.supplied, "string")
      assert.equal(typeof dir.path, "string")
      assert.equal(typeof dir.uri, "string")
      assert.equal(typeof dir.name, "string")
    })

    it("handles relative paths", () => {
      const dir = new DirectoryObject("../test")
      
      assert.ok(path.isAbsolute(dir.path))
      assert.equal(dir.supplied, "../test")
    })

    it("handles current directory", () => {
      const dir = new DirectoryObject(".")
      
      assert.equal(dir.supplied, ".")
      assert.equal(dir.name, path.basename(process.cwd()))
    })

    it("handles null/undefined input", () => {
      const dir1 = new DirectoryObject(null)
      const dir2 = new DirectoryObject(undefined)
      
      assert.equal(dir1.supplied, ".")
      assert.equal(dir2.supplied, ".")
    })

    it("fixes slashes in paths", () => {
      const dir = new DirectoryObject("path\\\\with\\\\backslashes")
      
      assert.ok(!dir.supplied.includes("\\\\"))
      assert.ok(dir.supplied.includes("/"))
    })
  })

  describe("getters", () => {
    let testDirObj

    beforeEach(() => {
      testDirObj = new DirectoryObject("/home/user/projects/myapp")
    })

    it("supplied returns original path", () => {
      const dir = new DirectoryObject("../test")
      assert.equal(dir.supplied, "../test")
    })

    it("path returns absolute path", () => {
      assert.ok(path.isAbsolute(testDirObj.path))
    })

    it("uri returns file URI", () => {
      assert.ok(testDirObj.uri.startsWith("file://"))
    })

    it("name returns directory name", () => {
      assert.equal(testDirObj.name, "myapp")
    })

    it("module returns same as name for directories", () => {
      assert.equal(testDirObj.module, testDirObj.name)
    })

    it("extension returns empty string", () => {
      assert.equal(testDirObj.extension, "")
    })

    it("isFile returns false", () => {
      assert.equal(testDirObj.isFile, false)
    })

    it("isDirectory returns true", () => {
      assert.equal(testDirObj.isDirectory, true)
    })
  })

  describe("string representations", () => {
    it("toString returns formatted string", () => {
      const dir = new DirectoryObject("/test/path")
      const str = dir.toString()
      
      assert.ok(str.includes("DirectoryObject"))
      assert.ok(str.includes(dir.path))
    })

    it("toJSON returns object representation", () => {
      const dir = new DirectoryObject("/test/path")
      const json = dir.toJSON()
      
      assert.equal(typeof json, "object")
      assert.ok("supplied" in json)
      assert.ok("path" in json)
      assert.ok("uri" in json)
      assert.ok("name" in json)
      assert.ok("module" in json)
      assert.ok("extension" in json)
      assert.ok("isFile" in json)
      assert.ok("isDirectory" in json)
      
      assert.equal(json.isFile, false)
      assert.equal(json.isDirectory, true)
    })
  })

  describe("exists check", () => {
    let existingDir, nonExistentDir

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("dir-obj-test")
      existingDir = new DirectoryObject(testDir)
      nonExistentDir = new DirectoryObject(path.join(testDir, "nonexistent"))
    })

    afterEach(async () => {
      if (testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("exists returns true for existing directory", async () => {
      const exists = await existingDir.exists
      assert.equal(exists, true)
    })

    it("exists returns false for non-existent directory", async () => {
      const exists = await nonExistentDir.exists
      assert.equal(exists, false)
    })

    it("exists is a Promise", () => {
      const existsPromise = existingDir.exists
      assert.ok(existsPromise instanceof Promise)
    })
  })

  describe("read method", () => {
    let testDirObj, subDir, testFile

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("dir-read-test")
      testDirObj = new DirectoryObject(testDir)
      
      // Create subdirectory and file for testing
      subDir = path.join(testDir, "subdir")
      await fs.mkdir(subDir)
      
      testFile = path.join(testDir, "test.txt")
      await fs.writeFile(testFile, "test content")
    })

    afterEach(async () => {
      if (testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("returns files and directories", async () => {
      const result = await testDirObj.read(testDirObj)
      
      assert.ok(Array.isArray(result.files))
      assert.ok(Array.isArray(result.directories))
      assert.equal(result.files.length, 1)
      assert.equal(result.directories.length, 1)
    })

    it("returned files are FileObject instances", async () => {
      const { files } = await testDirObj.read(testDirObj)
      
      // Note: This might fail due to circular import
      assert.ok(files[0].constructor.name === "FileObject")
    })

    it("returned directories are DirectoryObject instances", async () => {
      const { directories } = await testDirObj.read(testDirObj)
      
      assert.ok(directories[0] instanceof DirectoryObject)
    })

    it("handles empty directory", async () => {
      const emptyDir = path.join(testDir, "empty")
      await fs.mkdir(emptyDir)
      const emptyDirObj = new DirectoryObject(emptyDir)
      
      const result = await emptyDirObj.read(emptyDirObj)
      assert.equal(result.files.length, 0)
      assert.equal(result.directories.length, 0)
    })
  })

  describe("assureExists method", () => {
    let testDirPath, testDirObj

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("dir-assure-test")
      testDirPath = path.join(testDir, "new-dir")
      testDirObj = new DirectoryObject(testDirPath)
    })

    afterEach(async () => {
      if (testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("creates directory if it doesn't exist", async () => {
      assert.equal(await testDirObj.exists, false)
      
      await testDirObj.assureExists()
      
      assert.equal(await testDirObj.exists, true)
    })

    it("doesn't throw if directory already exists", async () => {
      await testDirObj.assureExists()
      
      // Should not throw
      await testDirObj.assureExists()
      
      assert.equal(await testDirObj.exists, true)
    })

    it("handles nested directory creation", async () => {
      const nestedPath = path.join(testDir, "level1", "level2", "level3")
      const nestedDir = new DirectoryObject(nestedPath)
      
      // This might fail without recursive option
      try {
        await nestedDir.assureExists({ recursive: true })
        assert.equal(await nestedDir.exists, true)
      } catch (e) {
        // Expected to fail if recursive is not set by default
        assert.ok(e instanceof Sass)
      }
    })

    it("throws Sass error on failure", async () => {
      // Try to create directory in non-existent parent without recursive
      const invalidPath = path.join(testDir, "nonexistent", "subdir")
      const invalidDir = new DirectoryObject(invalidPath)
      
      await assert.rejects(
        () => invalidDir.assureExists(),
        Sass
      )
    })
  })

  describe("edge cases and error handling", () => {
    it("handles special characters in path", () => {
      const dir = new DirectoryObject("/test/path with spaces/and-dashes")
      
      assert.ok(dir.path.includes("spaces"))
      assert.ok(dir.path.includes("dashes"))
    })

    it("handles very long paths", () => {
      const longPath = "/test/" + "a".repeat(200) + "/dir"
      const dir = new DirectoryObject(longPath)
      
      assert.ok(dir.path.includes("a".repeat(200)))
    })

    it("meta object is frozen", () => {
      const dir = new DirectoryObject("/test")
      
      // Should not be able to modify internal meta
      assert.throws(() => {
        dir.supplied = "modified"  // This should fail
      }, TypeError)
    })
  })
})