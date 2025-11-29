/**
 * Simple lifecycle helper that tracks disposer callbacks.
 * Register any teardown functions and call dispose() to run them in reverse.
 */
export class Disposable {
  #disposers = []
  #disposed = false

  /**
   * Registers a disposer callback to be executed when disposed.
   *
   * @param {() => void} disposer - Cleanup callback.
   * @returns {() => void} Function to unregister the disposer.
   */
  registerDisposer(disposer) {
    if(this.#disposed || typeof disposer !== "function")
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
    if(this.#disposed)
      return

    this.#disposed = true

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

  /**
   * Whether disposal has run.
   *
   * @returns {boolean} True when dispose() has already been called.
   */
  get disposed() {
    return this.#disposed
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

export default new Disposable()
