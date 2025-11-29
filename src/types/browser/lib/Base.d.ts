/**
 * Base helper for UI classes that want centralized event lifecycles.
 * Tracks listener disposer functions and registered DOM elements so subclasses
 * can easily tear down on removal.
 */
export default class Base extends Disposable {
    /**
     * Assigns an HTMLElement to this object.
     *
     * @throws {Error} If there is already one assigned.
     */
    set element(element: HTMLElement);
    /**
     * Returns the HTMLElement associated with this object.
     *
     * @returns {HTMLElement} The HTMLElement associated with this object.
     */
    get element(): HTMLElement;
    /**
     * Cleans up registered disposers and emits a removal event for subscribers.
     *
     * @returns {void}
     */
    remove(): void;
    /**
     * Registers a Notify listener and tracks its disposer for later cleanup.
     *
     * @param {string} eventName - Event to subscribe to.
     * @param {(evt: Event) => void} func - Handler to invoke.
     * @param {HTMLElement | Window} [element] - Target element; defaults to window.
     * @param {boolean | object} [options] - addEventListener options.
     */
    registerOn(eventName: string, func: (evt: Event) => void, element?: HTMLElement | Window, options?: boolean | object): void;
    /**
     * Resolves a DOM element and optionally registers listener functions on it.
     * Each listener's return value is treated as a disposer and tracked.
     *
     * @param {string} elementId - Selector passed to querySelector.
     * @param {((element: Element) => (void | (() => void))) | Array<(element: Element) => (void | (() => void))>} [listenerFunctions] - One or more listener initializers.
     */
    initialiseElement(elementId: string, listenerFunctions?: ((element: Element) => (void | (() => void))) | Array<(element: Element) => (void | (() => void))>): void;
    #private;
}
import Disposable from "./Disposable.js";
//# sourceMappingURL=Base.d.ts.map