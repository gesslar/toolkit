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
      assert.ok(temp.real.path.includes("test-temp"))  // Check real path, not virtual
      assert.equal(temp.path, "/")  // Virtual path is "/" (at cap root)
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

    it("allows absolute paths (treated as virtual paths relative to tmpdir)", async () => {
      const temp = new TempDirectoryObject("/home/user/documents")
      tempDirs.push(temp)

      // Should create /tmp/home/user/documents (virtual path /home/user/documents)
      assert.ok(temp.real.path.includes("tmp"))
      assert.ok(temp.real.path.includes("home"))
      assert.ok(temp.real.path.includes("user"))
      assert.ok(temp.real.path.includes("documents"))
      assert.equal(await temp.exists, true)
    })

    it("allows path separators to create nested structure", async () => {
      const temp = new TempDirectoryObject("has/separator")
      tempDirs.push(temp)

      // Should create /tmp/has/separator
      assert.ok(temp.real.path.includes("has"))
      assert.ok(temp.real.path.includes("separator"))
      assert.equal(await temp.exists, true)
    })

    it("allows nested paths with parent", async () => {
      const parent = new TempDirectoryObject("parent")
      tempDirs.push(parent)

      const child = new TempDirectoryObject("data/cache", parent)

      // Should create parent/data/cache
      assert.ok(child.real.path.includes("parent"))
      assert.ok(child.real.path.includes("data"))
      assert.ok(child.real.path.includes("cache"))
      assert.equal(await child.exists, true)
    })

    it("generates unique paths for same name", async () => {
      const temp1 = new TempDirectoryObject("test")
      const temp2 = new TempDirectoryObject("test")
      tempDirs.push(temp1, temp2)

      // Virtual paths are both "/" but real paths are unique
      assert.equal(temp1.path, "/")
      assert.equal(temp2.path, "/")
      assert.notEqual(temp1.real.path, temp2.real.path)
      assert.ok(temp1.real.path.includes("test"))
      assert.ok(temp2.real.path.includes("test"))
    })

    it("rejects parent with non-tmpdir cap (security)", () => {
      const badParent = new CappedDirectoryObject("/var/data")

      assert.throws(
        () => new TempDirectoryObject("child", badParent),
        /must be capped to OS temp directory/i,
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
      assert.equal(child.temporary, true)
      assert.ok(child.path.startsWith(temp.path))
      assert.ok(child.path.includes("subdir"))
    })

    it("coerces path traversal to cap boundary", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const child = temp.getDirectory("data").getDirectory("nested")
      const escaped = child.getDirectory("../../../../../../../etc/passwd")

      // Should clamp to cap (the temp directory itself, not /tmp)
      assert.equal(escaped.path, "/")  // Virtual path at cap root
      assert.equal(escaped.real.path, temp.real.path)  // Real filesystem path = temp dir
    })

    it("treats absolute paths as relative to cap", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const absPath = temp.getDirectory("/home/user/documents")

      // path shows virtual (cap-relative)
      assert.equal(absPath.path, "/home/user/documents")

      // real.path shows actual filesystem location (under temp dir, not /tmp)
      assert.ok(absPath.real.path.startsWith(temp.real.path))
      assert.ok(absPath.real.path.includes("home"))
      assert.ok(absPath.real.path.includes("user"))
      assert.ok(absPath.real.path.includes("documents"))
      assert.equal(absPath.real.path, path.join(temp.real.path, "home", "user", "documents"))
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

    it("allows nested paths with separators in getDirectory()", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const nested = temp.getDirectory("data/cache/images")

      // Should create nested directory structure
      assert.ok(nested.path.includes("data"))
      assert.ok(nested.path.includes("cache"))
      assert.ok(nested.path.includes("images"))
      assert.equal(nested.path, path.join(temp.path, "data", "cache", "images"))
    })

    it("allows chaining getDirectory after coerced path", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      // First call uses coercion (has separator), returns CappedDirectoryObject
      // Second call should still work even though parent is plain CappedDirectoryObject
      const nested = temp.getDirectory("data/cache").getDirectory("leaf")

      // Result is CappedDirectoryObject (not TempDirectoryObject) due to coercion
      assert.ok(nested instanceof CappedDirectoryObject)
      assert.ok(nested.path.includes("data"))
      assert.ok(nested.path.includes("cache"))
      assert.ok(nested.path.includes("leaf"))
      // CappedDirectoryObject doesn't auto-create directories, so just verify path
      assert.equal(nested.cap, temp.cap)
    })
  })

  describe("getFile()", () => {
    it("creates FileObject with absolute path relative to cap", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const {FileObject} = await import("../../src/index.js")
      const file = temp.getFile("/config/settings.json")

      // path shows virtual (cap-relative)
      assert.ok(file instanceof FileObject)
      assert.equal(file.path, "/config/settings.json")

      // real.path shows actual filesystem location (under temp dir)
      assert.ok(file.real.path.startsWith(temp.real.path))
      assert.ok(file.real.path.includes("config"))
      assert.equal(file.real.path, path.join(temp.real.path, "config", "settings.json"))
    })

    it("coerces file path traversal to cap boundary", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const {FileObject} = await import("../../src/index.js")
      const child = temp.getDirectory("data").getDirectory("nested")
      const file = child.getFile("../../../../../../../etc/passwd")

      // path shows virtual (clamped to cap root)
      assert.ok(file instanceof FileObject)
      assert.equal(file.path, "/passwd")

      // real.path shows actual filesystem location (under temp dir)
      assert.ok(file.real.path.startsWith(temp.real.path))
      assert.equal(file.real.path, path.join(temp.real.path, "passwd"))
    })

    it("handles nested file paths with separators", async () => {
      const temp = new TempDirectoryObject("test-temp")
      tempDirs.push(temp)

      const {FileObject} = await import("../../src/index.js")
      const file = temp.getFile("data/logs/app.log")

      // Should create nested path structure
      assert.ok(file instanceof FileObject)
      assert.ok(file.path.includes("data"))
      assert.ok(file.path.includes("logs"))
      // path is now virtual (temp is at "/"), real.path is actual filesystem
      assert.equal(file.path, "/data/logs/app.log")  // Virtual path from temp root
      assert.equal(file.real.path, path.join(temp.real.path, "data", "logs", "app.log"))
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
    it("returns null parent for TempDirectoryObject (at cap root)", () => {
      const temp = new TempDirectoryObject("test-parent-root")
      tempDirs.push(temp)

      // TempDirectoryObject is at its own cap root, so parent is null
      assert.equal(temp.parent, null)
      assert.equal(temp.path, "/")  // Virtual path at cap root
      assert.equal(temp.cap, temp.real.path)  // Cap is the temp directory itself
    })

    it("returns null when at actual cap root", () => {
      const temp = new TempDirectoryObject("test-cap-root")
      tempDirs.push(temp)

      // Walk up the parent chain until we reach the cap root
      let current = temp
      while(current.parent !== null) {
        current = current.parent
      }

      // Now current is at the cap root (virtual path "/", real path "/tmp")
      assert.equal(current.path, "/")  // Virtual path at cap root
      assert.equal(current.real.path, temp.cap)  // Real path matches the cap
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

    it("returned parent maintains class type (CappedDirectoryObject)", () => {
      const temp = new TempDirectoryObject("test-parent-capped")
      tempDirs.push(temp)

      const subdir = temp.getDirectory("data")
      const parent = subdir.parent

      // Parent maintains the capped type
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
      const paths = parents.map(p => p.path)

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
      const paths = parents.map(p => p.path)

      // Should include temp directory cap (using real paths)
      assert.ok(paths.includes(temp.real.path))
      assert.ok(!paths.includes(os.tmpdir()))  // Doesn't reach /tmp

      // Temp directory should be the last item (the cap)
      assert.equal(parents[parents.length - 1].path, temp.real.path)
    })

    it("walkUp on TempDirectoryObject yields only itself (at cap)", () => {
      const temp = new TempDirectoryObject("test-walkup-temp")
      tempDirs.push(temp)

      const parents = [...temp.walkUp]
      const paths = parents.map(p => p.path)

      // Should yield only the temp directory itself (it's at the cap)
      assert.equal(parents.length, 1)
      assert.ok(paths.includes(temp.real.path))
      assert.ok(!paths.includes(os.tmpdir()))  // Doesn't reach /tmp
      assert.equal(parents[0].path, temp.real.path)
    })
  })
})
