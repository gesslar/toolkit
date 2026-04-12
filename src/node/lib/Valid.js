/**
 * @file Valid.js
 *
 * Node-flavoured validation utilities that throw the Node Sass error type.
 * Extends the browser Valid, swapping in the Node Sass for richer reporting.
 */

import BrowserValid from "../../browser/lib/Valid.js"
import Sass from "./Sass.js"

/**
 * Validation utility class providing type checking and assertion methods.
 * Inherits all behaviour from browser Valid; only the Sass class differs.
 */
export default class Valid extends BrowserValid {
  /** @type {typeof Sass} */
  static _Sass = Sass
}
