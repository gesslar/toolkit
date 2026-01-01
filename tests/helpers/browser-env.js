#!/usr/bin/env node

import {GlobalWindow} from "happy-dom"

/**
 * Sets up a browser-like environment for testing browser-specific code.
 * Creates window, document, and related browser APIs in the global scope.
 *
 * @returns {() => void} Cleanup function to restore original globals
 */
export function setupBrowserEnvironment() {
	const window = new GlobalWindow()
	const originalGlobals = {}

	// Browser globals to expose
	const browserGlobals = [
		"window",
		"document",
		"navigator",
		"location",
		"CustomEvent",
		"Event",
		"EventTarget",
		"HTMLElement",
		"Element",
		"Node",
		"DOMParser",
		"XMLHttpRequest",
		"fetch",
		"Headers",
		"Request",
		"Response",
		"URL",
		"URLSearchParams"
	]

	// Save originals and set globals
	for(const key of browserGlobals) {
		if(key in globalThis) {
			originalGlobals[key] = globalThis[key]
		}

		try {
			if(key === "window") {
				globalThis[key] = window
			} else if(key in window) {
				globalThis[key] = window[key]
			}
		} catch(error) {
			// Skip read-only properties
		}
	}

	// Return cleanup function
	return () => {
		for(const key of browserGlobals) {
			try {
				if(key in originalGlobals) {
					globalThis[key] = originalGlobals[key]
				} else {
					delete globalThis[key]
				}
			} catch(error) {
				// Skip read-only properties
			}
		}
	}
}

/**
 * Cleans up the browser environment by resetting the window.
 * Call this in afterEach/after hooks.
 *
 * @param {() => void} cleanup - Cleanup function returned by setupBrowserEnvironment
 */
export function cleanupBrowserEnvironment(cleanup) {
	if(typeof cleanup === "function") {
		cleanup()
	}
}
