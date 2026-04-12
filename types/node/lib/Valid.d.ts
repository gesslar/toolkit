/**
 * Validation utility class providing type checking and assertion methods.
 * Inherits all behaviour from browser Valid; only the Sass class differs.
 */
export default class Valid extends BrowserValid {
    /** @type {typeof Sass} */
    static _Sass: typeof Sass;
}
import BrowserValid from "../../browser/lib/Valid.js";
import Sass from "./Sass.js";
//# sourceMappingURL=Valid.d.ts.map