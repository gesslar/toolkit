import js from "@eslint/js"
import jsdoc from "eslint-plugin-jsdoc"
import uglify from "@gesslar/uglier"

export default [
  js.configs.recommended,
  jsdoc.configs["flat/recommended"],
  {
    name: "gesslar/vendor-ignore",
    ignores: ["src/browser/lib/vendor/**"],
  },
  ...uglify({
    with: ["lints-js", "lints-jsdoc", "web", "node"],
    overrides: {
      "lints-js": {files: ["src/**/*.js"]},
      "lints-jsdoc": {files: ["src/**/*.js"]},
      web: {files: ["src/browser/**/*.js"]},
      node: {files: ["src/**/*.js", "!src/browser/**"]},
    }
  })
]
