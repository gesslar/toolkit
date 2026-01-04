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

  describe("fromCwd() static method", () => {
    it("throws error when called on TempDirectoryObject", () => {
      assert.throws(
        () => TempDirectoryObject.fromCwd(),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /TempDirectoryObject.fromCwd\(\) is not supported\./)
          return true
        }
      )
    })
  })

  describe("constructor", () => {

    it("creates TempDirectoryObject with name", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      assert.ok(temp instanceof TempDirectoryObject)
      assert.equal(temp.isTemporary, true)
      assert.equal(typeof temp.path, "string")
      assert.ok(temp.real.path.includes("test-temp"))  // Check real path, not virtual
      assert.equal(temp.path, path.parse(path.resolve("")).root) // Virtual path is "/" (at cap root)
      // Directory should exist immediately after construction
      assert.equal(await temp.exists, true)
    })

    it("creates nested TempDirectoryObject with parent", async () => {
      const parent = new TempDirectoryObject("parent")
      tempDirs.push(parent)

      const child = new TempDirectoryObject("child", parent)

      assert.ok(child instanceof TempDirectoryObject)
      assert.equal(child.isTemporary, true)
      assert.ok(child.path.startsWith(parent.path))
      // Both should exist immediately
      assert.equal(await parent.exists, true)
      assert.equal(await child.exists, true)
    })

    it("generates unique paths for same name", async () => {
      const temp1 = new TempDirectoryObject("test")
      const temp2 = new TempDirectoryObject("test")
      tempDirs.push(temp1, temp2)

      // Virtual paths are both root but real paths are unique
      assert.equal(temp1.path, temp2.path)
      assert.notEqual(temp1.real.path, temp2.real.path)
      assert.ok(temp1.real.path.includes("test"))
      assert.ok(temp2.real.path.includes("test"))
    })

    it("rejects parent with non-tmpdir cap (security)", () => {
      const badParent = new CappedDirectoryObject("/var/data")

      assert.throws(
        () => new TempDirectoryObject("child", badParent),
        /Error: Invalid type. Expected Null\|TempDirectoryObject/i,
      )
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
      assert.equal(child.isTemporary, true)
      assert.ok(child.path.startsWith(temp.path))
      assert.ok(child.path.includes("subdir"))
    })

    it("rejects path traversal attempts", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const child = temp.getDirectory("data").getDirectory("nested")

      // Path traversal is rejected
      assert.throws(
        () => child.getDirectory("../../../../../../../etc/passwd"),
        /out of bounds/
      )
    })

    it("rejects absolute paths", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      // Absolute paths are rejected
      assert.throws(
        () => temp.getDirectory("/home/user/documents"),
        /out of bounds/
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

    it("rejects nested paths with separators", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      // Paths with separators are rejected
      assert.throws(
        () => temp.getDirectory("data/cache/images"),
        /out of bounds/
      )

      // Must chain instead
      const nested = temp.getDirectory("data").getDirectory("cache").getDirectory("images")
      assert.ok(nested.path.includes("images"))
    })
  })

  describe("getFile()", () => {
    it("rejects absolute file paths", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      // Absolute paths are rejected
      assert.throws(
        () => temp.getFile("/config/settings.json"),
        /out of bounds/
      )
    })

    it("rejects file path traversal", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const child = temp.getDirectory("data")
      const child2 = child.getDirectory("nested")

      // Path traversal is rejected
      assert.throws(
        () => child2.getFile("../../../../../../../etc/passwd"),
        /out of bounds/
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
      const file = child.getFile("test.txt")
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
      assert.equal(directories[0] instanceof TempDirectoryObject, true)
      assert.ok(directories[0].name.includes("subdir"))
    })
  })

  describe("parent property (cap-aware)", () => {
    it("returns null parent for TempDirectoryObject (at cap root)", () => {
      const temp = new TempDirectoryObject("test-parent-root")
      tempDirs.push(temp)

      // TempDirectoryObject is at its own cap root, so parent is null
      assert.equal(temp.parent, null)
      assert.equal(temp.path, temp.cap.path)  // Virtual path at cap root
      assert.equal(temp.cap.real.path, temp.real.path)  // Cap is the temp directory itself
    })

    it("returns null when at actual cap root", () => {
      const temp = new TempDirectoryObject("test-cap-root")
      tempDirs.push(temp)

      // Walk up the parent chain until we reach the cap root
      let current = temp
      while(current.parent !== null)
        current = current.parent

      // Now current is at the cap root (virtual path "/", real path "/tmp")
      assert.equal(current.path, current.cap.path)  // Virtual path at cap root
      assert.equal(current.real.path, temp.cap.real.path)  // Real path matches the cap
      assert.equal(current.parent, null)  // At cap, parent is null
    })

    it("returns CappedDirectoryObject for subdirectory within cap", () => {
      const temp = new TempDirectoryObject("test-parent-sub")
      tempDirs.push(temp)

      const subdir = temp.getDirectory("data")
      const parent = subdir.parent

      assert.ok(parent instanceof DirectoryObject)
      assert.ok(parent instanceof CappedDirectoryObject)
      assert.equal(parent.path, temp.path)  // Parent returns virtual path (same as temp)
      assert.equal(parent.real.path, temp.real.path)  // Real path matches
    })

    it("returned parent maintains class type (TempDirectoryObject)", () => {
      const temp = new TempDirectoryObject("test-parent-capped")
      tempDirs.push(temp)

      const subdir = temp.getDirectory("data")
      const parent = subdir.parent

      // Parent maintains the capped type
      assert.ok(parent instanceof TempDirectoryObject)
      assert.ok(parent instanceof CappedDirectoryObject)
      assert.ok(parent instanceof DirectoryObject)
      // Maintains same cap as child
      assert.equal(parent.cap, subdir.cap)
    })
  })

  describe("walkUp generator (cap-aware)", () => {
    it("stops at cap root", () => {
      const temp = new TempDirectoryObject("test-walkup")
      tempDirs.push(temp)

      const deep = temp.getDirectory("a").getDirectory("b").getDirectory("c")
      const parents = [...deep.walkUp]
      const paths = parents.map(p => p.real.path)

      const tmp = temp.getDirectory("a").getDirectory("b").getDirectory("c").real.path
      // Should walk up through the hierarchy (using real paths since walkUp returns DirectoryObjects)
      assert.ok(paths.includes(temp.getDirectory("a").getDirectory("b").getDirectory("c").real.path))
      assert.ok(paths.includes(temp.getDirectory("a").getDirectory("b").real.path))
      assert.ok(paths.includes(temp.getDirectory("a").real.path))
      assert.ok(paths.includes(temp.real.path))

      // Should include the temp root (cap), but NOT /tmp
      assert.ok(paths.includes(temp.real.path))
      assert.ok(!paths.includes(os.tmpdir()))  // Doesn't go beyond temp cap

      // Should not go beyond the cap (temp directory itself)
      const lastPath = paths[paths.length - 1]
      assert.equal(lastPath, temp.real.path)
    })

    it("includes cap in walkUp results", () => {
      const temp = new TempDirectoryObject("test-walkup-includes-cap")
      tempDirs.push(temp)

      const subdir = temp.getDirectory("data")
      const parents = [...subdir.walkUp]
      const paths = parents.map(p => p.real.path)

      // Should include temp directory cap (using real paths)
      assert.ok(paths.includes(temp.real.path))
      assert.ok(!paths.includes(os.tmpdir()))  // Doesn't reach /tmp

      // Temp directory should be the last item (the cap)
      assert.equal(parents.at(-1).real.path, temp.real.path)
    })

    it("walkUp on TempDirectoryObject yields only itself (at cap)", () => {
      const temp = new TempDirectoryObject("test-walkup-temp")
      tempDirs.push(temp)

      const parents = [...temp.walkUp]
      const paths = parents.map(p => p.path)

      // Should yield only the temp directory itself (it's at the cap)
      assert.equal(parents.length, 1)
      assert.ok(!paths.includes(os.tmpdir()))  // Doesn't reach /tmp
      assert.equal(parents[0].real.path, temp.real.path)
    })
  })
})
