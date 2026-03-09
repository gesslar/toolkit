import {watch} from "node:fs/promises"
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
      const watcher = watch(target.url, {
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

            if(state.busy) {
              state.pending = true
              continue
            }

            state.pending = false
            state.busy = true

            while(true) {
              await Time.after(debounceMs)

              if(state.pending) {
                state.pending = false
                continue
              }

              break
            }

            try {
              await onChange(target)
            } catch(callbackErr) {
              console.error("Watcher onChange callback error:", callbackErr)
            }
            state.busy = false
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
   * Stop watching all targets.
   */
  stopWatching() {
    this.#state.clear()
    this.#abortController?.abort()
    this.#abortController = null
  }
}
