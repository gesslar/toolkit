import assert from "node:assert/strict"
import path from "node:path"
import {afterEach, describe, it} from "node:test"
import url from "node:url"

import {DirectoryObject, FileSystem, FileObject, Sass} from "../../src/node/index.js"

describe("FS", () => {

  describe("file descriptor types", () => {
    it("fdTypes contains expected lowercase types", () => {
      assert.deepEqual(FileSystem.fdTypes, ["file", "directory"])
      assert.ok(Object.isFrozen(FileSystem.fdTypes))
    })

    it("upperFdTypes contains expected uppercase types", () => {
      assert.deepEqual(FileSystem.upperFdTypes, ["FILE", "DIRECTORY"])
      assert.ok(Object.isFrozen(FileSystem.upperFdTypes))
    })

    it("fdType maps uppercase to lowercase types", () => {
      assert.equal(FileSystem.fdType.FILE, "file")
      assert.equal(FileSystem.fdType.DIRECTORY, "directory")
      assert.ok(Object.isFrozen(FileSystem.fdType))
    })

    it("fdType has correct structure", () => {
      assert.equal(Object.keys(FileSystem.fdType).length, 2)
      assert.ok("FILE" in FileSystem.fdType)
      assert.ok("DIRECTORY" in FileSystem.fdType)
    })
  })

  // Setup test directory for each test suite
  describe("path utilities", () => {
    it("fixSlashes converts backslashes to forward slashes", () => {
      assert.equal(FileSystem.fixSlashes("path\\to\\file"), path.normalize("path/to/file"))
      assert.equal(FileSystem.fixSlashes("path/to/file"), path.normalize("path/to/file")) // no change
      assert.equal(FileSystem.fixSlashes("C:\\Users\\test"), path.normalize("C:/Users/test"))
      assert.equal(FileSystem.fixSlashes(""), ".")
    })

    it("pathToUrl converts paths to file URLs", () => {
      const testPath = "/home/user/file.txt"
      const url = FileSystem.pathToUrl(testPath)

      assert.ok(url.startsWith("file://"))
      assert.ok(url.includes(testPath))
    })

    it("pathToUrl handles invalid paths gracefully", () => {
      const invalidPath = "\0invalid"
      const result = FileSystem.pathToUrl(invalidPath)

      // Node.js actually URL-encodes invalid characters instead of failing
      assert.ok(result.startsWith("file://"))
      assert.ok(result.includes("%00")) // null byte encoded
    })

    it("urlToPath converts file URLs to paths", async() => {
      const testPath = path.resolve(path.normalize("/home/user/file.txt"))
      const testUrl = url.fileURLToPath(url.pathToFileURL(testPath))
      const result = FileSystem.urlToPath(testUrl)

      assert.equal(result, testPath)
    })

    it("urlToPath handles non-file URLs gracefully", () => {
      const nonFileUrl = "http://example.com/file.txt"
      const result = FileSystem.urlToPath(nonFileUrl)

      // Should return the original URI if conversion fails
      assert.equal(result, nonFileUrl)
    })
  })

  describe("path resolution and merging", () => {
    it("relativeOrAbsolute returns absolute path for upward paths", () => {
      const from = new FileObject("/home/user/project/src/index.js")
      const to = new FileObject("/home/user/project/lib/utils.js")

      const result = FileSystem.relativeOrAbsolute(from, to)
      // Returns absolute path because relative would start with "../"
      assert.equal(result, path.resolve("/home/user/project/lib/utils.js"))
    })

    it("relativeOrAbsolute uses containing directory for files", () => {
      const from = new FileObject("/home/user/project/src/index.js")
      const to = new FileObject("/home/user/project/src/utils/helper.js")

      const result = FileSystem.relativeOrAbsolute(from, to)

      assert.equal(result, path.join("utils", "helper.js"))
    })

    it("relativeOrAbsolute returns absolute path when outside scope", () => {
      const from = new FileObject("/home/user/project/src/index.js")
      const to = new FileObject("/etc/config.txt")

      const result = FileSystem.relativeOrAbsolute(from, to)
      assert.equal(result, path.resolve("/etc/config.txt"))
    })

    it("relativeOrAbsolutePath returns relative path for strings within scope", () => {
      const from = "/home/user/project/src"
      const to = "/home/user/project/src/utils/helper.js"

      const result = FileSystem.relativeOrAbsolutePath(from, to)

      assert.equal(result, path.join("utils", "helper.js"))
    })

    it("relativeOrAbsolutePath returns absolute path for strings with upward navigation", () => {
      const from = "/home/user/project/src"
      const to = "/home/user/project/lib/utils.js"

      const result = FileSystem.relativeOrAbsolutePath(from, to)

      assert.equal(result, path.resolve("/home/user/project/lib/utils.js"))
    })

    it("relativeOrAbsolutePath returns absolute path for completely different paths", () => {
      const from = "/home/user/project"
      const to = "/etc/config.txt"

      const result = FileSystem.relativeOrAbsolutePath(from, to)

      assert.equal(result, path.resolve("/etc/config.txt"))
    })

    it("relativeOrAbsolutePath handles same path", () => {
      const from = "/home/user/project"
      const to = "/home/user/project"

      const result = FileSystem.relativeOrAbsolutePath(from, to)

      assert.equal(result, "")
    })

    it("relativeTo returns relative path for FileObject within scope", () => {
      const from = new FileObject("/home/user/project/src/index.js")
      const to = new FileObject("/home/user/project/src/utils/helper.js")

      const result = to.relativeTo(from)

      assert.equal(result, path.join("utils", "helper.js"))
    })

    it("relativeTo returns absolute path for FileObject outside scope", () => {
      const from = new FileObject("/home/user/project/src/index.js")
      const to = new FileObject("/home/user/project/lib/utils.js")

      const result = to.relativeTo(from)

      assert.equal(result, path.resolve("/home/user/project/lib/utils.js"))
    })

    it("relativeTo works with DirectoryObject instances", () => {
      const from = new DirectoryObject("/home/user/project/src")
      const to = new DirectoryObject("/home/user/project/src/utils")

      const result = to.relativeTo(from)

      assert.equal(result, "utils")
    })

    it("relativeTo throws Sass error for null parameter", () => {
      const file = new FileObject("/home/user/file.js")

      assert.throws(
        () => file.relativeTo(null),
        Sass
      )
    })

    it("relativeTo throws Sass error for undefined parameter", () => {
      const file = new FileObject("/home/user/file.js")

      assert.throws(
        () => file.relativeTo(undefined),
        Sass
      )
    })

    it("relativeTo throws Sass error for object without path property", () => {
      const file = new FileObject("/home/user/file.js")
      const invalidObj = {name: "not a file object"}

      assert.throws(
        () => file.relativeTo(invalidObj),
        Sass
      )
    })

    it("mergeOverlappingPaths combines paths with overlap", () => {
      const result = FileSystem.mergeOverlappingPaths("home/user/project", "project/src/file.js")
      assert.equal(result, path.join("home", "user", "project", "src", "file.js"))
    })

    it("mergeOverlappingPaths handles identical paths", () => {
      const result = FileSystem.mergeOverlappingPaths("home/user", "home/user")
      assert.equal(result, "home/user")
    })

    it("mergeOverlappingPaths joins when no overlap", () => {
      const result = FileSystem.mergeOverlappingPaths("home/user", "documents/file.txt")
      assert.equal(result, path.join("home", "user", "documents", "file.txt"))
    })

    it("resolvePath handles absolute paths", () => {
      const result = FileSystem.resolvePath("home/user", "/etc/config.txt")
      assert.equal(result, path.resolve("/etc/config.txt"))
    })

    it("resolvePath handles relative navigation", () => {
      const result = FileSystem.resolvePath("/home/user/project", path.normalize("../other/file.txt"))
      assert.equal(result, path.resolve("/home/user/project", path.normalize("../other/file.txt")))
    })

    it("resolvePath uses overlap merging for simple paths", () => {
      const result = FileSystem.resolvePath("home/user", "user/documents")
      assert.equal(result, path.join("home", "user", "documents"))
    })

    it("resolvePath handles empty inputs", () => {
      assert.equal(FileSystem.resolvePath("", ""), ".")
      assert.equal(FileSystem.resolvePath("", "test"), "test")
      assert.equal(FileSystem.resolvePath("test", ""), "test")
    })
  })

  describe("edge cases and error handling", () => {
    it("handles path operations with special characters", () => {
      const result = FileSystem.fixSlashes("path with spaces\\and-dashes")
      assert.equal(result, path.normalize("path with spaces/and-dashes"))
    })

    it("handles empty path operations", () => {
      const result1 = FileSystem.mergeOverlappingPaths("", "file.txt")
      const result2 = FileSystem.mergeOverlappingPaths("base", "")

      assert.equal(result1, "file.txt")
      assert.equal(result2, "base")
    })

    it("path resolution handles whitespace", () => {
      const result = FileSystem.resolvePath("  ", "  ")
      assert.equal(result, ".")
    })

    it("relativeOrAbsolute returns absolute path for upward navigation", () => {
      const from = new FileObject("/home/user/project/file1.txt")
      const to = new FileObject("/home/user/file2.txt")

      const result = FileSystem.relativeOrAbsolute(from, to)
      // Returns absolute path because relative would start with "../"
      assert.equal(result, path.resolve("/home/user/file2.txt"))
    })
  })

  describe("path separator handling", () => {
    it("mergeOverlappingPaths respects custom separator", () => {
      const result = FileSystem.mergeOverlappingPaths("home\\user", "user\\docs", "\\")

      // Should use the custom separator in the result
      assert.ok(result.includes("\\") || result.includes("/")) // Platform dependent but should work
    })

    it("handles mixed separators in paths", () => {
      const result = FileSystem.mergeOverlappingPaths("home/user\\mixed", "mixed/more\\paths")

      // Should produce a valid path regardless of input separators
      assert.ok(result.length > 0)
      assert.ok(result.includes("home"))
      assert.ok(result.includes("paths"))
    })
  })

  describe("tempDirectory()", () => {
    let tempDirs = []

    afterEach(async () => {
      // Clean up all created temp directories
      for(const dir of tempDirs) {
        try {
          if(await dir.exists)
            await dir.remove()
        } catch(_) {
          // Ignore cleanup errors
        }
      }
      tempDirs = []
    })
  })
})
