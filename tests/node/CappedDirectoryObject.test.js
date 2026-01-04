import assert from "node:assert/strict"
import path from "node:path"
import {afterEach,beforeEach,describe,it} from "node:test"
import fs from "node:fs/promises"

import {CappedDirectoryObject,DirectoryObject,FileObject,Sass,TempDirectoryObject} from "../../src/index.js"
import {TestUtils} from "../helpers/test-utils.js"

describe("CappedDirectoryObject", () => {
  const cappedDirs = []

  afterEach(async () => {
    for(const dir of cappedDirs) {
      if(await dir.exists) {
        // Use remove() for TempDirectoryObject which recursively deletes
        if(typeof dir.remove === "function")
          await dir.remove()
        else
          await dir.delete()

      }

    }

    cappedDirs.length = 0
  })

  describe("constructor and basic properties", () => {
    it("creates CappedDirectoryObject with no arguments", () => {
      const capped = new CappedDirectoryObject()

      // Don't add to cleanup - defaults to process.cwd()

      assert.ok(capped instanceof CappedDirectoryObject)
      // Virtual path is root at cap root
      assert.equal(capped.path, path.parse(path.resolve("")).root)
      // Real path is process.cwd()
      assert.equal(capped.real.path, process.cwd())
      assert.strictEqual(capped.cap, capped)
      assert.equal(capped.isCapped, true)
    })

    it("creates CappedDirectoryObject with absolute path", () => {
      const temp = new TempDirectoryObject("test-capped-abs")

      cappedDirs.push(temp)

      assert.ok(temp instanceof CappedDirectoryObject)
      assert.ok(path.isAbsolute(temp.path))
      assert.strictEqual(temp.cap, temp)
    })

    it("creates child with relative path and parent", () => {
      const parent = new TempDirectoryObject("test-capped-parent")

      cappedDirs.push(parent)

      const child = parent.getDirectory("data")

      assert.ok(child instanceof CappedDirectoryObject)
      assert.ok(child.path.includes("data"))
      assert.strictEqual(child.cap, parent)
      assert.strictEqual(child.parent, parent)
    })

    it("strips leading slash from absolute path when parent provided", () => {
      const parent = new TempDirectoryObject("test-parent-abs")

      cappedDirs.push(parent)

      // Absolute paths with parent get leading "/" stripped and treated as cap-relative
      // "/config" becomes "config" which is valid relative to parent
      const child = parent.getDirectory("/config")

      assert.ok(child instanceof TempDirectoryObject)
      assert.ok(child.path.includes("config"))
      assert.strictEqual(child.cap, parent)
    })

    it("defaults directory parameter to current directory", () => {
      const capped = new CappedDirectoryObject()

      // Don't add to cleanup - defaults to process.cwd()

      // Virtual path is root at cap root, real path is process.cwd()
      assert.equal(capped.path, path.parse(path.resolve("")).root)
      assert.equal(capped.real.path, process.cwd())
    })

    it("resolves virtual and real paths correctly", () => {
      const temp = new TempDirectoryObject("test-paths")

      cappedDirs.push(temp)

      const child = temp.getDirectory("subdir")

      assert.ok(child.path !== child.real.path)
      assert.ok(child.real.path.includes(temp.real.path))
    })

    it("assigns cap correctly for root", () => {
      const temp = new TempDirectoryObject("test-cap-root")

      cappedDirs.push(temp)

      assert.strictEqual(temp.cap, temp)
    })

    it("inherits cap from parent", () => {
      const parent = new TempDirectoryObject("test-cap-inherit")

      cappedDirs.push(parent)

      const child1 = parent.getDirectory("level1")
      const child2 = child1.getDirectory("level2")

      assert.strictEqual(child1.cap, parent)
      assert.strictEqual(child2.cap, parent)
    })
  })

  describe("parent validation", () => {
    it("accepts null parent", () => {
      const capped = new CappedDirectoryObject(".", null)

      // Don't add to cleanup - uses current directory

      assert.ok(capped instanceof CappedDirectoryObject)
      assert.equal(capped.parent, null)
    })

    it("accepts CappedDirectoryObject parent", () => {
      const parent = new TempDirectoryObject("test-valid-parent")

      cappedDirs.push(parent)

      const child = new CappedDirectoryObject("child", parent)

      assert.ok(child instanceof CappedDirectoryObject)
      assert.strictEqual(child.parent, parent)
    })

    it("rejects DirectoryObject parent (not capped)", () => {
      const notCapped = new DirectoryObject("/tmp/not-capped")

      assert.throws(
        () => new CappedDirectoryObject("child", notCapped),
        error => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Invalid type/)
          return true
        }
      )
    })

    it("rejects invalid parent types", () => {
      assert.throws(
        () => new CappedDirectoryObject(".", "invalid"),
        Sass
      )

      assert.throws(
        () => new CappedDirectoryObject(".", 123),
        Sass
      )

      assert.throws(
        () => new CappedDirectoryObject(".", {}),
        Sass
      )
    })
  })

  describe("static method - fromCwd()", () => {
    it("creates new instance at process.cwd()", () => {
      const capped = CappedDirectoryObject.fromCwd()

      // Don't add to cleanup - we don't want to delete the project root!

      assert.ok(capped instanceof CappedDirectoryObject)
      // Virtual path is root at cap root
      assert.equal(capped.path, path.parse(path.resolve("")).root)
      // Real path is process.cwd()
      assert.equal(capped.real.path, process.cwd())
    })

    it("cap is set to itself", () => {
      const capped = CappedDirectoryObject.fromCwd()

      // Don't add to cleanup - we don't want to delete the project root!

      assert.strictEqual(capped.cap, capped)
    })

    it("works with subclasses (TempDirectoryObject overrides it)", () => {
      // TempDirectoryObject intentionally throws for fromCwd()
      assert.throws(
        () => TempDirectoryObject.fromCwd(),
        /TempDirectoryObject.fromCwd\(\) is not supported/
      )

      // But CappedDirectoryObject.fromCwd() works
      const capped = CappedDirectoryObject.fromCwd()

      // Don't add to cleanup - uses process.cwd()

      assert.ok(capped instanceof CappedDirectoryObject)
    })
  })

  describe("getter - isCapped", () => {
    it("always returns true", () => {
      const capped = new TempDirectoryObject("test-is-capped")

      cappedDirs.push(capped)

      assert.equal(capped.isCapped, true)

      const child = capped.getDirectory("subdir")

      assert.equal(child.isCapped, true)
    })

    it("distinguishes from regular DirectoryObject", () => {
      const regular = new DirectoryObject("/tmp")
      const capped = new TempDirectoryObject("test-distinguish")

      cappedDirs.push(capped)

      // Regular DirectoryObject doesn't have isCapped property (undefined)
      assert.equal(regular.isCapped, undefined)
      assert.equal(capped.isCapped, true)
    })
  })

  describe("getter - cap", () => {
    it("returns itself for root instances", () => {
      const temp = new TempDirectoryObject("test-cap-root")

      cappedDirs.push(temp)

      assert.strictEqual(temp.cap, temp)
    })

    it("returns inherited cap for children", () => {
      const parent = new TempDirectoryObject("test-cap-child")

      cappedDirs.push(parent)

      const child = parent.getDirectory("data")

      assert.strictEqual(child.cap, parent)
      assert.notStrictEqual(child.cap, child)
    })

    it("cap is shared across all children in tree", () => {
      const root = new TempDirectoryObject("test-cap-tree")

      cappedDirs.push(root)

      const level1 = root.getDirectory("level1")
      const level2 = level1.getDirectory("level2")
      const level3 = level2.getDirectory("level3")

      assert.strictEqual(level1.cap, root)
      assert.strictEqual(level2.cap, root)
      assert.strictEqual(level3.cap, root)
    })
  })

  describe("getter - real", () => {
    it("returns DirectoryObject (not CappedDirectoryObject)", () => {
      const temp = new TempDirectoryObject("test-real-type")

      cappedDirs.push(temp)

      assert.ok(temp.real instanceof DirectoryObject)
      assert.ok(!(temp.real instanceof CappedDirectoryObject))
    })

    it("real.path shows actual filesystem path", () => {
      const temp = new TempDirectoryObject("test-real-path")

      cappedDirs.push(temp)

      assert.ok(path.isAbsolute(temp.real.path))
      assert.ok(temp.real.path.includes("test-real-path"))
    })

    it("real is different object from this", () => {
      const temp = new TempDirectoryObject("test-real-diff")

      cappedDirs.push(temp)

      assert.notStrictEqual(temp.real, temp)
    })

    it("real maintains proper path structure", () => {
      const temp = new TempDirectoryObject("test-real-struct")

      cappedDirs.push(temp)

      const child = temp.getDirectory("data")

      assert.ok(child.real.path.startsWith(temp.real.path))
      assert.ok(child.real.path.includes("data"))
    })
  })

  describe("getter - parent and parentPath", () => {
    it("root instance has null parent", () => {
      const temp = new TempDirectoryObject("test-parent-null")

      cappedDirs.push(temp)

      assert.equal(temp.parent, null)
      assert.equal(temp.parentPath, null)
    })

    it("child instance has CappedDirectoryObject parent", () => {
      const parent = new TempDirectoryObject("test-parent-obj")

      cappedDirs.push(parent)

      const child = parent.getDirectory("data")

      assert.ok(child.parent instanceof CappedDirectoryObject)
      assert.strictEqual(child.parent, parent)
    })

    it("parent shares same cap as child", () => {
      const root = new TempDirectoryObject("test-parent-cap")

      cappedDirs.push(root)

      const child = root.getDirectory("data")

      assert.strictEqual(child.cap, child.parent.cap)
    })

    it("parentPath returns string for children", () => {
      const root = new TempDirectoryObject("test-parent-path")

      cappedDirs.push(root)

      const child = root.getDirectory("data")

      assert.equal(typeof child.parentPath, "string")
      assert.ok(child.parentPath !== null)
    })

    it("parent chain stops at cap root", () => {
      const root = new TempDirectoryObject("test-parent-chain")

      cappedDirs.push(root)

      const level1 = root.getDirectory("l1")
      const level2 = level1.getDirectory("l2")

      assert.strictEqual(level2.parent, level1)
      assert.strictEqual(level1.parent, root)
      assert.equal(root.parent, null)
    })

    it("deep nesting maintains cap", () => {
      const root = new TempDirectoryObject("test-deep")

      cappedDirs.push(root)

      let current = root

      for(let i = 0; i < 5; i++) {
        current = current.getDirectory(`level${i}`)
        assert.strictEqual(current.cap, root)
      }

    })
  })

  describe("virtual path system", () => {
    it("virtual paths are cap-relative", () => {
      const temp = new TempDirectoryObject("test-virtual")

      cappedDirs.push(temp)

      const child = temp.getDirectory("config")

      assert.ok(child.path.includes("config"))
      assert.notEqual(child.path, child.real.path)
    })

    it("real paths show actual filesystem location", () => {
      const temp = new TempDirectoryObject("test-real-loc")

      cappedDirs.push(temp)

      const child = temp.getDirectory("data")

      assert.ok(child.real.path.includes("test-real-loc"))
      assert.ok(path.isAbsolute(child.real.path))
    })

    it("resolves paths correctly with parent", () => {
      const parent = new TempDirectoryObject("test-resolve")

      cappedDirs.push(parent)

      const child = parent.getDirectory("subdir")

      assert.ok(child.path !== parent.path)
      assert.ok(child.real.path.startsWith(parent.real.path))
    })

    it("treats absolute path as cap-relative with parent", () => {
      const parent = new TempDirectoryObject("test-abs-parent")

      cappedDirs.push(parent)

      // Absolute paths with parent: leading "/" is stripped, becomes cap-relative
      // "/etc/config" becomes "etc/config" - but this has separator so should fail
      assert.throws(
        () => parent.getDirectory("/etc/config"),
        /out of bounds/
      )

      // But single-segment absolute paths work
      const child = parent.getDirectory("/etc")

      assert.ok(child instanceof TempDirectoryObject)
      assert.ok(child.path.includes("etc"))
    })

    it("rejects paths with separators (must chain)", () => {
      const parent = new TempDirectoryObject("test-rel-parent")

      cappedDirs.push(parent)

      // Paths with separators are rejected - must chain instead
      assert.throws(
        () => parent.getDirectory("data/cache"),
        /out of bounds/
      )

      // Must chain: parent -> data -> cache
      const data = parent.getDirectory("data")
      const cache = data.getDirectory("cache")

      assert.ok(cache.path.includes("data"))
      assert.ok(cache.path.includes("cache"))
    })
  })

  describe("async method - read()", () => {
    let testDir

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("capped-read-test")
    })

    afterEach(async () => {
      if(testDir)
        await TestUtils.cleanupTestDir(testDir)

    })

    it("returns files and directories", async () => {
      const temp = new TempDirectoryObject("test-read")

      cappedDirs.push(temp)
      await temp.assureExists()

      const subdir = temp.getDirectory("subdir")

      await subdir.assureExists()

      const file = temp.getFile("test.txt")

      await file.write("test content")

      const {files, directories} = await temp.read()

      assert.equal(directories.length, 1)
      assert.equal(files.length, 1)
    })

    it("returns CappedDirectoryObject instances for directories", async () => {
      const temp = new TempDirectoryObject("test-read-dirs")

      cappedDirs.push(temp)

      const subdir = temp.getDirectory("subdir")

      const {directories} = await temp.read()

      assert.ok(directories[0] instanceof CappedDirectoryObject)
      assert.ok(directories[0] instanceof TempDirectoryObject)
      assert.strictEqual(directories[0].cap, temp)
    })

    it("files have correct parent set", async () => {
      const temp = new TempDirectoryObject("test-read-files")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("content")

      const {files} = await temp.read()

      assert.ok(files[0] instanceof FileObject)
      // Parent path should match temp's path
      assert.equal(files[0].parent.path, temp.path)
    })

    it("returns empty arrays for empty directory", async () => {
      const temp = new TempDirectoryObject("test-read-empty")

      cappedDirs.push(temp)
      await temp.assureExists()

      const {files, directories} = await temp.read()

      assert.equal(files.length, 0)
      assert.equal(directories.length, 0)
    })

    it("pattern filtering works", async () => {
      const temp = new TempDirectoryObject("test-read-pattern")

      cappedDirs.push(temp)

      await temp.getFile("test.txt").write("txt")
      await temp.getFile("test.js").write("js")

      const {files} = await temp.read("*.txt")

      assert.equal(files.length, 1)
      assert.equal(files[0].name, "test.txt")
    })
  })

  describe("async method - hasDirectory()", () => {
    it("returns true for existing subdirectory", async () => {
      const temp = new TempDirectoryObject("test-has-dir")

      cappedDirs.push(temp)
      await temp.assureExists()

      const subdir = temp.getDirectory("subdir")

      await subdir.assureExists()

      const exists = await temp.hasDirectory("subdir")

      assert.equal(exists, true)
    })

    it("returns false for non-existent subdirectory", async () => {
      const temp = new TempDirectoryObject("test-no-dir")

      cappedDirs.push(temp)
      await temp.assureExists()

      const exists = await temp.hasDirectory("nonexistent")

      assert.equal(exists, false)
    })
  })

  describe("async method - assureExists()", () => {
    it("creates directory if it doesn't exist", async () => {
      const temp = new TempDirectoryObject("test-assure")

      cappedDirs.push(temp)

      // TempDirectoryObject creates itself immediately, so it exists
      assert.equal(await temp.exists, true)

      await temp.assureExists()

      assert.equal(await temp.exists, true)
    })

    it("doesn't throw if directory already exists", async () => {
      const temp = new TempDirectoryObject("test-assure-exists")

      cappedDirs.push(temp)
      await temp.assureExists()

      await temp.assureExists()

      assert.equal(await temp.exists, true)
    })

    it("supports recursive option", async () => {
      const temp = new TempDirectoryObject("test-assure-rec")

      cappedDirs.push(temp)

      // Must chain - paths with separators are rejected
      const deep = temp.getDirectory("a").getDirectory("b").getDirectory("c").getDirectory("d")

      await deep.assureExists({recursive: true})

      assert.equal(await deep.exists, true)
    })
  })

  describe("async method - delete()", () => {
    it("deletes empty directory successfully", async () => {
      const temp = new TempDirectoryObject("test-delete")

      cappedDirs.push(temp)
      await temp.assureExists()

      assert.equal(await temp.exists, true)

      await temp.delete()

      assert.equal(await temp.exists, false)
    })

    it("throws error if directory not empty", async () => {
      const temp = new TempDirectoryObject("test-delete-nonempty")

      cappedDirs.push(temp)
      await temp.assureExists()

      const file = temp.getFile("test.txt")

      await file.write("content")

      await assert.rejects(
        () => temp.delete(),
        error => {
          assert.ok(error instanceof Error)
          return true
        }
      )
    })
  })

  describe("async getter - exists", () => {
    it("returns promise with boolean", async () => {
      const temp = new TempDirectoryObject("test-exists")

      cappedDirs.push(temp)

      const existsPromise = temp.exists

      assert.ok(existsPromise instanceof Promise)

      const exists = await existsPromise

      assert.equal(typeof exists, "boolean")
    })

    it("returns true for existing directory", async () => {
      const temp = new TempDirectoryObject("test-exists-true")

      cappedDirs.push(temp)
      await temp.assureExists()

      assert.equal(await temp.exists, true)
    })

    it("TempDirectoryObject child exists immediately after getDirectory()", async () => {
      const temp = new TempDirectoryObject("test-exists-child")

      cappedDirs.push(temp)

      // TempDirectoryObject creates children immediately
      const child = temp.getDirectory("subdir")

      assert.equal(await child.exists, true)
    })
  })

  describe("inherited method - getDirectory()", () => {
    it("creates child CappedDirectoryObject", () => {
      const temp = new TempDirectoryObject("test-get-dir")

      cappedDirs.push(temp)

      const child = temp.getDirectory("subdir")

      assert.ok(child instanceof CappedDirectoryObject)
      assert.ok(child instanceof TempDirectoryObject)
    })

    it("validates cap boundaries", () => {
      const temp = new TempDirectoryObject("test-boundaries")

      cappedDirs.push(temp)

      const child = temp.getDirectory("data")

      assert.strictEqual(child.cap, temp)
      assert.ok(child.path !== temp.path)
    })
  })

  describe("inherited method - getFile()", () => {
    it("creates FileObject with capped parent", () => {
      const temp = new TempDirectoryObject("test-get-file")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.ok(file instanceof FileObject)
      assert.equal(file.parent.path, temp.path)
      assert.ok(file.parent instanceof TempDirectoryObject)
    })
  })

  describe("inherited method - toString()", () => {
    it("shows readable representation", () => {
      const temp = new TempDirectoryObject("test-tostring")

      cappedDirs.push(temp)

      const str = temp.toString()

      assert.equal(typeof str, "string")
      assert.ok(str.includes("TempDirectoryObject"))
    })
  })

  describe("inherited method - toJSON()", () => {
    it("includes capped properties", () => {
      const temp = new TempDirectoryObject("test-tojson")

      cappedDirs.push(temp)

      const json = temp.toJSON()

      assert.ok(json.capped)
      assert.ok(json.cap)
      assert.ok(json.real)
    })

    it("returns object with standard properties", () => {
      const temp = new TempDirectoryObject("test-json-props")

      cappedDirs.push(temp)

      const json = temp.toJSON()

      assert.equal(typeof json.path, "string")
      assert.equal(typeof json.name, "string")
      assert.equal(json.isDirectory, true)
      assert.equal(json.isFile, false)
    })
  })

  describe("edge cases and error handling", () => {
    it("handles special characters in paths", () => {
      const temp = new TempDirectoryObject("test-special-chars-$&")

      cappedDirs.push(temp)

      // Special chars are in the real path, not virtual
      assert.ok(temp.real.path.includes("special-chars"))
    })

    it("handles deeply nested paths", async () => {
      const temp = new TempDirectoryObject("test-deep")

      cappedDirs.push(temp)

      let current = temp

      for(let i = 0; i < 10; i++) {
        current = current.getDirectory(`level${i}`)
      }


      assert.ok(current instanceof CappedDirectoryObject)
      assert.strictEqual(current.cap, temp)
    })

    it("creates child directories immediately for TempDirectoryObject", async () => {
      const temp = new TempDirectoryObject("test-child-create")

      cappedDirs.push(temp)

      const child = temp.getDirectory("subdir")

      // TempDirectoryObject creates the filesystem directory immediately
      assert.ok(child instanceof TempDirectoryObject)
      assert.equal(await child.exists, true)
    })
  })

  describe("security and cap enforcement", () => {
    it("rejects absolute paths (security)", () => {
      const temp = new TempDirectoryObject("test-security")

      cappedDirs.push(temp)

      // Absolute paths are rejected to prevent cap escaping
      assert.throws(
        () => temp.getDirectory("/etc/passwd"),
        /out of bounds/
      )
    })

    it("rejects path traversal (security)", () => {
      const temp = new TempDirectoryObject("test-cap-boundary")

      cappedDirs.push(temp)

      const child = temp.getDirectory("safe")

      // Path traversal is rejected
      assert.throws(
        () => child.getDirectory("../../etc/passwd"),
        /out of bounds/
      )
    })

    it("real path access is explicit", () => {
      const temp = new TempDirectoryObject("test-real-explicit")

      cappedDirs.push(temp)

      assert.notEqual(temp.path, temp.real.path)
      assert.ok(temp.real)
      assert.ok(temp.real instanceof DirectoryObject)
    })
  })

  describe("integration with TempDirectoryObject", () => {
    it("TempDirectoryObject parent creates capped children", () => {
      const temp = new TempDirectoryObject("test-temp-parent")

      cappedDirs.push(temp)

      const child = temp.getDirectory("data")

      assert.ok(child instanceof TempDirectoryObject)
      assert.ok(child instanceof CappedDirectoryObject)
    })

    it("cap propagates through temp directory tree", () => {
      const temp = new TempDirectoryObject("test-temp-tree")

      cappedDirs.push(temp)

      const level1 = temp.getDirectory("l1")
      const level2 = level1.getDirectory("l2")

      assert.strictEqual(level1.cap, temp)
      assert.strictEqual(level2.cap, temp)
    })

    it("virtual paths work correctly", () => {
      const temp = new TempDirectoryObject("test-temp-virtual")

      cappedDirs.push(temp)

      const child = temp.getDirectory("config")

      assert.ok(child.path.includes("config"))
      assert.notEqual(child.path, child.real.path)
    })

    it("parent chain works correctly", () => {
      const temp = new TempDirectoryObject("test-temp-chain")

      cappedDirs.push(temp)

      const child = temp.getDirectory("data")

      assert.strictEqual(child.parent, temp)
      assert.equal(temp.parent, null)
    })
  })
})
