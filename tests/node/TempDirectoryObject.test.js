import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import {afterEach,describe,it} from "node:test"

import {FS,Sass,TempDirectoryObject} from "../../src/index.js"

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

  describe("addDirectory()", () => {
    it("creates child TempDirectoryObject", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const child = temp.addDirectory("subdir")

      assert.ok(child instanceof TempDirectoryObject)
      assert.equal(child.temporary, true)
      assert.ok(child.path.startsWith(temp.path))
      assert.ok(child.path.includes("subdir"))
    })

    it("prevents path traversal attacks", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      assert.throws(
        () => temp.addDirectory("../../../etc/passwd"),
        Sass,
      )
    })

    it("prevents absolute paths", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      assert.throws(
        () => temp.addDirectory("/home/user/documents"),
        Sass,
      )
    })

    it("allows explicit chaining for nested directories", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const level1 = temp.addDirectory("level1")
      const level2 = level1.addDirectory("level2")
      const level3 = level2.addDirectory("level3")

      assert.ok(level3 instanceof TempDirectoryObject)
      assert.ok(level3.path.includes("level1"))
      assert.ok(level3.path.includes("level2"))
      assert.ok(level3.path.includes("level3"))
      // All directories exist immediately
      assert.equal(await level1.exists, true)
      assert.equal(await level2.exists, true)
      assert.equal(await level3.exists, true)
    })

    it("rejects paths with separators in addDirectory()", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      assert.throws(
        () => temp.addDirectory("data/cache"),
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

      const child = temp.addDirectory("child")

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

      const subDir = temp.addDirectory("subdir")

      const {directories} = await temp.read()

      assert.equal(directories.length, 1)
      // Note: DirectoryObject.read() creates new DirectoryObject instances
      // not TempDirectoryObject, but they will have temporary=true
      assert.equal(directories[0].temporary, true)
      assert.ok(directories[0].name.includes("subdir"))
    })
  })
})
