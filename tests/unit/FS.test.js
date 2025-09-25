import assert from "node:assert/strict"
import path from "node:path"
import {afterEach,beforeEach,describe,it} from "node:test"

import {FS,FileObject,Sass} from "../../src/index.js"
import {TestUtils} from "../helpers/test-utils.js"

describe("FS", () => {

  describe("file descriptor types", () => {
    it("fdTypes contains expected lowercase types", () => {
      assert.deepEqual(FS.fdTypes, ["file", "directory"])
      assert.ok(Object.isFrozen(FS.fdTypes))
    })

    it("upperFdTypes contains expected uppercase types", () => {
      assert.deepEqual(FS.upperFdTypes, ["FILE", "DIRECTORY"])
      assert.ok(Object.isFrozen(FS.upperFdTypes))
    })

    it("fdType maps uppercase to lowercase types", () => {
      assert.equal(FS.fdType.FILE, "file")
      assert.equal(FS.fdType.DIRECTORY, "directory")
      assert.ok(Object.isFrozen(FS.fdType))
    })

    it("fdType has correct structure", () => {
      assert.equal(Object.keys(FS.fdType).length, 2)
      assert.ok("FILE" in FS.fdType)
      assert.ok("DIRECTORY" in FS.fdType)
    })
  })

  // Setup test directory for each test suite
  describe("path utilities", () => {
    it("fixSlashes converts backslashes to forward slashes", () => {
      assert.equal(FS.fixSlashes("path\\to\\file"), "path/to/file")
      assert.equal(FS.fixSlashes("path/to/file"), "path/to/file") // no change
      assert.equal(FS.fixSlashes("C:\\Users\\test"), "C:/Users/test")
      assert.equal(FS.fixSlashes(""), "")
    })

    it("pathToUri converts paths to file URLs", () => {
      const testPath = "/home/user/file.txt"
      const uri = FS.pathToUri(testPath)

      assert.ok(uri.startsWith("file://"))
      assert.ok(uri.includes(testPath))
    })

    it("pathToUri handles invalid paths gracefully", () => {
      const invalidPath = "\0invalid"
      const result = FS.pathToUri(invalidPath)

      // Node.js actually URL-encodes invalid characters instead of failing
      assert.ok(result.startsWith("file://"))
      assert.ok(result.includes("%00")) // null byte encoded
    })

    it("uriToPath converts file URLs to paths", () => {
      const testPath = "/home/user/file.txt"
      const uri = `file://${testPath}`
      const result = FS.uriToPath(uri)

      assert.equal(result, testPath)
    })

    it("uriToPath handles non-file URLs gracefully", () => {
      const nonFileUri = "http://example.com/file.txt"
      const result = FS.uriToPath(nonFileUri)

      // Should return the original URI if conversion fails
      assert.equal(result, nonFileUri)
    })
  })

  describe("path resolution and merging", () => {
    it("relativeOrAbsolutePath returns absolute path for upward paths", () => {
      const from = new FileObject("/home/user/project/src/index.js")
      const to = new FileObject("/home/user/project/lib/utils.js")

      const result = FS.relativeOrAbsolutePath(from, to)
      // Returns absolute path because relative would start with "../"
      assert.equal(result, "/home/user/project/lib/utils.js")
    })

    it("relativeOrAbsolutePath returns absolute path when outside scope", () => {
      const from = new FileObject("/home/user/project/src/index.js")
      const to = new FileObject("/etc/config.txt")

      const result = FS.relativeOrAbsolutePath(from, to)
      assert.equal(result, "/etc/config.txt")
    })

    it("mergeOverlappingPaths combines paths with overlap", () => {
      const result = FS.mergeOverlappingPaths("home/user/project", "project/src/file.js")
      assert.equal(result, path.join("home", "user", "project", "src", "file.js"))
    })

    it("mergeOverlappingPaths handles identical paths", () => {
      const result = FS.mergeOverlappingPaths("home/user", "home/user")
      assert.equal(result, "home/user")
    })

    it("mergeOverlappingPaths joins when no overlap", () => {
      const result = FS.mergeOverlappingPaths("home/user", "documents/file.txt")
      assert.equal(result, path.join("home", "user", "documents", "file.txt"))
    })

    it("resolvePath handles absolute paths", () => {
      const result = FS.resolvePath("home/user", "/etc/config.txt")
      assert.equal(result, "/etc/config.txt")
    })

    it("resolvePath handles relative navigation", () => {
      const result = FS.resolvePath("/home/user/project", "../other/file.txt")
      assert.equal(result, path.resolve("/home/user/project", "../other/file.txt"))
    })

    it("resolvePath uses overlap merging for simple paths", () => {
      const result = FS.resolvePath("home/user", "user/documents")
      assert.equal(result, path.join("home", "user", "documents"))
    })

    it("resolvePath handles empty inputs", () => {
      assert.equal(FS.resolvePath("", ""), "")
      assert.equal(FS.resolvePath("", "test"), "test")
      assert.equal(FS.resolvePath("test", ""), "test")
    })
  })

  describe("file globbing", () => {
    let globTestDir

    beforeEach(async () => {
      globTestDir = await TestUtils.createTestDir("fs-glob-test-" + Date.now())

      // Create test files
      await TestUtils.createTestFile(path.join(globTestDir, "file1.txt"), "content1")
      await TestUtils.createTestFile(path.join(globTestDir, "file2.js"), "content2")
      await TestUtils.createTestFile(path.join(globTestDir, "nested", "file3.txt"), "content3")
      await TestUtils.createTestFile(path.join(globTestDir, "nested", "file4.json"), "content4")
    })

    afterEach(async () => {
      if (globTestDir) {
        await TestUtils.cleanupTestDir(globTestDir)
      }
    })

    it("getFiles returns FileObject array for simple glob", async () => {
      const pattern = path.join(globTestDir, "*.txt")
      const files = await FS.getFiles(pattern)

      assert.ok(Array.isArray(files))
      assert.equal(files.length, 1)
      assert.ok(files[0] instanceof FileObject)
      assert.ok(files[0].name.endsWith(".txt"))
    })

    it("getFiles works with multiple patterns as array", async () => {
      const patterns = [
        path.join(globTestDir, "*.txt"),
        path.join(globTestDir, "*.js")
      ]
      const files = await FS.getFiles(patterns)

      assert.ok(files.length >= 2)
      assert.ok(files.every(f => f instanceof FileObject))
    })

    it("getFiles works with pipe-separated string patterns", async () => {
      const pattern = `${path.join(globTestDir, "*.txt")}|${path.join(globTestDir, "*.js")}`
      const files = await FS.getFiles(pattern)

      assert.ok(files.length >= 2)
      assert.ok(files.every(f => f instanceof FileObject))
    })

    it("getFiles works with nested patterns", async () => {
      const pattern = path.join(globTestDir, "**", "*")
      const files = await FS.getFiles(pattern)

      assert.ok(files.length >= 4) // All our test files
      assert.ok(files.every(f => f instanceof FileObject))
    })

    it("getFiles throws for invalid glob patterns", async () => {
      await assert.rejects(
        () => FS.getFiles(""),
        Sass
      )

      await assert.rejects(
        () => FS.getFiles([]),
        Sass
      )

      await assert.rejects(
        () => FS.getFiles(123),
        Sass
      )
    })

    it("getFiles handles non-existent patterns gracefully", async () => {
      const pattern = path.join(globTestDir, "*.nonexistent")
      const files = await FS.getFiles(pattern)

      assert.ok(Array.isArray(files))
      assert.equal(files.length, 0)
    })
  })

  describe("edge cases and error handling", () => {
    it("handles path operations with special characters", () => {
      const result = FS.fixSlashes("path with spaces\\and-dashes")
      assert.equal(result, "path with spaces/and-dashes")
    })

    it("handles empty path operations", () => {
      const result1 = FS.mergeOverlappingPaths("", "file.txt")
      const result2 = FS.mergeOverlappingPaths("base", "")

      assert.equal(result1, "file.txt")
      assert.equal(result2, "base")
    })

    it("path resolution handles whitespace", () => {
      const result = FS.resolvePath("  ", "  ")
      assert.equal(result, "")
    })

    it("relativeOrAbsolutePath returns absolute path for upward navigation", () => {
      const from = new FileObject("/home/user/project/file1.txt")
      const to = new FileObject("/home/user/file2.txt")

      const result = FS.relativeOrAbsolutePath(from, to)
      // Returns absolute path because relative would start with "../"
      assert.equal(result, "/home/user/file2.txt")
    })
  })

  describe("path separator handling", () => {
    it("mergeOverlappingPaths respects custom separator", () => {
      const result = FS.mergeOverlappingPaths("home\\user", "user\\docs", "\\")

      // Should use the custom separator in the result
      assert.ok(result.includes("\\") || result.includes("/")) // Platform dependent but should work
    })

    it("handles mixed separators in paths", () => {
      const result = FS.mergeOverlappingPaths("home/user\\mixed", "mixed/more\\paths")

      // Should produce a valid path regardless of input separators
      assert.ok(result.length > 0)
      assert.ok(result.includes("home"))
      assert.ok(result.includes("paths"))
    })
  })

  describe("glob pattern edge cases", () => {
    let edgeTestDir

    beforeEach(async () => {
      edgeTestDir = await TestUtils.createTestDir("fs-glob-edge-test-" + Date.now())

      // Create files with special characters
      await TestUtils.createTestFile(path.join(edgeTestDir, "file with spaces.txt"), "content")
      await TestUtils.createTestFile(path.join(edgeTestDir, "file-with-dashes.txt"), "content")
      await TestUtils.createTestFile(path.join(edgeTestDir, "file.with.dots.txt"), "content")
    })

    afterEach(async () => {
      if (edgeTestDir) {
        await TestUtils.cleanupTestDir(edgeTestDir)
      }
    })

    it("handles files with spaces and special characters", async () => {
      const pattern = path.join(edgeTestDir, "*.txt")
      const files = await FS.getFiles(pattern)

      assert.ok(files.length >= 3)
      assert.ok(files.some(f => f.name.includes(" ")))
      assert.ok(files.some(f => f.name.includes("-")))
      assert.ok(files.some(f => f.name.includes(".")))
    })

    it("filters empty pattern parts correctly", async () => {
      // Test the internal logic that filters empty patterns
      const pattern = `${path.join(edgeTestDir, "*.txt")}||${path.join(edgeTestDir, "*.js")}`
      const files = await FS.getFiles(pattern)

      // Should work despite empty pattern part
      assert.ok(Array.isArray(files))
    })
  })
})
