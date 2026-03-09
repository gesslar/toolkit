#!/usr/bin/env node

import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import {after,before,describe,it} from "node:test"

import {FileObject, DirectoryObject, Watcher, OverFlowBehaviour} from "../../src/node/index.js"
import {TestUtils} from "../helpers/test-utils.js"

describe("Watcher", () => {
  let testDir
  let watcher

  before(async() => {
    testDir = await TestUtils.createTestDir("test-watcher")
  })

  after(async() => {
    watcher?.stopWatching()
    await TestUtils.cleanupTestDir(testDir)
  })

  describe("OverFlowBehaviour", () => {
    it("has IGNORE and THROW values", () => {
      assert.equal(OverFlowBehaviour.IGNORE, "ignore")
      assert.equal(OverFlowBehaviour.THROW, "throw")
    })

    it("is frozen", () => {
      assert.ok(Object.isFrozen(OverFlowBehaviour))
    })
  })

  describe("watch()", () => {
    it("detects file changes", async() => {
      const filePath = path.join(testDir, "watch-test.txt")
      await fs.writeFile(filePath, "initial", "utf8")

      const file = new FileObject(filePath)
      watcher = new Watcher()

      let changed = false
      const changePromise = new Promise(resolve => {
        watcher.watch(file, {
          onChange: () => {
            changed = true
            resolve()
          },
          debounceMs: 10,
          persistent: false,
        })
      })

      // Give the watcher time to start
      await TestUtils.sleep(50)
      await fs.writeFile(filePath, "modified", "utf8")

      await Promise.race([
        changePromise,
        TestUtils.sleep(2000).then(() => {
          throw new Error("Timed out waiting for change event")
        }),
      ])

      assert.ok(changed, "onChange should have been called")
      watcher.stopWatching()
    })

    it("detects directory changes", async() => {
      const dir = new DirectoryObject(testDir)
      watcher = new Watcher()

      let changed = false
      const changePromise = new Promise(resolve => {
        watcher.watch(dir, {
          onChange: () => {
            changed = true
            resolve()
          },
          debounceMs: 10,
          persistent: false,
        })
      })

      await TestUtils.sleep(50)
      await fs.writeFile(path.join(testDir, "new-file.txt"), "hello", "utf8")

      await Promise.race([
        changePromise,
        TestUtils.sleep(2000).then(() => {
          throw new Error("Timed out waiting for change event")
        }),
      ])

      assert.ok(changed, "onChange should have been called")
      watcher.stopWatching()
    })

    it("accepts an array of targets", async() => {
      const file1Path = path.join(testDir, "multi-1.txt")
      const file2Path = path.join(testDir, "multi-2.txt")
      await fs.writeFile(file1Path, "one", "utf8")
      await fs.writeFile(file2Path, "two", "utf8")

      const file1 = new FileObject(file1Path)
      const file2 = new FileObject(file2Path)
      watcher = new Watcher()

      const changedTargets = []
      const changePromise = new Promise(resolve => {
        watcher.watch([file1, file2], {
          onChange: target => {
            changedTargets.push(target)
            resolve()
          },
          debounceMs: 10,
          persistent: false,
        })
      })

      await TestUtils.sleep(50)
      await fs.writeFile(file1Path, "one-modified", "utf8")

      await Promise.race([
        changePromise,
        TestUtils.sleep(2000).then(() => {
          throw new Error("Timed out waiting for change event")
        }),
      ])

      assert.ok(changedTargets.length > 0, "should have received at least one change")
      watcher.stopWatching()
    })

    it("debounces rapid changes", async() => {
      const filePath = path.join(testDir, "debounce-test.txt")
      await fs.writeFile(filePath, "initial", "utf8")

      const file = new FileObject(filePath)
      watcher = new Watcher()

      let callCount = 0
      watcher.watch(file, {
        onChange: () => {
          callCount++
        },
        debounceMs: 100,
        persistent: false,
      })

      await TestUtils.sleep(50)

      // Rapid-fire writes
      for(let i = 0; i < 5; i++) {
        await fs.writeFile(filePath, `change-${i}`, "utf8")
        await TestUtils.sleep(10)
      }

      // Wait for debounce to settle
      await TestUtils.sleep(300)

      // Should have been called fewer times than the number of writes
      assert.ok(callCount < 5, `Expected fewer than 5 calls due to debounce, got ${callCount}`)
      assert.ok(callCount >= 1, "Expected at least 1 call")
      watcher.stopWatching()
    })

    it("rejects invalid targets", async() => {
      watcher = new Watcher()

      await assert.rejects(
        () => watcher.watch("not-a-file", {onChange: () => {}}),
        /expected/i,
      )
    })

    it("rejects missing onChange", async() => {
      const filePath = path.join(testDir, "no-callback.txt")
      await fs.writeFile(filePath, "test", "utf8")

      const file = new FileObject(filePath)
      watcher = new Watcher()

      await assert.rejects(
        () => watcher.watch(file, {}),
        /expected/i,
      )
    })

    it("rejects invalid overflow value", async() => {
      const filePath = path.join(testDir, "overflow-test.txt")
      await fs.writeFile(filePath, "test", "utf8")

      const file = new FileObject(filePath)
      watcher = new Watcher()

      await assert.rejects(
        () => watcher.watch(file, {onChange: () => {}, overflow: "invalid"}),
        /overflow/i,
      )
    })
  })

  describe("stopWatching()", () => {
    it("stops without error when not watching", () => {
      const w = new Watcher()
      assert.doesNotThrow(() => w.stopWatching())
    })

    it("stops an active watcher", async() => {
      const filePath = path.join(testDir, "stop-test.txt")
      await fs.writeFile(filePath, "initial", "utf8")

      const file = new FileObject(filePath)
      const w = new Watcher()

      let callCount = 0
      w.watch(file, {
        onChange: () => {
          callCount++
        },
        debounceMs: 10,
        persistent: false,
      })

      await TestUtils.sleep(50)
      w.stopWatching()

      // Write after stopping — should not trigger callback
      await fs.writeFile(filePath, "after-stop", "utf8")
      await TestUtils.sleep(100)

      assert.equal(callCount, 0, "onChange should not fire after stopWatching")
    })
  })

  describe("FileSystem integration", () => {
    it("watch() and stopWatching() work on FileObject", async() => {
      const filePath = path.join(testDir, "fs-integration.txt")
      await fs.writeFile(filePath, "initial", "utf8")

      const file = new FileObject(filePath)

      let changed = false
      const changePromise = new Promise(resolve => {
        file.watch({
          onChange: () => {
            changed = true
            resolve()
          },
          debounceMs: 10,
          persistent: false,
        })
      })

      await TestUtils.sleep(50)
      await fs.writeFile(filePath, "modified", "utf8")

      await Promise.race([
        changePromise,
        TestUtils.sleep(2000).then(() => {
          throw new Error("Timed out waiting for change event")
        }),
      ])

      assert.ok(changed)
      file.stopWatching()
    })

    it("watch() and stopWatching() work on DirectoryObject", async() => {
      const dir = new DirectoryObject(testDir)

      let changed = false
      const changePromise = new Promise(resolve => {
        dir.watch({
          onChange: () => {
            changed = true
            resolve()
          },
          debounceMs: 10,
          persistent: false,
        })
      })

      await TestUtils.sleep(50)
      await fs.writeFile(path.join(testDir, "dir-integration.txt"), "hello", "utf8")

      await Promise.race([
        changePromise,
        TestUtils.sleep(2000).then(() => {
          throw new Error("Timed out waiting for change event")
        }),
      ])

      assert.ok(changed)
      dir.stopWatching()
    })
  })
})
