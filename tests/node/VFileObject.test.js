import assert from "node:assert/strict"
import path from "node:path"
import {afterEach,describe,it} from "node:test"

import {VFileObject,VDirectoryObject,DirectoryObject,FileObject,Sass,TempDirectoryObject} from "../../src/node/index.js"

describe("VFileObject", () => {
  const cappedDirs = []

  afterEach(async () => {
    for(const dir of cappedDirs) {
      if(await dir.exists) {
        if(typeof dir.remove === "function")
          await dir.remove()
        else
          await dir.delete()

      }

    }

    cappedDirs.length = 0
  })

  describe("constructor and basic properties", () => {
    it("creates VFileObject with VDirectoryObject parent", () => {
      const temp = new TempDirectoryObject("test-vfile-basic")

      cappedDirs.push(temp)

      const file = new VFileObject("test.txt", temp)

      assert.ok(file instanceof VFileObject)
      assert.ok(file instanceof FileObject)
      assert.equal(file.name, "test.txt")
      assert.equal(file.isVirtual, true)
    })

    it("creates VFileObject via getFile()", () => {
      const temp = new TempDirectoryObject("test-vfile-getfile")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.ok(file instanceof VFileObject)
      assert.equal(file.name, "test.txt")
    })

    it("requires VDirectoryObject parent", () => {
      assert.throws(
        () => new VFileObject("test.txt"),
        error => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Invalid type/)
          return true
        }
      )
    })

    it("rejects DirectoryObject parent (not virtual)", () => {
      const dir = new DirectoryObject("/tmp")

      assert.throws(
        () => new VFileObject("test.txt", dir),
        error => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Invalid type/)
          return true
        }
      )
    })

    it("rejects null parent", () => {
      assert.throws(
        () => new VFileObject("test.txt", null),
        error => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Invalid type/)
          return true
        }
      )
    })

    it("accepts TempDirectoryObject parent (subclass of VDirectoryObject)", () => {
      const temp = new TempDirectoryObject("test-vfile-subclass")

      cappedDirs.push(temp)

      const file = new VFileObject("test.txt", temp)

      assert.ok(file instanceof VFileObject)
      assert.ok(file.parent instanceof TempDirectoryObject)
    })

    it("handles files without extension", () => {
      const temp = new TempDirectoryObject("test-vfile-noext")

      cappedDirs.push(temp)

      const file = new VFileObject("README", temp)

      assert.equal(file.name, "README")
      assert.equal(file.extension, "")
      assert.equal(file.module, "README")
    })

    it("handles complex file extensions", () => {
      const temp = new TempDirectoryObject("test-vfile-complex")

      cappedDirs.push(temp)

      const file = new VFileObject("archive.tar.gz", temp)

      assert.equal(file.name, "archive.tar.gz")
      assert.equal(file.extension, ".gz")
      assert.equal(file.module, "archive.tar")
    })
  })

  describe("getter - isVirtual", () => {
    it("always returns true", () => {
      const temp = new TempDirectoryObject("test-vfile-isvirtual")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.equal(file.isVirtual, true)
    })

    it("distinguishes from regular FileObject", () => {
      const temp = new TempDirectoryObject("test-vfile-distinguish")

      cappedDirs.push(temp)

      const regularFile = new FileObject("/tmp/test.txt")
      const virtualFile = temp.getFile("test.txt")

      assert.equal(regularFile.isVirtual, undefined)
      assert.equal(virtualFile.isVirtual, true)
    })
  })

  describe("getter - real", () => {
    it("returns FileObject (not VFileObject)", () => {
      const temp = new TempDirectoryObject("test-vfile-real-type")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.ok(file.real instanceof FileObject)
      assert.ok(!(file.real instanceof VFileObject))
    })

    it("real.path shows actual filesystem path", () => {
      const temp = new TempDirectoryObject("test-vfile-real-path")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.ok(path.isAbsolute(file.real.path))
      assert.ok(file.real.path.includes("test-vfile-real-path"))
      assert.ok(file.real.path.endsWith("test.txt"))
    })

    it("real is different object from this", () => {
      const temp = new TempDirectoryObject("test-vfile-real-diff")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.notStrictEqual(file.real, file)
    })

    it("virtual path differs from real path", () => {
      const temp = new TempDirectoryObject("test-vfile-paths")

      cappedDirs.push(temp)

      const file = temp.getFile("config.json")

      assert.notEqual(file.path, file.real.path)
      assert.ok(file.path.includes("config.json"))
      assert.ok(file.real.path.includes("config.json"))
    })
  })

  describe("path resolution", () => {
    it("resolves virtual path correctly", () => {
      const temp = new TempDirectoryObject("test-vfile-resolve")

      cappedDirs.push(temp)

      const file = temp.getFile("data.json")

      assert.ok(file.path.includes("data.json"))
      assert.equal(file.name, "data.json")
    })

    it("resolves real path relative to parent's real path", () => {
      const temp = new TempDirectoryObject("test-vfile-parent-real")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.ok(file.real.path.startsWith(temp.real.path))
      assert.ok(file.real.path.includes("test.txt"))
    })

    it("works with nested directory structure", () => {
      const temp = new TempDirectoryObject("test-vfile-nested")

      cappedDirs.push(temp)

      const subdir = temp.getDirectory("data")
      const file = subdir.getFile("config.json")

      assert.ok(file.path.includes("config.json"))
      assert.ok(file.real.path.includes("data"))
      assert.ok(file.real.path.includes("config.json"))
    })
  })

  describe("parent relationship", () => {
    it("parent is a VDirectoryObject", () => {
      const temp = new TempDirectoryObject("test-vfile-parent-type")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.ok(file.parent instanceof VDirectoryObject)
      assert.strictEqual(file.parent, temp)
    })

    it("parent shares same cap as temp root", () => {
      const temp = new TempDirectoryObject("test-vfile-parent-cap")

      cappedDirs.push(temp)

      const subdir = temp.getDirectory("data")
      const file = subdir.getFile("test.txt")

      assert.strictEqual(file.parent.cap, temp)
      assert.strictEqual(subdir.cap, temp)
    })
  })

  describe("async method - exists", () => {
    it("returns false for non-existent file", async () => {
      const temp = new TempDirectoryObject("test-vfile-exists-false")

      cappedDirs.push(temp)

      const file = temp.getFile("nonexistent.txt")

      assert.equal(await file.exists, false)
    })

    it("returns true for existing file", async () => {
      const temp = new TempDirectoryObject("test-vfile-exists-true")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("content")

      assert.equal(await file.exists, true)
    })

    it("checks real filesystem path", async () => {
      const temp = new TempDirectoryObject("test-vfile-exists-real")

      cappedDirs.push(temp)

      const file = temp.getFile("real-test.txt")

      // Write using real path
      await file.real.write("data")

      // Check using virtual file
      assert.equal(await file.exists, true)
    })
  })

  describe("async method - read()", () => {
    it("reads file content", async () => {
      const temp = new TempDirectoryObject("test-vfile-read")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("Hello World")

      const content = await file.read()

      assert.equal(content, "Hello World")
    })

    it("throws for non-existent file", async () => {
      const temp = new TempDirectoryObject("test-vfile-read-missing")

      cappedDirs.push(temp)

      const file = temp.getFile("missing.txt")

      await assert.rejects(
        () => file.read(),
        error => {
          assert.ok(error instanceof Sass)
          return true
        }
      )
    })

    it("reads from real filesystem path", async () => {
      const temp = new TempDirectoryObject("test-vfile-read-real")

      cappedDirs.push(temp)

      const file = temp.getFile("data.txt")

      await file.write("test data")

      const content = await file.read()

      assert.equal(content, "test data")
    })

    it("supports custom encoding", async () => {
      const temp = new TempDirectoryObject("test-vfile-encoding")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("test", "utf8")

      const content = await file.read("utf8")

      assert.equal(content, "test")
    })
  })

  describe("async method - write()", () => {
    it("writes file content", async () => {
      const temp = new TempDirectoryObject("test-vfile-write")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("Hello VFileObject")

      assert.equal(await file.exists, true)

      const content = await file.read()

      assert.equal(content, "Hello VFileObject")
    })

    it("writes to real filesystem path", async () => {
      const temp = new TempDirectoryObject("test-vfile-write-real")

      cappedDirs.push(temp)

      const file = temp.getFile("output.txt")

      await file.write("output data")

      // Verify using real path
      const realContent = await file.real.read()

      assert.equal(realContent, "output data")
    })

    it("overwrites existing content", async () => {
      const temp = new TempDirectoryObject("test-vfile-overwrite")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("first")
      await file.write("second")

      const content = await file.read()

      assert.equal(content, "second")
    })

    it("supports custom encoding", async () => {
      const temp = new TempDirectoryObject("test-vfile-write-encoding")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("test data", "utf8")

      const content = await file.read()

      assert.equal(content, "test data")
    })
  })

  describe("async method - readBinary()", () => {
    it("reads binary data as Buffer", async () => {
      const temp = new TempDirectoryObject("test-vfile-readbinary")

      cappedDirs.push(temp)

      const file = temp.getFile("data.bin")
      const testData = Buffer.from([0x01, 0x02, 0x03, 0x04])

      await file.writeBinary(testData)

      const result = await file.readBinary()

      assert.ok(Buffer.isBuffer(result))
      assert.deepEqual(result, testData)
    })

    it("throws for non-existent file", async () => {
      const temp = new TempDirectoryObject("test-vfile-readbinary-missing")

      cappedDirs.push(temp)

      const file = temp.getFile("missing.bin")

      await assert.rejects(
        () => file.readBinary(),
        error => {
          assert.ok(error instanceof Sass)
          return true
        }
      )
    })
  })

  describe("async method - writeBinary()", () => {
    it("writes binary data from Buffer", async () => {
      const temp = new TempDirectoryObject("test-vfile-writebinary")

      cappedDirs.push(temp)

      const file = temp.getFile("data.bin")
      const testData = Buffer.from([0xFF, 0xFE, 0xFD])

      await file.writeBinary(testData)

      const result = await file.readBinary()

      assert.deepEqual(result, testData)
    })

    it("writes binary data from ArrayBuffer", async () => {
      const temp = new TempDirectoryObject("test-vfile-writebinary-ab")

      cappedDirs.push(temp)

      const file = temp.getFile("data.bin")
      const arrayBuffer = new Uint8Array([0x10, 0x20, 0x30]).buffer

      await file.writeBinary(arrayBuffer)

      const result = await file.readBinary()

      assert.deepEqual(result, Buffer.from([0x10, 0x20, 0x30]))
    })
  })

  describe("async method - loadData()", () => {
    it("loads JSON data", async () => {
      const temp = new TempDirectoryObject("test-vfile-loaddata-json")

      cappedDirs.push(temp)

      const file = temp.getFile("config.json")
      const data = {name: "test", value: 42}

      await file.write(JSON.stringify(data))

      const loaded = await file.loadData("json")

      assert.deepEqual(loaded, data)
    })

    it("loads JSON5 data", async () => {
      const temp = new TempDirectoryObject("test-vfile-loaddata-json5")

      cappedDirs.push(temp)

      const file = temp.getFile("config.json5")

      await file.write("{name: 'test', value: 42}")

      const loaded = await file.loadData("json5")

      assert.equal(loaded.name, "test")
      assert.equal(loaded.value, 42)
    })

    it("loads YAML data", async () => {
      const temp = new TempDirectoryObject("test-vfile-loaddata-yaml")

      cappedDirs.push(temp)

      const file = temp.getFile("config.yaml")

      await file.write("name: test\nvalue: 42")

      const loaded = await file.loadData("yaml")

      assert.equal(loaded.name, "test")
      assert.equal(loaded.value, 42)
    })

    it("auto-detects format with 'any' type", async () => {
      const temp = new TempDirectoryObject("test-vfile-loaddata-any")

      cappedDirs.push(temp)

      const file = temp.getFile("data.txt")

      await file.write("{\"key\": \"value\"}")

      const loaded = await file.loadData("any")

      assert.equal(loaded.key, "value")
    })
  })

  describe("async method - delete()", () => {
    it("deletes existing file", async () => {
      const temp = new TempDirectoryObject("test-vfile-delete")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("delete me")

      assert.equal(await file.exists, true)

      await file.delete()

      assert.equal(await file.exists, false)
    })

    it("throws for non-existent file", async () => {
      const temp = new TempDirectoryObject("test-vfile-delete-missing")

      cappedDirs.push(temp)

      const file = temp.getFile("missing.txt")

      await assert.rejects(
        () => file.delete(),
        error => {
          assert.ok(error instanceof Sass)
          return true
        }
      )
    })

    it("deletes from real filesystem path", async () => {
      const temp = new TempDirectoryObject("test-vfile-delete-real")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("content")

      await file.delete()

      assert.equal(await file.real.exists, false)
    })
  })

  describe("async method - canRead()", () => {
    it("returns true for readable file", async () => {
      const temp = new TempDirectoryObject("test-vfile-canread")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("content")

      assert.equal(await file.canRead(), true)
    })

    it("returns false for non-existent file", async () => {
      const temp = new TempDirectoryObject("test-vfile-canread-missing")

      cappedDirs.push(temp)

      const file = temp.getFile("missing.txt")

      assert.equal(await file.canRead(), false)
    })
  })

  describe("async method - canWrite()", () => {
    it("returns true for writable file", async () => {
      const temp = new TempDirectoryObject("test-vfile-canwrite")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("content")

      assert.equal(await file.canWrite(), true)
    })

    it("returns false for non-existent file", async () => {
      const temp = new TempDirectoryObject("test-vfile-canwrite-missing")

      cappedDirs.push(temp)

      const file = temp.getFile("missing.txt")

      assert.equal(await file.canWrite(), false)
    })
  })

  describe("async method - size()", () => {
    it("returns file size", async () => {
      const temp = new TempDirectoryObject("test-vfile-size")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")
      const content = "Hello World"

      await file.write(content)

      const size = await file.size()

      assert.equal(size, Buffer.byteLength(content))
    })

    it("returns null for non-existent file", async () => {
      const temp = new TempDirectoryObject("test-vfile-size-missing")

      cappedDirs.push(temp)

      const file = temp.getFile("missing.txt")

      assert.equal(await file.size(), null)
    })
  })

  describe("async method - modified()", () => {
    it("returns modification time", async () => {
      const temp = new TempDirectoryObject("test-vfile-modified")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      await file.write("content")

      const mtime = await file.modified()

      assert.ok(mtime instanceof Date)
    })

    it("returns null for non-existent file", async () => {
      const temp = new TempDirectoryObject("test-vfile-modified-missing")

      cappedDirs.push(temp)

      const file = temp.getFile("missing.txt")

      assert.equal(await file.modified(), null)
    })
  })

  describe("inherited properties", () => {
    it("has all FileObject properties", () => {
      const temp = new TempDirectoryObject("test-vfile-props")

      cappedDirs.push(temp)

      const file = temp.getFile("test.js")

      assert.equal(file.name, "test.js")
      assert.equal(file.module, "test")
      assert.equal(file.extension, ".js")
      assert.equal(file.isFile, true)
      assert.ok(file.url)
      assert.ok(file.path)
      assert.ok(file.parent)
    })

    it("toString shows virtual and real paths", () => {
      const temp = new TempDirectoryObject("test-vfile-tostring")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")
      const str = file.toString()

      assert.ok(str.includes("VFileObject"))
      assert.ok(str.includes("→"))
    })
  })

  describe("integration with VDirectoryObject", () => {
    it("files from getFile() are VFileObject instances", () => {
      const temp = new TempDirectoryObject("test-vfile-integration")

      cappedDirs.push(temp)

      const file = temp.getFile("test.txt")

      assert.ok(file instanceof VFileObject)
      assert.ok(file instanceof FileObject)
    })

    it("works with nested directory structure", async () => {
      const temp = new TempDirectoryObject("test-vfile-nested-int")

      cappedDirs.push(temp)

      const level1 = temp.getDirectory("l1")
      const level2 = level1.getDirectory("l2")
      const file = level2.getFile("deep.txt")

      await file.write("deep content")

      assert.ok(file instanceof VFileObject)
      assert.equal(await file.exists, true)

      const content = await file.read()

      assert.equal(content, "deep content")
    })

    it("file parent chain maintains cap", () => {
      const temp = new TempDirectoryObject("test-vfile-cap-chain")

      cappedDirs.push(temp)

      const subdir = temp.getDirectory("data")
      const file = subdir.getFile("config.json")

      assert.strictEqual(file.parent.cap, temp)
    })
  })

  describe("edge cases", () => {
    it("handles special characters in filename", async () => {
      const temp = new TempDirectoryObject("test-vfile-special")

      cappedDirs.push(temp)

      const file = temp.getFile("test-file_$&.txt")

      await file.write("content")

      assert.equal(await file.exists, true)
    })

    it("handles unicode in filename", async () => {
      const temp = new TempDirectoryObject("test-vfile-unicode")

      cappedDirs.push(temp)

      const file = temp.getFile("测试.txt")

      await file.write("unicode content")

      assert.equal(await file.exists, true)

      const content = await file.read()

      assert.equal(content, "unicode content")
    })

    it("handles empty file", async () => {
      const temp = new TempDirectoryObject("test-vfile-empty")

      cappedDirs.push(temp)

      const file = temp.getFile("empty.txt")

      await file.write("")

      assert.equal(await file.exists, true)

      const content = await file.read()

      assert.equal(content, "")

      const size = await file.size()

      assert.equal(size, 0)
    })
  })
})
