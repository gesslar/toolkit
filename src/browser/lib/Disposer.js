import Valid from "./Valid.js"

/**
 * Simple lifecycle helper that tracks disposer callbacks.
 * Register any teardown functions and call dispose() to run them in reverse.
 */
export class Disposer {
  #disposers = []

  /**
   * Registers a disposer callback to be executed when disposed.
   *
   * Accepts one or more callbacks (or a single array) and returns matching
   * unregisters. A single disposer returns a single unregister for
   * convenience.
   *
   * @param {...(() => void)|Array<() => void>} disposers - Cleanup callbacks.
   * @returns {(() => void)|Array<() => void>} Unregister function(s).
   */
  register(...disposers) {
    const normalized = this.#normalizeDisposers(disposers)
    const unregisters = normalized.map(
      disposer => this.#registerDisposer(disposer)
    )

    return unregisters.length === 1 ? unregisters[0] : unregisters
  }

  #registerDisposer(disposer) {
    if(typeof disposer !== "function")
      return () => {}

    this.#disposers.push(disposer)

    return () => this.#removeDisposer(disposer)
  }

  /**
   * Runs all registered disposers in reverse order.
   *
   * @returns {void}
   */
  dispose() {
    const errors = []
    this.#disposers.toReversed().forEach(disposer => {
      try {
        disposer()
      } catch(error) {
        errors.push(error)
      }
    })
    this.#disposers.length = 0

    if(errors.length > 0)
      throw new AggregateError(errors, "Errors occurred during disposal.")
  }

  #normalizeDisposers(disposers) {
    const normalized = (
      disposers.length === 1 && Array.isArray(disposers[0])
        ? disposers[0]
        : disposers
    )

    Valid.type(normalized, "Function[]")

    return normalized
  }

  /**
   * Read-only list of registered disposers.
   *
   * @returns {Array<() => void>} Snapshot of disposer callbacks.
   */
  get disposers() {
    return Object.freeze([...this.#disposers])
  }

  #removeDisposer(disposer) {
    const index = this.#disposers.indexOf(disposer)

    if(index >= 0)
      this.#disposers.splice(index, 1)
  }
}

export default new Disposer()
