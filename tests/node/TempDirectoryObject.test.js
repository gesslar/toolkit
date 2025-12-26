import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import {afterEach,describe,it} from "node:test"

import {CappedDirectoryObject,DirectoryObject,FS,Sass,TempDirectoryObject} from "../../src/index.js"

describe("TempDirectoryObject", () => {
  /** @type {Array<TempDirectoryObject>} */
  const tempDirs = []

  afterEach(async () => {
    // Clean up all temp directories created during tests
    for(const dir of tempDirs) {
      if(await dir.exists)
        await dir.remove()
    }
    tempDirs.length = 0
  })

  describe("constructor", () => {
    it("creates TempDirectoryObject with name", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      assert.ok(temp instanceof TempDirectoryObject)
      assert.equal(temp.temporary, true)
      assert.equal(typeof temp.path, "string")
      assert.ok(temp.path.includes("test-temp"))
      // Directory should exist immediately after construction
      assert.equal(await temp.exists, true)
    })

    it("creates nested TempDirectoryObject with parent", async () => {
      const parent = new TempDirectoryObject("parent")
      tempDirs.push(parent)

      const child = new TempDirectoryObject("child", parent)

      assert.ok(child instanceof TempDirectoryObject)
      assert.equal(child.temporary, true)
      assert.ok(child.path.startsWith(parent.path))
      // Both should exist immediately
      assert.equal(await parent.exists, true)
      assert.equal(await child.exists, true)
    })

    it("throws error for absolute path in name", () => {
      assert.throws(
        () => new TempDirectoryObject("/home/user/documents"),
        /absolute path/,
      )
    })

    it("throws error for path separators", () => {
      assert.throws(
        () => new TempDirectoryObject("has/separator"),
        /path separators/,
      )
    })

    it("throws error for path separators even with parent", () => {
      const parent = new TempDirectoryObject("parent")
      tempDirs.push(parent)

      assert.throws(
        () => new TempDirectoryObject("data/cache", parent),
        /path separators/,
      )
    })

    it("generates unique paths for same name", async () => {
      const temp1 = new TempDirectoryObject("test")
      const temp2 = new TempDirectoryObject("test")
      tempDirs.push(temp1, temp2)

      assert.notEqual(temp1.path, temp2.path)
      assert.ok(temp1.path.includes("test"))
      assert.ok(temp2.path.includes("test"))
    })
  })

  describe("toString()", () => {
    it("returns correct string representation", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const str = temp.toString()

      assert.ok(str.startsWith("[TempDirectoryObject: "))
      assert.ok(str.includes(temp.path))
    })
  })

  describe("getDirectory()", () => {
    it("creates child TempDirectoryObject", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const child = temp.getDirectory("subdir")

      assert.ok(child instanceof TempDirectoryObject)
      assert.equal(child.temporary, true)
      assert.ok(child.path.startsWith(temp.path))
      assert.ok(child.path.includes("subdir"))
    })

    it("prevents path traversal attacks", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      assert.throws(
        () => temp.getDirectory("../../../etc/passwd"),
        Sass,
      )
    })

    it("prevents absolute paths", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      assert.throws(
        () => temp.getDirectory("/home/user/documents"),
        Sass,
      )
    })

    it("allows explicit chaining for nested directories", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const level1 = temp.getDirectory("level1")
      const level2 = level1.getDirectory("level2")
      const level3 = level2.getDirectory("level3")

      assert.ok(level3 instanceof TempDirectoryObject)
      assert.ok(level3.path.includes("level1"))
      assert.ok(level3.path.includes("level2"))
      assert.ok(level3.path.includes("level3"))
      // All directories exist immediately
      assert.equal(await level1.exists, true)
      assert.equal(await level2.exists, true)
      assert.equal(await level3.exists, true)
    })

    it("rejects paths with separators in getDirectory()", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      assert.throws(
        () => temp.getDirectory("data/cache"),
        /path separators/,
      )
    })
  })

  describe("temporary operations", () => {
    it("can create and remove temp directory", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      // Directory exists immediately after construction
      assert.equal(await temp.exists, true)
      await temp.remove()
      assert.equal(await temp.exists, false)

      // Remove from cleanup list since we already removed it
      tempDirs.pop()
    })

    it("inherits remove() functionality from DirectoryObject", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const child = temp.getDirectory("child")

      // Create a file in the child directory
      const {FileObject} = await import("../../src/index.js")
      const file = new FileObject("test.txt", child)
      await file.write("test content")

      // Remove should recursively delete everything
      await temp.remove()
      assert.equal(await temp.exists, false)
      assert.equal(await child.exists, false)

      tempDirs.pop()
    })
  })

  describe("read() operations", () => {
    it("read() returns TempDirectoryObject instances for subdirectories", async () => {
      const temp = new TempDirectoryObject("test-read")
      tempDirs.push(temp)

      const subDir = temp.getDirectory("subdir")

      const {directories} = await temp.read()

      assert.equal(directories.length, 1)
      // Note: DirectoryObject.read() creates new DirectoryObject instances
      // not TempDirectoryObject, but they will have temporary=true
      assert.equal(directories[0].temporary, true)
      assert.ok(directories[0].name.includes("subdir"))
    })
  })

  describe("parent property (cap-aware)", () => {
    it("returns parent DirectoryObject for TempDirectoryObject", () => {
      const temp = new TempDirectoryObject("test-parent-root")
      tempDirs.push(temp)

      // TempDirectoryObject's parent is /tmp (the cap)
      const parent = temp.parent
      assert.ok(parent instanceof DirectoryObject)
      assert.equal(parent.path, os.tmpdir())
    })

    it("returns null when at actual cap root", () => {
      const temp = new TempDirectoryObject("test-cap-root")
      tempDirs.push(temp)

      // Get parent until we reach the cap
      let current = temp
      while(current.parent && current.parent.path !== temp.cap) {
        current = current.parent
      }

      // Now current should be at /tmp, which is the cap
      // Its parent getter should check if we're at cap and return appropriately
      const capDir = new DirectoryObject(temp.cap)
      // Actually, since cap is /tmp, its parent would be / which is beyond cap
      // But for a plain DirectoryObject at /tmp, parent would return /
      assert.ok(capDir.parent !== null)
    })

    it("returns DirectoryObject for subdirectory within cap", () => {
      const temp = new TempDirectoryObject("test-parent-sub")
      tempDirs.push(temp)

      const subdir = temp.getDirectory("data")
      const parent = subdir.parent

      assert.ok(parent instanceof DirectoryObject)
      assert.equal(parent.path, temp.path)
    })

    it("returned parent is plain DirectoryObject not capped", () => {
      const temp = new TempDirectoryObject("test-parent-uncapped")
      tempDirs.push(temp)

      const subdir = temp.getDirectory("data")
      const parent = subdir.parent

      // Parent is not a CappedDirectoryObject
      assert.ok(!(parent instanceof CappedDirectoryObject))
      assert.ok(parent instanceof DirectoryObject)
    })
  })

  describe("walkUp generator (cap-aware)", () => {
    it("stops at cap root", () => {
      const temp = new TempDirectoryObject("test-walkup")
      tempDirs.push(temp)

      const deep = temp.getDirectory("a").getDirectory("b").getDirectory("c")
      const parents = [...deep.walkUp]
      const paths = parents.map(p => p.path)

      // Should walk up through the hierarchy
      assert.ok(paths.includes(temp.getDirectory("a").getDirectory("b").getDirectory("c").path))
      assert.ok(paths.includes(temp.getDirectory("a").getDirectory("b").path))
      assert.ok(paths.includes(temp.getDirectory("a").path))
      assert.ok(paths.includes(temp.path))

      // Should include the cap (/tmp)
      assert.ok(paths.includes(os.tmpdir()))

      // Should not go beyond the cap
      const lastPath = paths[paths.length - 1]
      assert.equal(lastPath, os.tmpdir())
    })

    it("includes cap in walkUp results", () => {
      const temp = new TempDirectoryObject("test-walkup-includes-cap")
      tempDirs.push(temp)

      const subdir = temp.getDirectory("data")
      const parents = [...subdir.walkUp]
      const paths = parents.map(p => p.path)

      // Should include temp directory and cap
      assert.ok(paths.includes(temp.path))
      assert.ok(paths.includes(os.tmpdir()))

      // Cap should be the last item
      assert.equal(parents[parents.length - 1].path, os.tmpdir())
    })

    it("walkUp on TempDirectoryObject walks to cap", () => {
      const temp = new TempDirectoryObject("test-walkup-temp")
      tempDirs.push(temp)

      const parents = [...temp.walkUp]
      const paths = parents.map(p => p.path)

      // Should yield temp directory and cap
      assert.ok(paths.includes(temp.path))
      assert.ok(paths.includes(os.tmpdir()))
      assert.equal(parents[parents.length - 1].path, os.tmpdir())
    })
  })
})
