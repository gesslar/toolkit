import {realpath, watch} from "node:fs/promises"
import Valid from "./Valid.js"
import Data from "./Data.js"
import Time from "../../browser/lib/Time.js"

/**
 * @import FileObject from "./FileObject.js"
 * @import DirectoryObject from "./DirectoryObject.js"
 */

export const OverFlowBehaviour = Object.freeze({
  IGNORE: "ignore",
  THROW: "throw",
})

export default class Watcher {
  #abortController
  #state = new Map()

  /**
   * Watch one or more file/directory targets for changes, invoking a callback
   * with debounce protection.
   *
   * @param {FileObject|DirectoryObject|Array.<(FileObject|DirectoryObject)>} targets - The target(s) to watch
   * @param {object} options - Watch options
   * @param {(target: FileObject|DirectoryObject) => void} options.onChange - Callback invoked on change
   * @param {number} [options.debounceMs=50] - Debounce interval in milliseconds
   * @param {boolean} [options.persistent=true] - Keep the process alive while watching
   * @param {boolean} [options.recursive=false] - Watch subdirectories (directories only)
   * @param {string} [options.overflow="ignore"] - Overflow behaviour ("ignore" or "throw")
   * @returns {Promise<undefined>}
   */
  async watch(targets, {
    onChange,
    debounceMs=50,
    persistent=true,
    recursive=false,
    overflow=OverFlowBehaviour.IGNORE
  } = {}) {
    Valid.type(targets, "FileObject|DirectoryObject|(FileObject|DirectoryObject)[]")
    Valid.type(onChange, "Function")
    Valid.type(debounceMs, "Number")
    Valid.type(persistent, "Boolean")
    Valid.type(recursive, "Undefined|Boolean")
    Valid.type(overflow, "String")
    Valid.assert(Object.values(OverFlowBehaviour).includes(overflow), `Overflow must be one of "ignore" or "throw".`)

    if(!Data.isType(targets, "Array")) {
      targets = [targets]
    }

    this.#abortController = new AbortController()

    for(const target of targets) {
      const watchPath = await realpath(target.path).catch(() => target.path)
      const watcher = watch(watchPath, {
        recursive: target.isDirectory ? recursive : false,
        persistent,
        signal: this.#abortController.signal,
        overflow
      })

      this.#state.set(target, {busy: false, pending: false})

      ;(async() => {
        try {
          for await(const _ of watcher) {
            const state = this.#state.get(target)

            if(!state) {
              return
            }

            state.pending = true

            if(!state.busy) {
              this.#settle(target, state, debounceMs, onChange)
            }
          }
        } catch(err) {
          if(err.name === "AbortError") {
            return
          }

          console.error("Watcher error:", err)
        }
      })()
    }
  }

  /**
   * Waits for a target's events to go quiet for `debounceMs`, then calls
   * `onChange` once. Events that arrive during the callback start another
   * round. Runs separately from the event loop so events keep draining
   * while it waits.
   *
   * @private
   * @param {FileObject|DirectoryObject} target - The watched target
   * @param {{busy: boolean, pending: boolean}} state - The target's state
   * @param {number} debounceMs - Quiet interval in milliseconds
   * @param {(target: FileObject|DirectoryObject) => void} onChange - Callback invoked on change
   * @returns {Promise<undefined>}
   */
  async #settle(target, state, debounceMs, onChange) {
    state.busy = true

    try {
      while(state.pending) {
        state.pending = false
        await Time.after(debounceMs)

        // More events arrived while waiting, so wait again
        if(state.pending)
          continue

        // Stopped (or re-watched) while waiting
        if(this.#state.get(target) !== state)
          return

        try {
          await onChange(target)
        } catch(callbackErr) {
          console.error("Watcher onChange callback error:", callbackErr)
        }
      }
    } finally {
      state.busy = false
    }
  }

  /**
   * Stop watching all targets.
   */
  stopWatching() {
    this.#state.clear()
    this.#abortController?.abort()
    this.#abortController = null
  }
}
