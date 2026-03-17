import uglify from "@gesslar/uglier"

export default [
  {
    name: "gesslar/vendor-ignore",
    ignores: ["**/vendor/**"],
  },
  ...uglify({
    with: ["lints-js", "lints-jsdoc", "web", "node"],
    overrides: {
      "lints-js": {files: ["src/**/*.js", "scripts/**/*.{mjs,js}"]},
      "lints-jsdoc": {files: ["src/**/*.js"]},
      web: {files: ["src/browser/**/*.js"]},
      node: {files: ["src/**/*.js", "!src/browser/**"]},
    }
  })
]
