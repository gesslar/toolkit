import uglify from "@gesslar/uglier"

export default [
  {
    name: "gesslar/vendor-ignore",
    ignores: ["**/vendor/**"],
  },
  ...uglify({
    with: ["lints-js", "lints-jsdoc", "web", "node"],
    options: {
      "lints-js": {files: ["src/**/*.js", "scripts/**/*.{mjs,js}"]},
      "lints-jsdoc": {
        files: ["src/**/*.js"],
        // TS lib types with no runtime global; the rule can't see tsconfig's
        // `lib`, so they have to be declared here.
        overrides: {
          "jsdoc/no-undefined-types": ["error", {
            definedTypes: [
              "AsyncGenerator",
              "AsyncIterableIterator",
              "Generator",
              "IterableIterator",
            ]
          }],
        },
      },
      web: {files: ["src/browser/**/*.js"]},
      node: {files: ["src/**/*.js", "!src/browser/**"]},
    }
  })
]
