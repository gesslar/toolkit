import DOMPurify from "./vendor/dompurify.esm.js"
import Sass from "./Sass.js"

export class HTML {
  #domPurify

  /**
   * Lightweight HTML helper utilities for browser contexts.
   *
   * @param {object|(() => unknown)} domPurify - Optional DOMPurify instance or factory.
   */
  constructor(domPurify=DOMPurify) {
    this.#domPurify = domPurify
  }

  /**
   * Fetches an HTML fragment and returns the contents inside the <body> tag when present.
   *
   * @param {string} url - Location of the HTML resource to load.
   * @param {boolean} filterBodyContent - If true, returns only content found between the <body> tags. Defaults to false.
   * @returns {Promise<string>} Sanitized HTML string or empty string on missing content.
   */
  async loadHTML(url, filterBodyContent=false) {
    try {
      const response = await fetch(url)
      const html = await response?.text()

      if(!html)
        return ""

      const {body} = /<body[^>]*>(?<body>[\s\S]*?)<\/body>/i.exec(html)?.groups ?? {}

      if(filterBodyContent)
        return body ?? html

      return html
    } catch(error) {
      throw Sass.new(`Loading HTML from '${url}'.`, error)
    }
  }

  /**
   * Sanitizes arbitrary HTML using DOMPurify.
   *
   * @param {string} text - HTML string to sanitize. Defaults to "".
   * @returns {string} Sanitized HTML.
   */
  sanitise(text="") {
    const sanitizer = this.#resolveSanitizer()

    return sanitizer(String(text ?? ""))
  }

  /**
   * Sanitizes an HTML string and replaces the element's children with the result.
   *
   * @param {Element} element - Target element to replace content within.
   * @param {string} htmlString - HTML string to sanitize and insert.
   */
  setHTMLContent(element, htmlString) {
    if(!element)
      throw Sass.new("setHTMLContent requires a valid element.")

    const sanitised = this.sanitise(htmlString)
    const doc = element.ownerDocument ?? globalThis.document

    if(doc?.createRange && typeof element.replaceChildren === "function") {
      const range = doc.createRange()
      const fragment = range.createContextualFragment(sanitised)

      element.replaceChildren(fragment)

      return
    }

    if("innerHTML" in element) {
      element.innerHTML = sanitised

      return
    }

    if(typeof element.replaceChildren === "function") {
      element.replaceChildren(sanitised)

      return
    }

    throw Sass.new("Unable to set HTML content: unsupported element.")
  }

  /**
   * Removes all child nodes from the given element.
   *
   * @param {Element} element - Element to clear.
   */
  clearHTMLContent(element) {
    if(!element)
      throw Sass.new("clearHTMLContent requires a valid element.")

    if(typeof element.replaceChildren === "function") {
      element.replaceChildren()

      return
    }

    if("innerHTML" in element) {
      element.innerHTML = ""

      return
    }

    throw Sass.new("Unable to clear HTML content: unsupported element.")
  }

  /**
   * Resolves the DOMPurify sanitize function.
   *
   * @returns {(input: string) => string} Sanitizer function.
   */
  #resolveSanitizer() {
    if(this.#domPurify?.sanitize)
      return this.#domPurify.sanitize

    if(typeof this.#domPurify === "function") {
      try {
        const configured = this.#domPurify(globalThis.window ?? globalThis)

        if(configured?.sanitize)
          return configured.sanitize
      } catch(error) {
        throw Sass.new("DOMPurify sanitization is unavailable in this environment.", error)
      }
    }

    throw Sass.new("DOMPurify sanitization is unavailable in this environment.")
  }
}

export default new HTML()
