import assert from "node:assert/strict"
import fs from "node:fs/promises"

import path from "node:path"
import {URL} from "node:url"
import {afterEach,beforeEach,describe,it} from "node:test"

import {DirectoryObject, FileObject, Sass} from "../../src/node/index.js"
import {TestUtils} from "../helpers/test-utils.js"

describe("DirectoryObject", () => {
  let testDir
  let baseDir = path.join(process.cwd(), "test-toolkit")
  const win = process.platform === 'win32';
  const lin = process.platform !== 'win32';


  describe("constructor and basic properties", () => {

    it("creates DirectoryObject with valid directory", () => {
      const dir = new DirectoryObject("/home/user/test")

      assert.ok(dir instanceof DirectoryObject)
      assert.equal(typeof dir.supplied, "string")
      assert.equal(typeof dir.path, "string")
      assert.ok(dir.url instanceof URL)
      assert.equal(typeof dir.name, "string")
    })

    it("handles relative paths", () => {
      const dir = new DirectoryObject("../test")
      const expected = path.normalize("../test")

      assert.ok(path.isAbsolute(dir.path))
      assert.equal(dir.supplied, expected)
    })

    it("handles current directory", () => {
      const dir = new DirectoryObject(".")

      assert.equal(dir.supplied, ".")
      assert.equal(dir.name, path.basename(process.cwd()))
    })

    it("handles no arguments (defaults to current directory)", () => {
      const dir = new DirectoryObject()

      assert.equal(dir.supplied, undefined)
      assert.equal(dir.path, process.cwd())
    })

    it("handles undefined input (defaults to current directory)", () => {
      const dir = new DirectoryObject(undefined)

      assert.equal(dir.supplied, undefined)
      assert.equal(dir.path, process.cwd())
    })

    it("fixes slashes in paths", () => {
      const parts = ["path", "with", "backslashes"]
      const dir = new DirectoryObject(parts.join("\\\\"))
      const good = path.normalize(parts.join(path.sep))

      console.log(dir.toString(), good)

      assert.ok(dir.path.endsWith(good))
    })
  })

  describe("getters", () => {

    let testDirObj

    beforeEach(() => {
      testDirObj = new DirectoryObject("/home/user/projects/myapp")
    })

    it("supplied returns original path", () => {
      const dir = new DirectoryObject("../test")
      assert.equal(dir.supplied, path.normalize("../test"))
    })

    it("path returns absolute path", () => {
      assert.ok(path.isAbsolute(testDirObj.path))
    })

    it("url returns file URL", () => {
      assert.ok(testDirObj.url instanceof URL)
      assert.ok(testDirObj.url.href.startsWith("file://"))
    })

    it("name returns directory name", () => {
      assert.equal(testDirObj.name, "myapp")
    })

    it("isDirectory returns true", () => {
      assert.equal(testDirObj.isDirectory, true)
    })

  })

  describe("parent property", () => {

    it("returns DirectoryObject for non-root directory", () => {
      const dir = new DirectoryObject("/home/user/projects")
      const parent = dir.parent

      assert.ok(parent instanceof DirectoryObject)
      assert.equal(parent.path, path.resolve("/home/user"))
    })

    it("returns null for root directory", () => {
      const root = new DirectoryObject("/")
      const parent = root.parent

      assert.equal(parent, null)
    })

    it("parent path is correct for nested directories", () => {
      const dir = new DirectoryObject("/a/b/c/d")

      assert.equal(dir.parent.path, path.resolve("/a/b/c"))
      assert.equal(dir.parent.parent.path, path.resolve("/a/b"))
      assert.equal(dir.parent.parent.parent.path, path.resolve("/a"))
    })

    it("caches parent on subsequent accesses", () => {
      const dir = new DirectoryObject("/home/user")
      const parent1 = dir.parent
      const parent2 = dir.parent

      assert.strictEqual(parent1, parent2)
    })
  })

  describe("string representations", () => {
    it("toString returns formatted string", () => {
      const dir = new DirectoryObject("/test/path")
      const str = dir.toString()

      assert.ok(str.includes("DirectoryObject"))
      assert.ok(str.includes(dir.path))
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

    it("filters files with pattern parameter", async () => {
      // Create multiple files with different extensions
      await fs.writeFile(path.join(testDir, "test1.txt"), "content1")
      await fs.writeFile(path.join(testDir, "test2.js"), "content2")
      await fs.writeFile(path.join(testDir, "test3.txt"), "content3")

      const result = await testDirObj.read("*.txt")

      assert.ok(Array.isArray(result.files))
      // beforeEach creates test.txt, plus test1.txt and test3.txt = 3 total
      assert.equal(result.files.length, 3)
      assert.ok(result.files.every(f => f.name.endsWith(".txt")))
    })

    it("filters directories with pattern parameter", async () => {
      // Create multiple directories
      await fs.mkdir(path.join(testDir, "dir1"))
      await fs.mkdir(path.join(testDir, "dir2"))
      await fs.mkdir(path.join(testDir, "other"))

      const result = await testDirObj.read("dir*")

      assert.ok(Array.isArray(result.directories))
      assert.equal(result.directories.length, 2)
      assert.ok(result.directories.every(d => d.name.startsWith("dir")))
    })

    it("returns all items when pattern is empty string", async () => {
      // Should behave same as read() with no arguments
      const result = await testDirObj.read("")

      assert.ok(Array.isArray(result.files))
      assert.ok(Array.isArray(result.directories))
      assert.equal(result.files.length, 1)
      assert.equal(result.directories.length, 1)
    })

    it("excludes items from subdirectories with pattern", async () => {
      // Create nested structure
      const nestedDir = path.join(testDir, "nested")
      await fs.mkdir(nestedDir)
      await fs.writeFile(path.join(nestedDir, "nested.txt"), "nested content")
      await fs.writeFile(path.join(testDir, "root.txt"), "root content")

      const result = await testDirObj.read("*.txt")

      // Should only match root-level txt files, not nested ones
      // beforeEach creates test.txt, plus root.txt = 2 total
      assert.equal(result.files.length, 2)
      const fileNames = result.files.map(f => f.name).sort()
      assert.deepEqual(fileNames, ["root.txt", "test.txt"])
    })
  })

  describe("glob method", () => {
    let testDirObj

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("dir-glob-test")
      testDirObj = new DirectoryObject(testDir)

      // Create nested directory structure for testing
      const nested1 = path.join(testDir, "src")
      const nested2 = path.join(testDir, "src", "lib")
      const nested3 = path.join(testDir, "tests")
      await fs.mkdir(nested1)
      await fs.mkdir(nested2)
      await fs.mkdir(nested3)

      // Create various files at different levels
      await fs.writeFile(path.join(testDir, "README.md"), "readme")
      await fs.writeFile(path.join(testDir, "package.json"), "{}")
      await fs.writeFile(path.join(nested1, "index.js"), "code")
      await fs.writeFile(path.join(nested1, "utils.js"), "code")
      await fs.writeFile(path.join(nested2, "helper.js"), "code")
      await fs.writeFile(path.join(nested2, "data.json"), "{}")
      await fs.writeFile(path.join(nested3, "test.js"), "test")
    })

    afterEach(async () => {
      if(testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("finds all files recursively with ** pattern", async () => {
      const {files} = await testDirObj.glob("**/*.js")

      assert.ok(Array.isArray(files))
      assert.equal(files.length, 4) // index.js, utils.js, helper.js, test.js
      assert.ok(files.every(f => f.name.endsWith(".js")))
    })

    it("finds files in specific subdirectory", async () => {
      const {files} = await testDirObj.glob("src/*.js")

      assert.ok(Array.isArray(files))
      assert.equal(files.length, 2) // index.js, utils.js (not helper.js in src/lib)
      assert.ok(files.every(f => f.path.includes("src")))
    })

    it("finds nested files with deep pattern", async () => {
      const {files} = await testDirObj.glob("src/**/*.js")

      assert.ok(Array.isArray(files))
      assert.equal(files.length, 3) // index.js, utils.js, helper.js
    })

    it("finds directories recursively", async () => {
      const {directories} = await testDirObj.glob("**/*")

      assert.ok(Array.isArray(directories))
      assert.ok(directories.length >= 3) // src, lib, tests
      assert.ok(directories.every(d => d instanceof DirectoryObject))
    })

    it("returns FileObject instances for regular directories", async () => {
      const {files} = await testDirObj.glob("**/*.json")

      assert.ok(files.every(f => f instanceof FileObject))
      assert.ok(files.every(f => f.constructor.name === "FileObject"))
    })

    it("returns DirectoryObject instances", async () => {
      const {directories} = await testDirObj.glob("src/*")

      assert.ok(directories.every(d => d instanceof DirectoryObject))
    })

    it("handles empty pattern", async () => {
      const {files, directories} = await testDirObj.glob("")

      assert.ok(Array.isArray(files))
      assert.ok(Array.isArray(directories))
      // Empty pattern should return empty arrays (unlike read which returns immediate children)
      assert.equal(files.length, 0)
      assert.equal(directories.length, 0)
    })

    it("handles pattern with no matches", async () => {
      const {files, directories} = await testDirObj.glob("**/*.xyz")

      assert.equal(files.length, 0)
      assert.equal(directories.length, 0)
    })

    it("finds files at root level only", async () => {
      const {files} = await testDirObj.glob("*.md")

      assert.equal(files.length, 1)
      assert.equal(files[0].name, "README.md")
    })

    it("finds multiple file types with pattern", async () => {
      const {files} = await testDirObj.glob("**/*.{js,json}")

      assert.ok(files.length >= 5) // All .js and .json files
      assert.ok(files.some(f => f.name.endsWith(".js")))
      assert.ok(files.some(f => f.name.endsWith(".json")))
    })

    it("returns both files and directories in single call", async () => {
      const result = await testDirObj.glob("src/**/*")

      assert.ok(result.files)
      assert.ok(result.directories)
      assert.ok(result.files.length > 0)
      assert.ok(result.directories.length > 0)
    })

    it("file paths are correctly resolved", async () => {
      const {files} = await testDirObj.glob("src/lib/*.js")

      assert.equal(files.length, 1)
      assert.ok(files[0].path.includes("src"))
      assert.ok(files[0].path.includes("lib"))
      assert.ok(files[0].path.includes("helper.js"))
    })

    it("handles complex glob patterns", async () => {
      const {files} = await testDirObj.glob("**/test*.js")

      assert.ok(files.length >= 1)
      assert.ok(files.every(f => f.name.startsWith("test")))
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

    it("creates directory if it doesn't exist (assureExists)", async () => {
      assert.equal(await testDirObj.exists, false)

      await testDirObj.assureExists()

      assert.equal(await testDirObj.exists, true)
    })

    it("doesn't throw if directory already exists (assureExists)", async () => {
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

      for(const parent of dir.walkUp)
        parents.push(parent.path)

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

      const paths = [...dir.walkUp]
      const first = paths[0]

      assert.ok(first instanceof DirectoryObject)
      assert.equal(first.path, dir.path)
    })
  })

  describe("delete method", () => {
    let testDir

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("dir-delete-test")
    })

    afterEach(async () => {
      if(testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("deletes empty directory successfully", async () => {
      const emptyDirPath = path.join(testDir, "empty-dir")
      await fs.mkdir(emptyDirPath)
      const dir = new DirectoryObject(emptyDirPath)

      assert.equal(await dir.exists, true)

      await dir.delete()

      assert.equal(await dir.exists, false)
    })

    it("throws error when directory is not empty", async () => {
      const dirPath = path.join(testDir, "not-empty")
      await fs.mkdir(dirPath)
      await fs.writeFile(path.join(dirPath, "file.txt"), "content")
      const dir = new DirectoryObject(dirPath)

      await assert.rejects(
        () => dir.delete(),
        (error) => {
          // Should get an error from fs.rmdir about directory not being empty
          return true
        }
      )

      // Directory should still exist
      assert.equal(await dir.exists, true)
    })

    it("throws Sass error when directory doesn't exist", async () => {
      const nonExistent = new DirectoryObject(path.join(testDir, "missing"))

      await assert.rejects(
        () => nonExistent.delete(),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /No such resource/)
          return true
        }
      )
    })

    it("throws Sass error for invalid path", async () => {
      const dir = new DirectoryObject("/test")
      // Manually break the path
      Object.defineProperty(dir, "path", {get: () => null})

      await assert.rejects(
        () => dir.delete(),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /does not represent a valid resource/)
          return true
        }
      )
    })

    it("does not support recursive deletion", async () => {
      // Create nested structure
      const parentPath = path.join(testDir, "parent")
      const childPath = path.join(parentPath, "child")
      await fs.mkdir(parentPath)
      await fs.mkdir(childPath)

      const parent = new DirectoryObject(parentPath)

      // Should fail because directory is not empty
      await assert.rejects(
        () => parent.delete()
      )

      // Parent should still exist
      assert.equal(await parent.exists, true)
    })

    it("returns Promise that resolves to undefined", async () => {
      const emptyDirPath = path.join(testDir, "returns-undefined")
      await fs.mkdir(emptyDirPath)
      const dir = new DirectoryObject(emptyDirPath)

      const result = await dir.delete()

      assert.equal(result, undefined)
    })

    it("cannot delete directory twice", async () => {
      const dirPath = path.join(testDir, "delete-twice")
      await fs.mkdir(dirPath)
      const dir = new DirectoryObject(dirPath)

      await dir.delete()
      assert.equal(await dir.exists, false)

      await assert.rejects(
        () => dir.delete(),
        Sass
      )
    })

    it("validates existence before attempting deletion", async () => {
      const nonExistent = new DirectoryObject(path.join(testDir, "never-existed"))

      // Should throw before calling fs.rmdir
      await assert.rejects(
        () => nonExistent.delete(),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /No such resource/)
          return true
        }
      )
    })

    it("deletes directory with special characters in name", async () => {
      const specialPath = path.join(testDir, "dir with spaces & symbols!")
      await fs.mkdir(specialPath)
      const specialDir = new DirectoryObject(specialPath)

      assert.equal(await specialDir.exists, true)
      await specialDir.delete()
      assert.equal(await specialDir.exists, false)
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

    it("creates directory if it doesn't exist (enhanced)", async () => {
      const newDirPath = path.join(testDir, "new-directory")
      const dir = new DirectoryObject(newDirPath)

      assert.equal(await dir.exists, false)

      await dir.assureExists()

      assert.equal(await dir.exists, true)
    })

    it("doesn't throw if directory already exists (enhanced)", async () => {
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

  describe("hasFile method", () => {
    let testDir

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("dir-hasfile-test")
    })

    afterEach(async () => {
      if(testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("returns true when file exists in directory", async () => {
      const filePath = path.join(testDir, "test.txt")
      await fs.writeFile(filePath, "test content")

      const dir = new DirectoryObject(testDir)
      const exists = await dir.hasFile("test.txt")

      assert.equal(exists, true)
    })

    it("returns false when file does not exist", async () => {
      const dir = new DirectoryObject(testDir)
      const exists = await dir.hasFile("nonexistent.txt")

      assert.equal(exists, false)
    })

    it("checks for files with complex names", async () => {
      const filename = "file with spaces & symbols!.json"
      const filePath = path.join(testDir, filename)
      await fs.writeFile(filePath, "{}")

      const dir = new DirectoryObject(testDir)
      const exists = await dir.hasFile(filename)

      assert.equal(exists, true)
    })

    it("handles files with multiple extensions", async () => {
      const filename = "archive.tar.gz"
      const filePath = path.join(testDir, filename)
      await fs.writeFile(filePath, "compressed")

      const dir = new DirectoryObject(testDir)
      const exists = await dir.hasFile(filename)

      assert.equal(exists, true)
    })

    it("returns Promise<boolean> (hasFile)", async () => {
      const dir = new DirectoryObject(testDir)
      const result = dir.hasFile("test.txt")

      assert.ok(result instanceof Promise)

      const exists = await result
      assert.equal(typeof exists, "boolean")
    })

    it("handles relative file paths", async () => {
      const filePath = path.join(testDir, "subfile.txt")
      await fs.writeFile(filePath, "content")

      const dir = new DirectoryObject(testDir)
      const exists = await dir.hasFile("./subfile.txt")

      assert.equal(exists, true)
    })
  })

  describe("hasDirectory method", () => {
    let testDir

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("dir-hasdir-test")
    })

    afterEach(async () => {
      if(testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("returns true when subdirectory exists", async () => {
      const subDirPath = path.join(testDir, "subdir")
      await fs.mkdir(subDirPath)

      const dir = new DirectoryObject(testDir)
      const exists = await dir.hasDirectory("subdir")

      assert.equal(exists, true)
    })

    it("returns false when subdirectory does not exist", async () => {
      const dir = new DirectoryObject(testDir)
      const exists = await dir.hasDirectory("nonexistent")

      assert.equal(exists, false)
    })

    it("checks for directories with special characters", async () => {
      const dirname = "dir with spaces & symbols!"
      const dirPath = path.join(testDir, dirname)
      await fs.mkdir(dirPath)

      const dir = new DirectoryObject(testDir)
      const exists = await dir.hasDirectory(dirname)

      assert.equal(exists, true)
    })

    it("handles nested directory paths", async () => {
      const nestedPath = path.join(testDir, "level1", "level2")
      await fs.mkdir(path.join(testDir, "level1"))
      await fs.mkdir(nestedPath)

      const dir = new DirectoryObject(testDir)
      const exists = await dir.hasDirectory("level1/level2")

      assert.equal(exists, true)
    })

    it("returns Promise<boolean> (hasDirectory)", async () => {
      const dir = new DirectoryObject(testDir)
      const result = dir.hasDirectory("test")

      assert.ok(result instanceof Promise)

      const exists = await result
      assert.equal(typeof exists, "boolean")
    })

    it("handles relative directory paths", async () => {
      const subDirPath = path.join(testDir, "relative")
      await fs.mkdir(subDirPath)

      const dir = new DirectoryObject(testDir)
      const exists = await dir.hasDirectory("./relative")

      assert.equal(exists, true)
    })

    it("uses mergeOverlappingPaths for path resolution", async () => {
      const subDirPath = path.join(testDir, "target")
      await fs.mkdir(subDirPath)

      const dir = new DirectoryObject(testDir)
      // This should work with overlapping path segments
      const exists = await dir.hasDirectory(path.join(testDir, "target"))

      assert.equal(exists, true)
    })
  })

  describe("getDirectory() method", () => {
    it("creates DirectoryObject by extending path", () => {
      const dir = new DirectoryObject(baseDir)
      const subDir = dir.getDirectory("src")

      assert.ok(subDir instanceof DirectoryObject)
      assert.equal(subDir.path, path.join(baseDir, "src"))
    })

    it("requires chaining for nested paths", () => {
      const dir = new DirectoryObject(baseDir)

      // Nested paths with separators are rejected
      assert.throws(
        () => dir.getDirectory("src/lib"),
        /out of bounds/
      )

      // Must chain instead
      const subDir = dir.getDirectory("src").getDirectory("lib")
      assert.ok(subDir.path.endsWith("lib"))
    })

    it("returns new DirectoryObject instance", () => {
      const dir = new DirectoryObject("/test")
      const subDir = dir.getDirectory("child")

      assert.notEqual(dir, subDir)
      assert.ok(subDir instanceof DirectoryObject)
    })

    it("validates directory name parameter", () => {
      const dir = new DirectoryObject("/test")

      // Rejects paths with separators
      assert.throws(
        () => dir.getDirectory("../parent"),
        /out of bounds/
      )

      assert.throws(
        () => dir.getDirectory("/absolute"),
        /out of bounds/
      )
    })
  })

  describe("fromCwd() static method", () => {
    it("creates DirectoryObject from current working directory", () => {
      const dir = DirectoryObject.fromCwd()

      assert.ok(dir instanceof DirectoryObject)
      assert.equal(dir.path, process.cwd())
    })

    it("returns absolute path", () => {
      const dir = DirectoryObject.fromCwd()

      assert.ok(path.isAbsolute(dir.path))
    })

    it("creates new instance each time", () => {
      const dir1 = DirectoryObject.fromCwd()
      const dir2 = DirectoryObject.fromCwd()

      assert.ok(dir1 instanceof DirectoryObject)
      assert.ok(dir2 instanceof DirectoryObject)
      assert.notEqual(dir1, dir2)
      assert.equal(dir1.path, dir2.path)
    })
  })

  describe("getFile() method", () => {
    it("creates FileObject by extending path", () => {
      const dir = new DirectoryObject(baseDir)
      const file = dir.getFile("package.json")

      assert.ok(file instanceof FileObject)
      assert.equal(file.constructor.name, "FileObject")
      assert.equal(file.path, path.join(baseDir, "package.json"))
    })

    it("requires chaining for nested file paths", () => {
      const dir = new DirectoryObject(baseDir)

      // Nested paths with separators are rejected
      assert.throws(
        () => dir.getFile("src/index.js"),
        /out of bounds/
      )

      // Must navigate to directory first
      const file = dir.getDirectory("src").getFile("index.js")
      assert.ok(file.path.includes("index.js"))
    })

    it("validates filename parameter", () => {
      const dir = new DirectoryObject("/test")

      // Rejects paths with separators
      assert.throws(
        () => dir.getFile("../parent/file.txt"),
        /out of bounds/
      )

      assert.throws(
        () => dir.getFile("/absolute/file.txt"),
        /out of bounds/
      )
    })

    it("works with files with complex names", () => {
      const dir = new DirectoryObject("/test")
      const file = dir.getFile("file with spaces & symbols!.json")

      assert.ok(file.path.includes("file with spaces & symbols!.json"))
    })
  })
})
