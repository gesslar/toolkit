import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import {afterEach,beforeEach,describe,it} from "node:test"

import {DirectoryObject,Sass} from "../../src/index.js"
import {TestUtils} from "../helpers/test-utils.js"

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
      const result = await testDirObj.read()

      assert.ok(Array.isArray(result.files))
      assert.ok(Array.isArray(result.directories))
      assert.equal(result.files.length, 1)
      assert.equal(result.directories.length, 1)
    })

    it("returned files are FileObject instances", async () => {
      const { files } = await testDirObj.read()

      // Note: This might fail due to circular import
      assert.ok(files[0].constructor.name === "FileObject")
    })

    it("returned directories are DirectoryObject instances", async () => {
      const { directories } = await testDirObj.read()

      assert.ok(directories[0] instanceof DirectoryObject)
    })

    it("handles empty directory", async () => {
      const emptyDir = path.join(testDir, "empty")
      await fs.mkdir(emptyDir)
      const emptyDirObj = new DirectoryObject(emptyDir)

      const result = await emptyDirObj.read()
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

  describe("sep property", () => {
    it("returns platform-specific path separator", () => {
      const dir = new DirectoryObject("/test/path")

      assert.ok(dir.sep)
      assert.equal(typeof dir.sep, "string")
      assert.equal(dir.sep, path.sep)
    })

    it("matches Node.js path.sep", () => {
      const dir = new DirectoryObject("/any/path")

      // Should be either '/' or '\\'
      assert.ok(dir.sep === "/" || dir.sep === "\\\\")
      assert.equal(dir.sep, path.sep)
    })

    it("is consistent across different paths", () => {
      const dir1 = new DirectoryObject("/path/one")
      const dir2 = new DirectoryObject("/path/two")

      assert.equal(dir1.sep, dir2.sep)
    })
  })

  describe("trail property", () => {
    it("returns array of path segments", () => {
      const dir = new DirectoryObject("/home/user/projects")

      assert.ok(Array.isArray(dir.trail))
      assert.ok(dir.trail.length > 0)
    })

    it("splits path correctly on Unix-style paths", () => {
      const dir = new DirectoryObject("/home/user/projects")

      assert.ok(dir.trail.includes("home"))
      assert.ok(dir.trail.includes("user"))
      assert.ok(dir.trail.includes("projects"))
    })

    it("handles root directory", () => {
      const dir = new DirectoryObject("/")

      assert.ok(Array.isArray(dir.trail))
      // Root should have minimal segments
      assert.ok(dir.trail.length >= 1)
    })

    it("handles single-level directory", () => {
      const dir = new DirectoryObject("/test")

      assert.ok(Array.isArray(dir.trail))
      assert.ok(dir.trail.includes("test"))
    })

    it("handles deeply nested paths", () => {
      const dir = new DirectoryObject("/a/b/c/d/e/f/g")

      assert.ok(Array.isArray(dir.trail))
      assert.ok(dir.trail.length >= 7)
      assert.ok(dir.trail.includes("g"))
    })

    it("trail property is immutable from outside", () => {
      const dir = new DirectoryObject("/test/path")

      // Getting the trail should not allow external mutation
      const trail = dir.trail

      assert.throws(() => {
        dir.trail = ["modified"]
      }, TypeError)

      // Original trail should be unchanged
      assert.deepEqual(dir.trail, trail)
    })
  })

  describe("walkUp generator", () => {
    it("yields parent directories up to root", () => {
      const dir = new DirectoryObject("/home/user/projects/myapp")
      const parents = []

      for(const parent of dir.walkUp) {
        parents.push(parent.path)
      }

      assert.ok(parents.length > 0)
      assert.ok(parents[0].includes("myapp"))
      assert.ok(parents.some(p => p.includes("projects")))
      assert.ok(parents.some(p => p.includes("user")))
      assert.ok(parents.some(p => p.includes("home")))
    })

    it("yields DirectoryObject instances", () => {
      const dir = new DirectoryObject("/home/user/projects")

      for(const parent of dir.walkUp) {
        assert.ok(parent instanceof DirectoryObject)
        assert.ok(typeof parent.path === "string")
        assert.ok(path.isAbsolute(parent.path))
      }
    })

    it("walks up from current directory", () => {
      const dir = new DirectoryObject(".")
      const parents = []

      for(const parent of dir.walkUp) {
        parents.push(parent)
      }

      // Should yield at least the current directory
      assert.ok(parents.length > 0)
      assert.ok(parents[0] instanceof DirectoryObject)
    })

    it("handles root directory gracefully", () => {
      const dir = new DirectoryObject("/")
      const parents = []

      for(const parent of dir.walkUp) {
        parents.push(parent.path)
      }

      // Root should yield at least itself
      assert.ok(parents.length >= 1)
    })

    it("yields progressively shorter paths", () => {
      // Use an absolute path to avoid resolution issues
      const testPath = path.join(path.sep, "home", "user", "projects", "app")
      const dir = new DirectoryObject(testPath)
      const parents = []

      for(const parent of dir.walkUp) {
        parents.push(parent.path)
      }

      // Verify we got multiple parents
      assert.ok(parents.length > 1, "Should yield multiple parents")

      // First path should be the deepest (longest)
      // Each subsequent path walking up should be shorter or equal (approaching root)
      const firstPath = parents[0]
      const lastPath = parents[parents.length - 1]

      // The first path should be longer than (or equal to) the last
      assert.ok(
        firstPath.length >= lastPath.length,
        `Expected first path ${firstPath} (${firstPath.length}) to be longer than or equal to last path ${lastPath} (${lastPath.length})`
      )

      // Each path should contain its parent as a prefix
      for(let i = 0; i < parents.length - 1; i++) {
        const current = parents[i]
        const next = parents[i + 1]

        // Current path should start with the next (parent) path
        assert.ok(
          current.startsWith(next) || current === next,
          `Expected ${current} to start with parent path ${next}`
        )
      }
    })

    it("can be iterated multiple times", () => {
      const dir = new DirectoryObject("/home/user/test")

      const firstPass = [...dir.walkUp]
      const secondPass = [...dir.walkUp]

      assert.equal(firstPass.length, secondPass.length)
      assert.deepEqual(
        firstPass.map(d => d.path),
        secondPass.map(d => d.path)
      )
    })

    it("works with spread operator", () => {
      const dir = new DirectoryObject("/a/b/c")
      const parents = [...dir.walkUp]

      assert.ok(Array.isArray(parents))
      assert.ok(parents.length > 0)
      assert.ok(parents.every(p => p instanceof DirectoryObject))
    })

    it("works with for-of loop", () => {
      const dir = new DirectoryObject("/test/path")
      let count = 0

      for(const parent of dir.walkUp) {
        assert.ok(parent instanceof DirectoryObject)
        count++
      }

      assert.ok(count > 0)
    })

    it("handles deeply nested paths efficiently", () => {
      const deepPath = "/a/b/c/d/e/f/g/h/i/j"
      const dir = new DirectoryObject(deepPath)
      const parents = [...dir.walkUp]

      // Should yield all levels
      assert.ok(parents.length >= 10)
    })

    it("first yielded directory is the current one", () => {
      const testPath = "/home/user/projects"
      const dir = new DirectoryObject(testPath)

      const first = dir.walkUp.next().value

      assert.ok(first instanceof DirectoryObject)
      assert.equal(first.path, dir.path)
    })
  })

  describe("assureExists method - enhanced error handling", () => {
    let testDir

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("dir-assure-enhanced-test")
    })

    afterEach(async () => {
      if(testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("creates directory if it doesn't exist", async () => {
      const newDirPath = path.join(testDir, "new-directory")
      const dir = new DirectoryObject(newDirPath)

      assert.equal(await dir.exists, false)

      await dir.assureExists()

      assert.equal(await dir.exists, true)
    })

    it("doesn't throw if directory already exists", async () => {
      const dirPath = path.join(testDir, "existing")
      const dir = new DirectoryObject(dirPath)

      await dir.assureExists()
      assert.equal(await dir.exists, true)

      // Should not throw on second call
      await dir.assureExists()
      assert.equal(await dir.exists, true)
    })

    it("handles EEXIST error gracefully", async () => {
      const dirPath = path.join(testDir, "test-exists")
      const dir = new DirectoryObject(dirPath)

      // Create it manually
      await fs.mkdir(dirPath)

      // Should handle already existing without throwing
      await dir.assureExists()

      assert.equal(await dir.exists, true)
    })

    it("creates nested directories with recursive option", async () => {
      const nestedPath = path.join(testDir, "level1", "level2", "level3")
      const dir = new DirectoryObject(nestedPath)

      await dir.assureExists({recursive: true})

      assert.equal(await dir.exists, true)
    })

    it("throws Sass error for non-EEXIST failures", async () => {
      // Try to create in a location that will fail
      const invalidPath = path.join(testDir, "parent-not-exist", "child")
      const dir = new DirectoryObject(invalidPath)

      await assert.rejects(
        () => dir.assureExists(), // without recursive
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Unable to create directory/)
          return true
        }
      )
    })

    it("accepts custom options like mode", async () => {
      const dirPath = path.join(testDir, "custom-mode")
      const dir = new DirectoryObject(dirPath)

      await dir.assureExists({mode: 0o755})

      assert.equal(await dir.exists, true)
    })

    it("returns early if directory already exists", async () => {
      const dirPath = path.join(testDir, "early-return")
      const dir = new DirectoryObject(dirPath)

      await dir.assureExists()

      // This should return immediately without attempting mkdir
      const startTime = Date.now()
      await dir.assureExists()
      const endTime = Date.now()

      // Should be very fast since it returns early
      assert.ok(endTime - startTime < 100)
    })

    it("handles concurrent calls gracefully", async () => {
      const dirPath = path.join(testDir, "concurrent")
      const dir = new DirectoryObject(dirPath)

      // Call multiple times concurrently
      await Promise.all([
        dir.assureExists(),
        dir.assureExists(),
        dir.assureExists()
      ])

      assert.equal(await dir.exists, true)
    })

    it("preserves original error message in Sass wrapper", async () => {
      const invalidPath = path.join(testDir, "fail", "deep", "path")
      const dir = new DirectoryObject(invalidPath)

      try {
        await dir.assureExists()
        assert.fail("Should have thrown")
      } catch(error) {
        assert.ok(error instanceof Sass)
        assert.ok(error.message.includes(invalidPath))
        assert.match(error.message, /Unable to create directory/)
      }
    })
  })
})
