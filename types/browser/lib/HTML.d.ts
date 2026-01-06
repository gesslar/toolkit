export class HTML {
    /**
     * Lightweight HTML helper utilities for browser contexts.
     *
     * @param {object|(() => unknown)} domPurify - Optional DOMPurify instance or factory.
     */
    constructor(domPurify?: object | (() => unknown));
    /**
     * Fetches an HTML fragment and returns the contents inside the <body> tag when present.
     *
     * @param {string} url - Location of the HTML resource to load.
     * @param {boolean} filterBodyContent - If true, returns only content found between the <body> tags. Defaults to false.
     * @returns {Promise<string>} Sanitized HTML string or empty string on missing content.
     */
    loadHTML(url: string, filterBodyContent?: boolean): Promise<string>;
    /**
     * Sanitizes arbitrary HTML using DOMPurify.
     *
     * @param {string} text - HTML string to sanitize. Defaults to "".
     * @returns {string} Sanitized HTML.
     */
    sanitise(text?: string): string;
    /**
     * Sanitizes an HTML string and replaces the element's children with the result.
     *
     * @param {Element} element - Target element to replace content within.
     * @param {string} htmlString - HTML string to sanitize and insert.
     */
    setHTMLContent(element: Element, htmlString: string): void;
    /**
     * Removes all child nodes from the given element.
     *
     * @param {Element} element - Element to clear.
     */
    clearHTMLContent(element: Element): void;
    #private;
}
declare const _default: HTML;
export default _default;
//# sourceMappingURL=HTML.d.ts.map