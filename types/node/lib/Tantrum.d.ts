/**
 * Custom aggregate error class that extends AggregateError.
 * Automatically wraps plain errors in Sass instances for consistent reporting.
 */
export default class Tantrum extends BrowserTantrum {
    constructor(message: any, errors?: any[]);
}
import { Tantrum as BrowserTantrum } from "../../browser/index.js";
//# sourceMappingURL=Tantrum.d.ts.map