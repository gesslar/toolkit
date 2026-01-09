import assert from "node:assert/strict"
import path from "node:path"
import {afterEach,beforeEach,describe,it} from "node:test"
import fs from "node:fs/promises"

import {VDirectoryObject,VFileObject,DirectoryObject,FileObject,Sass,TempDirectoryObject,FileSystem} from "../../src/node/index.js"
import {TestUtils} from "../helpers/test-utils.js"

describe("VDirectoryObject", () => {
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
    it("creates VDirectoryObject with no arguments", () => {
      const capped = new VDirectoryObject()

      // Don't add to cleanup - defaults to process.cwd()

      assert.ok(capped instanceof VDirectoryObject)
      // Virtual path is root at cap root
      assert.equal(capped.path, path.parse(path.resolve("")).root)
      // Real path is process.cwd()
      assert.equal(capped.real.path, process.cwd())
      assert.strictEqual(capped.cap, capped)
      assert.equal(capped.isVirtual, true)
    })

    it("creates VDirectoryObject with absolute path", () => {
      const temp = new TempDirectoryObject("test-capped-abs")

      cappedDirs.push(temp)

      assert.ok(temp instanceof VDirectoryObject)
      assert.ok(path.isAbsolute(temp.path))
      assert.strictEqual(temp.cap, temp)
    })

    it("creates child with relative path and parent", () => {
      const parent = new TempDirectoryObject("test-capped-parent")

      cappedDirs.push(parent)

      const child = parent.getDirectory("data")

      assert.ok(child instanceof VDirectoryObject)
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
      const capped = new VDirectoryObject()

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
      const capped = new VDirectoryObject(".", null)

      // Don't add to cleanup - uses current directory

      assert.ok(capped instanceof VDirectoryObject)
      assert.equal(capped.parent, null)
    })

    it("accepts VDirectoryObject parent", () => {
      const parent = new TempDirectoryObject("test-valid-parent")

      cappedDirs.push(parent)

      const child = new VDirectoryObject("child", parent)

      assert.ok(child instanceof VDirectoryObject)
      assert.strictEqual(child.parent, parent)
    })

    it("rejects DirectoryObject parent (not capped)", () => {
      const notCapped = new DirectoryObject("/tmp/not-capped")

      assert.throws(
        () => new VDirectoryObject("child", notCapped),
        error => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Invalid type/)
          return true
        }
      )
    })

    it("rejects invalid parent types", () => {
      assert.throws(
        () => new VDirectoryObject(".", "invalid"),
        Sass
      )

      assert.throws(
        () => new VDirectoryObject(".", 123),
        Sass
      )

      assert.throws(
        () => new VDirectoryObject(".", {}),
        Sass
      )
    })
  })

  describe("static method - fromCwd()", () => {
    it("creates new instance at process.cwd()", () => {
      const capped = VDirectoryObject.fromCwd()

      // Don't add to cleanup - we don't want to delete the project root!

      assert.ok(capped instanceof VDirectoryObject)
      // Virtual path is root at cap root
      assert.equal(capped.path, path.parse(path.resolve("")).root)
      // Real path is process.cwd()
      assert.equal(capped.real.path, process.cwd())
    })

    it("cap is set to itself", () => {
      const capped = VDirectoryObject.fromCwd()

      // Don't add to cleanup - we don't want to delete the project root!

      assert.strictEqual(capped.cap, capped)
    })

    it("works with subclasses (TempDirectoryObject overrides it)", () => {
      // TempDirectoryObject intentionally throws for fromCwd()
      assert.throws(
        () => TempDirectoryObject.fromCwd(),
        /TempDirectoryObject.fromCwd\(\) is not supported/
      )

      // But VDirectoryObject.fromCwd() works
      const capped = VDirectoryObject.fromCwd()

      // Don't add to cleanup - uses process.cwd()

      assert.ok(capped instanceof VDirectoryObject)
    })
  })

  describe("getter - isVirtual", () => {
    it("always returns true", () => {
      const capped = new TempDirectoryObject("test-is-capped")

      cappedDirs.push(capped)

      assert.equal(capped.isVirtual, true)

      const child = capped.getDirectory("subdir")

      assert.equal(child.isVirtual, true)
    })

    it("distinguishes from regular DirectoryObject", () => {
      const regular = new DirectoryObject("/tmp")
      const capped = new TempDirectoryObject("test-distinguish")

      cappedDirs.push(capped)

      // Regular DirectoryObject doesn't have isVirtual property (undefined)
      assert.equal(regular.isVirtual, undefined)
      assert.equal(capped.isVirtual, true)
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
    it("returns DirectoryObject (not VDirectoryObject)", () => {
      const temp = new TempDirectoryObject("test-real-type")

      cappedDirs.push(temp)

      assert.ok(temp.real instanceof DirectoryObject)
      assert.ok(!(temp.real instanceof VDirectoryObject))
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

    it("child instance has VDirectoryObject parent", () => {
      const parent = new TempDirectoryObject("test-parent-obj")

      cappedDirs.push(parent)

      const child = parent.getDirectory("data")

      assert.ok(child.parent instanceof VDirectoryObject)
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

    it("treats absolute path as cap-relative with parent", async () => {
      const parent = new TempDirectoryObject("test-abs-parent")

      cappedDirs.push(parent)

      // Absolute paths resolve from cap root and are now allowed
      // Create intermediate directory first
      await parent.getDirectory("/etc").assureExists({recursive: true})
      const child = parent.getDirectory("/etc/config")

      assert.ok(child instanceof TempDirectoryObject)
      assert.ok(child.path.includes("etc/config"))
      assert.ok(child.real.path.includes(parent.real.path))

      // Single-segment absolute paths also work
      const child2 = parent.getDirectory("/etc")

      assert.ok(child2 instanceof TempDirectoryObject)
      assert.ok(child2.path.includes("etc"))
    })

    it("allows paths with separators", async () => {
      const parent = new TempDirectoryObject("test-rel-parent")

      cappedDirs.push(parent)

      // Paths with separators are now allowed
      // Create intermediate directory first
      await parent.getDirectory("data").assureExists({recursive: true})
      const nested = parent.getDirectory("data/cache")

      assert.ok(nested instanceof TempDirectoryObject)
      assert.ok(nested.path.includes("data/cache"))

      // Chaining also works: parent -> data -> cache
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

    it("returns VDirectoryObject instances for directories", async () => {
      const temp = new TempDirectoryObject("test-read-dirs")

      cappedDirs.push(temp)

      const subdir = temp.getDirectory("subdir")

      const {directories} = await temp.read()

      assert.ok(directories[0] instanceof VDirectoryObject)
      assert.ok(directories[0] instanceof TempDirectoryObject)
      assert.strictEqual(directories[0].cap, temp)
    })

    it("files have correct parent set", async () => {
      const temp = new TempDirectoryObject("test-read-files")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("content")

      const {files} = await temp.read()

      assert.ok(files[0] instanceof VFileObject)
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
    it("creates child VDirectoryObject", () => {
      const temp = new TempDirectoryObject("test-get-dir")

      cappedDirs.push(temp)

      const child = temp.getDirectory("subdir")

      assert.ok(child instanceof VDirectoryObject)
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
    it("creates VFileObject when called on VDirectoryObject", () => {
      const temp = new TempDirectoryObject("test-get-file")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.ok(file instanceof VFileObject)
      assert.ok(file instanceof FileObject)
      assert.equal(file.parent.path, temp.path)
      assert.ok(file.parent instanceof TempDirectoryObject)
    })

    it("VFileObject has isVirtual property", () => {
      const temp = new TempDirectoryObject("test-get-file-virtual")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.equal(file.isVirtual, true)
    })

    it("VFileObject has real property pointing to actual filesystem", () => {
      const temp = new TempDirectoryObject("test-get-file-real")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.ok(file.real instanceof FileObject)
      assert.ok(!(file.real instanceof VFileObject))
      assert.notEqual(file.path, file.real.path)
      assert.ok(file.real.path.includes(temp.real.path))
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


      assert.ok(current instanceof VDirectoryObject)
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
    it("allows absolute paths but enforces cap boundary", async () => {
      const temp = new TempDirectoryObject("test-security")

      cappedDirs.push(temp)

      // Absolute paths are now allowed and resolve from cap root
      // They stay within the cap boundary
      // Create intermediate directory first
      await temp.getDirectory("/etc").assureExists({recursive: true})
      const dir = temp.getDirectory("/etc/passwd")

      assert.ok(dir instanceof TempDirectoryObject)
      assert.ok(dir.path.includes("etc/passwd"))
      assert.ok(dir.real.path.startsWith(temp.real.path))
      assert.ok(FileSystem.pathContains(temp.real.path, dir.real.path))
    })

    it("allows path traversal within cap boundary", async () => {
      const temp = new TempDirectoryObject("test-cap-boundary")

      cappedDirs.push(temp)

      const child = temp.getDirectory("safe")

      // Path traversal works like a real filesystem - goes up to cap root
      const upToRoot = child.getDirectory("..")
      assert.equal(upToRoot.path, temp.path)

      // Going up and then down stays within cap
      // Create intermediate directory first (both virtual and real)
      const etcDir = temp.getDirectory("/etc")
      await etcDir.assureExists({recursive: true})
      const deepPath = child.getDirectory("../etc/passwd")
      // This resolves to /etc/passwd (from cap root), which is within cap
      assert.ok(deepPath.real.path.startsWith(temp.real.path))
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
      assert.ok(child instanceof VDirectoryObject)
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

  describe("async method - glob()", () => {
    it("returns VFileObject instances for files", async () => {
      const temp = new TempDirectoryObject("test-glob-vfiles")

      cappedDirs.push(temp)

      const subdir = temp.getDirectory("subdir")

      await temp.getFile("root.json").write("{}")
      await subdir.getFile("nested.json").write("{}")

      const {files} = await temp.glob("**/*.json")

      assert.equal(files.length, 2)
      assert.ok(files.every(f => f instanceof VFileObject))
      assert.ok(files.every(f => f.isVirtual === true))
    })

    it("VFileObject paths are relative to virtual directory, not concatenated", async () => {
      const temp = new TempDirectoryObject("test-glob-paths")

      cappedDirs.push(temp)

      const subdir = temp.getDirectory("subdir")

      await subdir.getFile("test.json").write("{}")

      const {files} = await temp.glob("**/*.json")

      assert.equal(files.length, 1)

      const file = files[0]

      // Virtual path should be clean, not concatenated
      assert.ok(file.path.includes("subdir"))
      assert.ok(file.path.includes("test.json"))
      // Should NOT contain the real temp directory path
      assert.ok(!file.path.includes(temp.real.path))
    })

    it("VFileObject real paths point to actual filesystem", async () => {
      const temp = new TempDirectoryObject("test-glob-real")

      cappedDirs.push(temp)

      const subdir = temp.getDirectory("subdir")

      await subdir.getFile("test.json").write("{}")

      const {files} = await temp.glob("**/*.json")

      assert.equal(files.length, 1)

      const file = files[0]

      // Real path should be absolute and contain temp directory
      assert.ok(path.isAbsolute(file.real.path))
      assert.ok(file.real.path.includes("test-glob-real"))
      assert.ok(file.real.path.includes("subdir"))
      assert.ok(file.real.path.includes("test.json"))
    })

    it("returns VDirectoryObject instances for directories", async () => {
      const temp = new TempDirectoryObject("test-glob-vdirs")

      cappedDirs.push(temp)

      temp.getDirectory("dir1")
      temp.getDirectory("dir2")

      const {directories} = await temp.glob("*")

      assert.ok(directories.length >= 2)
      assert.ok(directories.every(d => d instanceof VDirectoryObject))
      assert.ok(directories.every(d => d.isVirtual === true))
    })

    it("VDirectoryObject paths from glob are not concatenated", async () => {
      const temp = new TempDirectoryObject("test-glob-dir-paths")

      cappedDirs.push(temp)

      temp.getDirectory("subdir")

      const {directories} = await temp.glob("*")

      const subdir = directories.find(d => d.path.endsWith("subdir"))

      assert.ok(subdir)
      // Virtual path should be clean
      assert.ok(subdir.path.includes("subdir"))
      // Should NOT contain the real temp directory path
      assert.ok(!subdir.path.includes(temp.real.path))
    })

    it("glob results maintain correct parent references", async () => {
      const temp = new TempDirectoryObject("test-glob-parents")

      cappedDirs.push(temp)

      const subdir = temp.getDirectory("subdir")

      await subdir.getFile("test.json").write("{}")

      const {files} = await temp.glob("**/*.json")

      assert.equal(files.length, 1)

      const file = files[0]

      // Parent should be a VDirectoryObject (the subdir)
      assert.ok(file.parent instanceof VDirectoryObject)
      assert.ok(file.parent.path.includes("subdir"))
      // Cap should be the root temp directory
      assert.strictEqual(file.parent.cap, temp)
    })

    it("glob with nested structure returns correct paths", async () => {
      const temp = new TempDirectoryObject("test-glob-nested")

      cappedDirs.push(temp)

      const level1 = temp.getDirectory("level1")
      const level2 = level1.getDirectory("level2")

      await level2.getFile("deep.json").write("{}")

      const {files} = await temp.glob("**/*.json")

      assert.equal(files.length, 1)

      const file = files[0]

      // Virtual path should show the nested structure cleanly
      assert.ok(file.path.includes("level1"))
      assert.ok(file.path.includes("level2"))
      assert.ok(file.path.includes("deep.json"))

      // Real path should point to actual filesystem
      assert.ok(path.isAbsolute(file.real.path))
      assert.ok(file.real.path.includes("test-glob-nested"))
      assert.ok(file.real.path.includes("level1"))
      assert.ok(file.real.path.includes("level2"))
    })

    it("glob on non-virtual DirectoryObject still works", async () => {
      const testDir = await TestUtils.createTestDir("glob-non-virtual")

      const filePath = path.join(testDir, "test.json")

      await fs.writeFile(filePath, "{}")

      const dir = new DirectoryObject(testDir)
      const {files} = await dir.glob("*.json")

      assert.equal(files.length, 1)
      assert.ok(files[0] instanceof FileObject)
      assert.ok(!(files[0] instanceof VFileObject))
      assert.equal(files[0].isVirtual, undefined)

      await TestUtils.cleanupTestDir(testDir)
    })

    it("glob pattern with wildcard returns all files and directories", async () => {
      const temp = new TempDirectoryObject("test-glob-wildcard")

      cappedDirs.push(temp)

      await temp.getFile("file1.txt").write("content")
      await temp.getFile("file2.json").write("{}")
      temp.getDirectory("subdir")

      const {files, directories} = await temp.glob("*")

      assert.ok(files.length >= 2)
      assert.ok(directories.length >= 1)
    })

    it("glob pattern with no matches returns empty arrays", async () => {
      const temp = new TempDirectoryObject("test-glob-nomatch")

      cappedDirs.push(temp)

      await temp.getFile("test.txt").write("content")

      const {files, directories} = await temp.glob("**/*.xml")

      assert.equal(files.length, 0)
      assert.equal(directories.length, 0)
    })
  })
})
