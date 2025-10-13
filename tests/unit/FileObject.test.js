import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import {afterEach,beforeEach,describe,it} from "node:test"

import {DirectoryObject,FileObject,Sass} from "../../src/index.js"
import {TestUtils} from "../helpers/test-utils.js"

describe("FileObject", () => {
  let testDir

  describe("constructor and basic properties", () => {
    it("creates FileObject with absolute path", () => {
      const file = new FileObject("/home/user/test.txt")

      assert.ok(file instanceof FileObject)
      assert.equal(typeof file.supplied, "string")
      assert.equal(typeof file.path, "string")
      assert.equal(typeof file.uri, "string")
      assert.equal(typeof file.name, "string")
      assert.equal(file.name, "test.txt")
      assert.equal(file.extension, ".txt")
      assert.equal(file.module, "test")
    })

    it("creates FileObject with relative path", () => {
      const file = new FileObject("../test.js")

      assert.ok(path.isAbsolute(file.path))
      assert.equal(file.supplied, "../test.js")
      assert.equal(file.name, "test.js")
      assert.equal(file.extension, ".js")
      assert.equal(file.module, "test")
    })

    it("creates FileObject with directory parameter as string", () => {
      const file = new FileObject("test.txt", "/home/user")

      assert.ok(file.path.includes("/home/user"))
      assert.equal(file.name, "test.txt")
      assert.ok(file.directory instanceof DirectoryObject)
    })

    it("creates FileObject with directory parameter as DirectoryObject", () => {
      const dir = new DirectoryObject("/home/user")
      const file = new FileObject("test.txt", dir)

      assert.ok(file.path.includes("/home/user"))
      assert.equal(file.name, "test.txt")
      assert.ok(file.directory instanceof DirectoryObject)
    })

    it("handles file without extension", () => {
      const file = new FileObject("/home/user/README")

      assert.equal(file.name, "README")
      assert.equal(file.extension, "")
      assert.equal(file.module, "README")
    })

    it("handles complex file extensions", () => {
      const file = new FileObject("/home/user/archive.tar.gz")

      assert.equal(file.name, "archive.tar.gz")
      assert.equal(file.extension, ".gz")  // path.parse only gets last extension
      assert.equal(file.module, "archive.tar")
    })

    it("fixes slashes in paths", () => {
      const file = new FileObject("path\\\\with\\\\backslashes\\\\file.txt")

      assert.ok(!file.supplied.includes("\\\\"))
      assert.ok(file.supplied.includes("/"))
    })
  })

  describe("getters", () => {
    let testFile

    beforeEach(() => {
      testFile = new FileObject("/home/user/projects/myapp/index.js")
    })

    it("supplied returns original path", () => {
      const file = new FileObject("../test.js")
      assert.equal(file.supplied, "../test.js")
    })

    it("path returns absolute path", () => {
      assert.ok(path.isAbsolute(testFile.path))
    })

    it("uri returns file URI", () => {
      assert.ok(testFile.uri.startsWith("file://"))
    })

    it("name returns file name with extension", () => {
      assert.equal(testFile.name, "index.js")
    })

    it("module returns file name without extension", () => {
      assert.equal(testFile.module, "index")
    })

    it("extension returns file extension", () => {
      assert.equal(testFile.extension, ".js")
    })

    it("isFile returns true", () => {
      assert.equal(testFile.isFile, true)
    })

    it("isDirectory returns false", () => {
      assert.equal(testFile.isDirectory, false)
    })

    it("directory returns DirectoryObject", () => {
      assert.ok(testFile.directory instanceof DirectoryObject)
      assert.ok(testFile.directory.path.includes("myapp"))
    })
  })

  describe("string representations", () => {
    it("toString returns formatted string", () => {
      const file = new FileObject("/test/path/file.txt")
      const str = file.toString()

      assert.ok(str.includes("FileObject"))
      assert.ok(str.includes(file.path))
    })

    it("toJSON returns object representation", () => {
      const file = new FileObject("/test/path/file.txt")
      const json = file.toJSON()

      assert.equal(typeof json, "object")
      assert.ok("supplied" in json)
      assert.ok("path" in json)
      assert.ok("uri" in json)
      assert.ok("name" in json)
      assert.ok("module" in json)
      assert.ok("extension" in json)
      assert.ok("isFile" in json)
      assert.ok("isDirectory" in json)
      assert.ok("directory" in json)

      assert.equal(json.isFile, true)
      assert.equal(json.isDirectory, false)
    })
  })

  describe("file existence and permissions", () => {
    let existingFile, nonExistentFile, testFilePath

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("file-obj-test")
      testFilePath = path.join(testDir, "test.txt")
      await fs.writeFile(testFilePath, "test content")

      existingFile = new FileObject(testFilePath)
      nonExistentFile = new FileObject(path.join(testDir, "nonexistent.txt"))
    })

    afterEach(async () => {
      if (testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("exists returns true for existing file", async () => {
      const exists = await existingFile.exists
      assert.equal(exists, true)
    })

    it("exists returns false for non-existent file", async () => {
      const exists = await nonExistentFile.exists
      assert.equal(exists, false)
    })

    it("exists is a Promise", () => {
      const existsPromise = existingFile.exists
      assert.ok(existsPromise instanceof Promise)
    })

    it("canRead returns true for readable file", async () => {
      const canRead = await existingFile.canRead()
      assert.equal(canRead, true)
    })

    it("canRead returns false for non-existent file", async () => {
      const canRead = await nonExistentFile.canRead()
      assert.equal(canRead, false)
    })

    it("canWrite returns true for writable file", async () => {
      const canWrite = await existingFile.canWrite()
      assert.equal(canWrite, true)
    })

    it("canWrite returns false for non-existent file", async () => {
      const canWrite = await nonExistentFile.canWrite()
      assert.equal(canWrite, false)
    })

    it("size returns file size for existing file", async () => {
      const size = await existingFile.size()
      assert.equal(typeof size, "number")
      assert.ok(size > 0)
    })

    it("size returns null for non-existent file", async () => {
      const size = await nonExistentFile.size()
      assert.equal(size, null)
    })

    it("modified returns Date for existing file", async () => {
      const modified = await existingFile.modified()
      assert.ok(modified instanceof Date)
    })

    it("modified returns null for non-existent file", async () => {
      const modified = await nonExistentFile.modified()
      assert.equal(modified, null)
    })
  })

  describe("file I/O operations", () => {
    let testFile, testFilePath

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("file-io-test")
      testFilePath = path.join(testDir, "test.txt")
      testFile = new FileObject(testFilePath)
    })

    afterEach(async () => {
      if (testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("write creates file with content", async () => {
      await testFile.write("Hello, world!")

      const exists = await testFile.exists
      assert.equal(exists, true)

      const content = await fs.readFile(testFilePath, "utf8")
      assert.equal(content, "Hello, world!")
    })

    it("read returns file content", async () => {
      await fs.writeFile(testFilePath, "test content")

      const content = await testFile.read()
      assert.equal(content, "test content")
    })

    it("read with custom encoding", async () => {
      await fs.writeFile(testFilePath, "test content", "utf8")

      const content = await testFile.read("utf8")
      assert.equal(content, "test content")
    })

    it("read throws for non-existent file", async () => {
      const nonExistentFile = new FileObject(path.join(testDir, "missing.txt"))

      await assert.rejects(
        () => nonExistentFile.read(),
        Sass
      )
    })

    it("write with custom encoding", async () => {
      await testFile.write("test content", "utf8")

      const content = await fs.readFile(testFilePath, "utf8")
      assert.equal(content, "test content")
    })
  })

  describe("import()", () => {
    let moduleDir

    beforeEach(async () => {
      moduleDir = await TestUtils.createTestDir("file-import-test")
    })

    afterEach(async () => {
      if(moduleDir) {
        await TestUtils.cleanupTestDir(moduleDir)
      }
    })

    it("imports ESM module using file URI", async () => {
      const modulePath = path.join(moduleDir, "sample-module.js")
      const moduleSource = [
        "export const answer = 42",
        "export default function greet(name) {",
        "  return `hello ${name}`",
        "}"
      ].join("\n")

      await fs.writeFile(modulePath, moduleSource, "utf8")

      const file = new FileObject(modulePath)
      const moduleNamespace = await file.import()

      assert.equal(moduleNamespace.answer, 42)
      assert.equal(moduleNamespace.default("world"), "hello world")
    })

    it("throws Sass error when module is missing", async () => {
      const missingPath = path.join(moduleDir, "missing-module.js")
      const file = new FileObject(missingPath)

      await assert.rejects(
        () => file.import(),
        Sass
      )
    })
  })

  describe("loadData method", () => {
    let jsonFile, yamlFile, invalidFile

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("file-data-test")

      // Create JSON file
      const jsonPath = path.join(testDir, "test.json")
      await fs.writeFile(jsonPath, JSON.stringify({ name: "test", value: 42 }))
      jsonFile = new FileObject(jsonPath)

      // Create YAML file
      const yamlPath = path.join(testDir, "test.yaml")
      await fs.writeFile(yamlPath, "name: test\nvalue: 42\n")
      yamlFile = new FileObject(yamlPath)

      // Create invalid file
      const invalidPath = path.join(testDir, "invalid.txt")
      await fs.writeFile(invalidPath, "this is not json or yaml")
      invalidFile = new FileObject(invalidPath)
    })

    afterEach(async () => {
      if (testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("loads JSON data", async () => {
      const data = await jsonFile.loadData("json")

      assert.equal(typeof data, "object")
      assert.equal(data.name, "test")
      assert.equal(data.value, 42)
    })

    it("loads YAML data", async () => {
      const data = await yamlFile.loadData("yaml")

      assert.equal(typeof data, "object")
      assert.equal(data.name, "test")
      assert.equal(data.value, 42)
    })

    it("loads data with 'any' type (auto-detect)", async () => {
      const jsonData = await jsonFile.loadData("any")
      const yamlData = await yamlFile.loadData("any")

      assert.equal(jsonData.name, "test")
      assert.equal(yamlData.name, "test")
    })

    it("throws for invalid data", async () => {
      await assert.rejects(
        () => invalidFile.loadData("json"),
        Sass
      )
    })

    it("throws for unsupported type", async () => {
      await assert.rejects(
        () => jsonFile.loadData("xml"),
        /Unsupported data type 'xml'/
      )
    })
  })

  describe("edge cases and error handling", () => {
    it("handles special characters in filename", () => {
      const file = new FileObject("/test/file with spaces & symbols!.txt")

      assert.ok(file.name.includes("spaces"))
      assert.ok(file.name.includes("symbols"))
    })

    it("handles very long paths", () => {
      const longPath = "/test/" + "a".repeat(200) + "/file.txt"
      const file = new FileObject(longPath)

      assert.ok(file.path.includes("a".repeat(200)))
    })

    it("meta object is frozen", () => {
      const file = new FileObject("/test/file.txt")

      // Should not be able to modify internal meta
      assert.throws(() => {
        file.supplied = "modified"  // This should fail
      }, TypeError)
    })

    it("validates filename in constructor", () => {
      assert.throws(() => {
        new FileObject("")  // Empty filename
      }, Sass)

      assert.throws(() => {
        new FileObject(null)  // Null filename
      }, Sass)
    })

    it("resolves relative paths to absolute paths", () => {
      const file = new FileObject("tests/fixtures/settings.json")

      // Path should be absolute
      assert.ok(path.isAbsolute(file.path),
        `Expected absolute path, got: ${file.path}`)

      // Should start with root directory
      assert.ok(file.path.startsWith('/'),
        `Path should start with /, got: ${file.path}`)
    })

    it("resolves relative paths with ./ prefix correctly", () => {
      const file = new FileObject("./tests/fixtures/settings.json")

      // Path should be absolute
      assert.ok(path.isAbsolute(file.path),
        `Expected absolute path, got: ${file.path}`)

      // Should not have duplicated path segments
      assert.ok(!file.path.includes('tests/fixtures/tests/fixtures'),
        `Path has duplicate segments: ${file.path}`)
    })

    it("handles directory parameter correctly", () => {
      const file1 = new FileObject('settings.json', 'tests/fixtures')
      const file2 = new FileObject('settings.json', path.join(process.cwd(), 'tests/fixtures'))

      // Both should resolve to absolute paths
      assert.ok(path.isAbsolute(file1.path))
      assert.ok(path.isAbsolute(file2.path))

      // Should end with the same filename
      assert.ok(file1.path.endsWith('settings.json'))
      assert.ok(file2.path.endsWith('settings.json'))

      // Should contain fixtures in the path
      assert.ok(file1.path.includes('fixtures'))
      assert.ok(file2.path.includes('fixtures'))
    })

    it("preserves supplied path exactly as provided", () => {
      const testCases = [
        'simple.json',
        './relative.json',
        'nested/path/file.json',
        '../parent.json'
      ]

      testCases.forEach(inputPath => {
        const file = new FileObject(inputPath)
        assert.equal(file.supplied, inputPath,
          `Supplied path should be preserved exactly: ${inputPath} != ${file.supplied}`)
      })
    })

    it("resolves absolute paths unchanged", () => {
      const absolutePath = path.join(process.cwd(), 'test.json')
      const file = new FileObject(absolutePath)

      assert.equal(file.path, absolutePath)
      assert.ok(path.isAbsolute(file.path))
    })
  })

  describe("write method", () => {
    let testDir

    beforeEach(async () => {
      testDir = await TestUtils.createTestDir("fileobject-write-test")
    })

    afterEach(async () => {
      if(testDir) {
        await TestUtils.cleanupTestDir(testDir)
      }
    })

    it("writes content to a file successfully", async () => {
      const filePath = path.join(testDir, "test.txt")
      const file = new FileObject(filePath)
      const content = "Hello, World!"

      await file.write(content)

      assert.equal(await file.exists, true)
      const readContent = await file.read()
      assert.equal(readContent, content)
    })

    it("writes content with different encoding", async () => {
      const filePath = path.join(testDir, "test-utf16.txt")
      const file = new FileObject(filePath)
      const content = "Hello with encoding!"

      await file.write(content, "utf16le")

      assert.equal(await file.exists, true)
      const readContent = await file.read("utf16le")
      assert.equal(readContent, content)
    })

    it("overwrites existing file content", async () => {
      const filePath = path.join(testDir, "overwrite.txt")
      const file = new FileObject(filePath)

      await file.write("First content")
      assert.equal(await file.read(), "First content")

      await file.write("Second content")
      assert.equal(await file.read(), "Second content")
    })

    it("throws error when parent directory doesn't exist", async () => {
      const filePath = path.join(testDir, "nonexistent", "subdir", "test.txt")
      const file = new FileObject(filePath)

      await assert.rejects(
        () => file.write("content"),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Invalid directory/)
          return true
        }
      )
    })

    it("writes empty string successfully", async () => {
      const filePath = path.join(testDir, "empty.txt")
      const file = new FileObject(filePath)

      await file.write("")

      assert.equal(await file.exists, true)
      assert.equal(await file.read(), "")
    })

    it("writes large content successfully", async () => {
      const filePath = path.join(testDir, "large.txt")
      const file = new FileObject(filePath)
      const largeContent = "x".repeat(10000)

      await file.write(largeContent)

      const readContent = await file.read()
      assert.equal(readContent.length, 10000)
      assert.equal(readContent, largeContent)
    })

    it("validates directory exists before writing", async () => {
      const filePath = path.join(testDir, "test.txt")
      const file = new FileObject(filePath)

      // Directory exists, should succeed
      assert.equal(await file.directory.exists, true)
      await file.write("content")

      assert.equal(await file.exists, true)
    })

    it("handles special characters in content", async () => {
      const filePath = path.join(testDir, "special.txt")
      const file = new FileObject(filePath)
      const specialContent = "Special: 你好 🎉 \n\t\r\"'`"

      await file.write(specialContent)

      const readContent = await file.read()
      assert.equal(readContent, specialContent)
    })

    it("throws Sass error with trace context", async () => {
      const filePath = path.join(testDir, "bad", "path", "file.txt")
      const file = new FileObject(filePath)

      try {
        await file.write("content")
        assert.fail("Should have thrown")
      } catch(error) {
        assert.ok(error instanceof Sass)
        assert.match(error.message, /Invalid directory/)
      }
    })
  })

  describe("loadData method", () => {
    it("loads JSON5 data successfully", async () => {
      const file = new FileObject("tests/fixtures/config-lpc-to-markdown.json5")
      const data = await file.loadData("json5")

      assert.ok(data)
      assert.equal(typeof data, "object")
    })

    it("loads JSON data successfully", async () => {
      const file = new FileObject("tests/fixtures/settings.json")
      const data = await file.loadData("json")

      assert.ok(data)
      assert.equal(typeof data, "object")
    })

    it("loads YAML data successfully", async () => {
      const file = new FileObject("tests/fixtures/colors.yaml")
      const data = await file.loadData("yaml")

      assert.ok(data)
      assert.equal(typeof data, "object")
    })

    it("auto-detects JSON5 format with 'any' type", async () => {
      const file = new FileObject("tests/fixtures/config-lpc-to-markdown.json5")
      const data = await file.loadData("any")

      assert.ok(data)
      assert.equal(typeof data, "object")
    })

    it("auto-detects YAML format with 'any' type", async () => {
      const file = new FileObject("tests/fixtures/colors.yaml")
      const data = await file.loadData("any")

      assert.ok(data)
      assert.equal(typeof data, "object")
    })

    it("uses toLowerCase for type normalization (not toLocaleLowerCase)", async () => {
      const file = new FileObject("tests/fixtures/settings.json")

      // These should work regardless of locale
      const data1 = await file.loadData("JSON")
      const data2 = await file.loadData("Json")
      const data3 = await file.loadData("json")

      assert.ok(data1)
      assert.ok(data2)
      assert.ok(data3)
    })

    it("handles different encoding", async () => {
      const file = new FileObject("tests/fixtures/settings.json")
      const data = await file.loadData("json", "utf8")

      assert.ok(data)
      assert.equal(typeof data, "object")
    })

    it("throws Sass error for unsupported type", async () => {
      const file = new FileObject("tests/fixtures/settings.json")

      await assert.rejects(
        () => file.loadData("xml"),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Unsupported data type 'xml'/)
          return true
        }
      )
    })

    it("throws Sass error for invalid JSON5", async () => {
      const file = new FileObject("tests/fixtures/broken.json5")

      await assert.rejects(
        () => file.loadData("json5"),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Content is neither valid JSON5 nor valid YAML/)
          return true
        }
      )
    })

    it("throws Sass error for invalid YAML", async () => {
      const file = new FileObject("tests/fixtures/broken.yaml")

      await assert.rejects(
        () => file.loadData("yaml"),
        (error) => {
          assert.ok(error instanceof Sass)
          assert.match(error.message, /Content is neither valid JSON5 nor valid YAML/)
          return true
        }
      )
    })

    it("falls back from JSON5 to YAML with 'any' type", async () => {
      const file = new FileObject("tests/fixtures/colors.yaml")

      // Should try JSON5 first, fail, then succeed with YAML
      const data = await file.loadData("any")

      assert.ok(data)
      assert.equal(typeof data, "object")
    })

    it("handles empty type parameter (defaults to 'any')", async () => {
      const file = new FileObject("tests/fixtures/settings.json")
      const data = await file.loadData()

      assert.ok(data)
      assert.equal(typeof data, "object")
    })

    it("type parameter is case-insensitive", async () => {
      const file = new FileObject("tests/fixtures/settings.json")

      const testCases = ["JSON5", "Json5", "json5", "JSON", "Json", "json"]

      for(const type of testCases) {
        const data = await file.loadData(type)
        assert.ok(data, `Failed for type: ${type}`)
      }
    })

    it("YAML type parameter variations work correctly", async () => {
      const file = new FileObject("tests/fixtures/colors.yaml")

      const testCases = ["YAML", "Yaml", "yaml", "YaML"]

      for(const type of testCases) {
        const data = await file.loadData(type)
        assert.ok(data, `Failed for type: ${type}`)
      }
    })
  })
})
