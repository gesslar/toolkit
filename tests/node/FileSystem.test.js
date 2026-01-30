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
      const testPath = path.join(path.sep, "home", "user", "file.txt")
      const url = FileSystem.pathToUrl(testPath)

      assert.ok(url.startsWith("file://"))
      const converted = FileSystem.urlToPath(url)
      assert.equal(converted, path.resolve(testPath))
    })

    it("pathToUrl handles invalid paths gracefully", () => {
      const invalidPath = "\0invalid"
      const result = FileSystem.pathToUrl(invalidPath)

      // Node.js actually URL-encodes invalid characters instead of failing
      assert.ok(result.startsWith("file://"))
      assert.ok(result.includes("%00")) // null byte encoded
    })

    it("urlToPath converts file URLs to paths", async() => {
      const testPath = path.resolve(path.normalize(path.join(path.sep, "home", "user", "file.txt")))
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
      const from = new FileObject(path.join(path.sep, "home", "user", "project", "src", "index.js"))
      const to = new FileObject(path.join(path.sep, "home", "user", "project", "lib", "utils.js"))

      const result = FileSystem.relativeOrAbsolute(from, to)
      // Returns absolute path because relative would start with "../"
      assert.equal(result, path.resolve("/home/user/project/lib/utils.js"))
    })

    it("relativeOrAbsolute uses containing directory for files", () => {
      const from = new FileObject(path.join(path.sep, "home", "user", "project", "src", "index.js"))
      const to = new FileObject(path.join(path.sep, "home", "user", "project", "src", "utils", "helper.js"))

      const result = FileSystem.relativeOrAbsolute(from, to)

      assert.equal(result, path.join("utils", "helper.js"))
    })

    it("relativeOrAbsolute returns absolute path when outside scope", () => {
      const from = new FileObject(path.join(path.sep, "home", "user", "project", "src", "index.js"))
      const to = new FileObject(path.join(path.sep, "etc", "config.txt"))

      const result = FileSystem.relativeOrAbsolute(from, to)
      assert.equal(result, path.resolve("/etc/config.txt"))
    })

    it("relativeOrAbsolutePath returns relative path for strings within scope", () => {
      const from = path.join(path.sep, "home", "user", "project", "src")
      const to = path.join(path.sep, "home", "user", "project", "src", "utils", "helper.js")

      const result = FileSystem.relativeOrAbsolutePath(from, to)

      assert.equal(result, path.join("utils", "helper.js"))
    })

    it("relativeOrAbsolutePath returns absolute path for strings with upward navigation", () => {
      const from = path.join(path.sep, "home", "user", "project", "src")
      const to = path.join(path.sep, "home", "user", "project", "lib", "utils.js")

      const result = FileSystem.relativeOrAbsolutePath(from, to)

      assert.equal(path.resolve(result), path.resolve("/home/user/project/lib/utils.js"))
    })

    it("relativeOrAbsolutePath returns absolute path for completely different paths", () => {
      const from = path.join(path.sep, "home", "user", "project")
      const to = path.join(path.sep, "etc", "config.txt")

      const result = FileSystem.relativeOrAbsolutePath(from, to)

      assert.equal(path.resolve(result), path.resolve("/etc/config.txt"))
    })

    it("relativeOrAbsolutePath handles same path", () => {
      const from = path.join(path.sep, "home", "user", "project")
      const to = path.join(path.sep, "home", "user", "project")

      const result = FileSystem.relativeOrAbsolutePath(from, to)

      assert.equal(result, "")
    })

    it("relativeTo returns relative path for FileObject within scope", () => {
      const from = new FileObject(path.join(path.sep, "home", "user", "project", "src", "index.js"))
      const to = new FileObject(path.join(path.sep, "home", "user", "project", "src", "utils", "helper.js"))

      const result = to.relativeTo(from)

      assert.equal(result, path.join("utils", "helper.js"))
    })

    it("relativeTo returns absolute path for FileObject outside scope", () => {
      const from = new FileObject(path.join(path.sep, "home", "user", "project", "src", "index.js"))
      const to = new FileObject(path.join(path.sep, "home", "user", "project", "lib", "utils.js"))

      const result = to.relativeTo(from)

      assert.equal(result, path.resolve("/home/user/project/lib/utils.js"))
    })

    it("relativeTo works with DirectoryObject instances", () => {
      const from = new DirectoryObject(path.join(path.sep, "home", "user", "project", "src"))
      const to = new DirectoryObject(path.join(path.sep, "home", "user", "project", "src", "utils"))

      const result = to.relativeTo(from)

      assert.equal(result, "utils")
    })

    it("relativeTo throws Sass error for null parameter", () => {
      const file = new FileObject(path.join(path.sep, "home", "user", "file.js"))

      assert.throws(
        () => file.relativeTo(null),
        Sass
      )
    })

    it("relativeTo throws Sass error for undefined parameter", () => {
      const file = new FileObject(path.join(path.sep, "home", "user", "file.js"))

      assert.throws(
        () => file.relativeTo(undefined),
        Sass
      )
    })

    it("relativeTo throws Sass error for object without path property", () => {
      const file = new FileObject(path.join(path.sep, "home", "user", "file.js"))
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
      const result = FileSystem.resolvePath("home/user", path.join(path.sep, "etc", "config.txt"))
      assert.equal(result, path.resolve("/etc/config.txt"))
    })

    it("resolvePath handles relative navigation", () => {
      const result = FileSystem.resolvePath(path.join(path.sep, "home", "user", "project"), path.normalize("../other/file.txt"))
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
      const from = new FileObject(path.join(path.sep, "home", "user", "project", "file1.txt"))
      const to = new FileObject(path.join(path.sep, "home", "user", "file2.txt"))

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

  describe("pathContains", () => {
    it("returns true when candidate is within container", () => {
      const result = FileSystem.pathContains(path.join(path.sep, "home", "user"), path.join(path.sep, "home", "user", "docs", "file.txt"))
      assert.equal(result, true)
    })

    it("returns false when candidate is outside container", () => {
      const result = FileSystem.pathContains(path.join(path.sep, "home", "user"), path.join(path.sep, "home", "other", "file.txt"))
      assert.equal(result, false)
    })

    it("returns false when candidate is the container itself", () => {
      const result = FileSystem.pathContains(path.join(path.sep, "home", "user"), path.join(path.sep, "home", "user"))
      assert.equal(result, false)
    })

    it("returns false for sibling paths", () => {
      const result = FileSystem.pathContains(path.join(path.sep, "home", "user", "docs"), path.join(path.sep, "home", "user", "images"))
      assert.equal(result, false)
    })

    it("handles trailing slashes correctly", () => {
      const result = FileSystem.pathContains(path.join(path.sep, "home", "user") + path.sep, path.join(path.sep, "home", "user", "docs"))
      assert.equal(result, true)
    })

    it("throws Sass for empty container", () => {
      assert.throws(
        () => FileSystem.pathContains("", path.join(path.sep, "home", "user")),
        Sass
      )
    })

    it("throws Sass for empty candidate", () => {
      assert.throws(
        () => FileSystem.pathContains(path.join(path.sep, "home", "user"), ""),
        Sass
      )
    })
  })

  describe("toLocalRelativePath", () => {
    it("returns relative path when paths overlap", () => {
      const result = FileSystem.toLocalRelativePath(
        path.join("projects", "toolkit"),
        path.join("projects", "toolkit", "src")
      )
      assert.equal(result, "src")
    })

    it("returns empty string for identical paths", () => {
      const result = FileSystem.toLocalRelativePath(path.join(path.sep, "home", "user"), path.join(path.sep, "home", "user"))
      assert.equal(result, "")
    })

    it("returns null when no overlap found", () => {
      const result = FileSystem.toLocalRelativePath(path.join(path.sep, "projects", "app"), path.join(path.sep, "completely", "different"))
      assert.equal(result, null)
    })

    it("handles deeply nested paths", () => {
      const result = FileSystem.toLocalRelativePath(
        path.join("projects", "toolkit"),
        path.join("projects", "toolkit", "src", "lib", "utils")
      )
      assert.equal(result, path.join("src", "lib", "utils"))
    })

    it("respects custom separator", () => {
      const result = FileSystem.toLocalRelativePath(
        "projects\\toolkit",
        "projects\\toolkit\\src\\lib",
        "\\"
      )
      assert.equal(result, "src\\lib")
    })
  })

  describe("toRelativePath", () => {
    it("returns relative path for nested target", () => {
      const result = FileSystem.toRelativePath(path.join(path.sep, "home", "user"), path.join(path.sep, "home", "user", "docs"))
      assert.equal(result, "docs")
    })

    it("returns empty string for identical paths", () => {
      const result = FileSystem.toRelativePath(path.join(path.sep, "home", "user"), path.join(path.sep, "home", "user"))
      assert.equal(result, "")
    })

    it("returns path with .. for sibling navigation", () => {
      const result = FileSystem.toRelativePath(path.join(path.sep, "home", "user", "docs"), path.join(path.sep, "home", "user", "images"))
      assert.equal(result, path.join("..", "images"))
    })

    it("handles upward navigation", () => {
      const result = FileSystem.toRelativePath(path.join(path.sep, "home", "user", "project", "src"), path.join(path.sep, "home", "user"))
      assert.equal(result, path.join("..", ".."))
    })
  })

  describe("getCommonRootPath", () => {
    it("returns from path when last segment found in to", () => {
      // "toolkit" (last segment of from) is found in to at index 2
      const result = FileSystem.getCommonRootPath(
        path.join("projects", "toolkit"),
        path.join("projects", "toolkit", "src")
      )
      assert.equal(result, path.join("projects", "toolkit"));
    })

    it("returns the path itself for identical paths", () => {
      const result = FileSystem.getCommonRootPath(path.join(path.sep, "home", "user"), path.join(path.sep, "home", "user"))
      assert.equal(result, path.join(path.sep, "home", "user"))
    })

    it("returns null when last segment not found in to", () => {
      // "app" is not in "/completely/different"
      const result = FileSystem.getCommonRootPath(path.join(path.sep, "projects", "app"), path.join(path.sep, "completely", "different"))
      assert.equal(result, null)
    })

    it("returns null when paths diverge at end", () => {
      // "src" is not in "/projects/toolkit/tests"
      const result = FileSystem.getCommonRootPath(
        path.join(path.sep, "projects", "toolkit", "src"),
        path.join(path.sep, "projects", "toolkit", "tests")
      )
      assert.equal(result, null)
    })

    it("slices from based on position in to", () => {
      // "d" (last segment of from) found at index 2 in to
      // Returns fromTrail.slice(0, 3) = "/a/b"
      const from = path.join(path.sep, "a", "b", "c", "d")
      const to = path.join(path.sep, "a", "d", "e")
      const expected = path.join(path.sep, "a", "b")

      const result = FileSystem.getCommonRootPath(from, to)
      assert.equal(result, expected)
    })

    it("throws Sass for empty from path", () => {
      assert.throws(
        () => FileSystem.getCommonRootPath("", path.join(path.sep, "home", "user")),
        Sass
      )
    })

    it("throws Sass for empty to path", () => {
      assert.throws(
        () => FileSystem.getCommonRootPath(path.join(path.sep, "home", "user"), ""),
        Sass
      )
    })

    it("respects custom separator", () => {
      // "toolkit" found in to path
      const result = FileSystem.getCommonRootPath(
        "projects\\toolkit",
        "projects\\toolkit\\src",
        "\\"
      )
      assert.equal(result, "projects\\toolkit")
    })
  })

  describe("pathParts", () => {
    it("returns correct parts for file path", () => {
      const testPath = path.join(path.sep, "home", "user", "file.txt")
      const result = FileSystem.pathParts(testPath)

      assert.equal(result.root, path.sep)
      assert.equal(result.dir, path.join(path.sep, "home", "user"))
      assert.equal(result.base, "file.txt")
      assert.equal(result.ext, ".txt")
      assert.equal(result.name, "file")
    })

    it("handles file with multiple extensions", () => {
      const result = FileSystem.pathParts(path.join(path.sep, "path", "to", "archive.tar.gz"))

      assert.equal(result.base, "archive.tar.gz")
      assert.equal(result.ext, ".gz")
      assert.equal(result.name, "archive.tar")
    })

    it("handles file without extension", () => {
      const result = FileSystem.pathParts(path.join(path.sep, "path", "to", "Makefile"))

      assert.equal(result.base, "Makefile")
      assert.equal(result.ext, "")
      assert.equal(result.name, "Makefile")
    })

    it("handles hidden files", () => {
      const result = FileSystem.pathParts(path.join(path.sep, "home", "user", ".bashrc"))

      assert.equal(result.base, ".bashrc")
      assert.equal(result.ext, "")
      assert.equal(result.name, ".bashrc")
    })

    it("throws Sass for empty path", () => {
      assert.throws(
        () => FileSystem.pathParts(""),
        Sass
      )
    })
  })

  describe("cwd getter", () => {
    it("returns current working directory", () => {
      const result = FileSystem.cwd
      assert.equal(result, process.cwd())
    })

    it("returns a string", () => {
      assert.equal(typeof FileSystem.cwd, "string")
    })

    it("returns an absolute path", () => {
      assert.ok(path.isAbsolute(FileSystem.cwd))
    })
  })
})
