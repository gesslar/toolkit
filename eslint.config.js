import js from "@eslint/js"
// https://www.npmjs.com/package/eslint-plugin-jsdoc
import jsdoc from "eslint-plugin-jsdoc";
import stylistic from "@stylistic/eslint-plugin"
import globals from "globals"

export default [
  js.configs.recommended,
  // jsdoc.configs['flat/recommended'],
  {
    name: "bmw/tmx/languageOptions",
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  {
    name: "gesslar/uglier/web",
    files: ["src/browser/**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        acquireVsCodeApi: "readonly"
      }
    }
  },
  {
    name: "bmw/tmx/lints",
    files: ["src/**/*.js"],
    plugins: {
      jsdoc: jsdoc,
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/arrow-parens": ["error", "as-needed"],
      "@stylistic/arrow-spacing": ["error", {before: true, after: true}],
      "@stylistic/brace-style": ["error", "1tbs", {allowSingleLine: false}],
      "@stylistic/computed-property-spacing": ["error", "never"],
      "@stylistic/eol-last": ["error", "always"],
      "@stylistic/indent": ["error", 2, {
        SwitchCase: 1 // Indents `case` statements one level deeper than `switch`
      }],
      "@stylistic/key-spacing": ["error", {beforeColon: false, afterColon: true}],
      "@stylistic/keyword-spacing": ["error", {
        before: false,
        after: true,
        overrides: {
          // Control statements
          return: {before: true, after: true},
          if: {after: false},
          else: {before: true, after: true},
          for: {after: false},
          while: {before: true, after: false},
          do: {after: true},
          switch: {after: false},
          case: {before: true, after: true},
          throw: {before: true, after: false} ,

          // Keywords
          as: {before: true, after: true},
          of: {before: true, after: true},
          in: {before: true, after: true},
          from: {before: true, after: true},
          async: {before: true, after: true},
          await: {before: true, after: false},
          class: {before: true, after: true},
          const: {before: true, after: true},
          let: {before: true, after: true},
          var: {before: true, after: true},

          // Exception handling
          catch: {before: true, after: true},
          finally: {before: true, after: true},
        }
      }],
      "@stylistic/no-tabs": "error",
      "@stylistic/no-trailing-spaces": ["error"],
      "@stylistic/object-curly-spacing": ["error", "never", {
        objectsInObjects: false,
        arraysInObjects: false,
        emptyObjects: "never",
      }],
      // Ensure control statements and their bodies are not on the same line
      "@stylistic/padding-line-between-statements": [
        "error",
        {blankLine: "always", prev: "if", next: "*"},
        {blankLine: "always", prev: "for", next: "*"},
        {blankLine: "always", prev: "while", next: "*"},
        {blankLine: "always", prev: "do", next: "*"},
        {blankLine: "always", prev: "switch", next: "*"}
      ],
      "@stylistic/quotes": ["error", "double", {
        avoidEscape: true,
        allowTemplateLiterals: "always"
      }],
      "@stylistic/semi": ["error", "never"],
      "@stylistic/space-before-function-paren": ["error", "never"],
      "@stylistic/space-in-parens": ["error", "never"],
      "@stylistic/yield-star-spacing": ["error", {before: true, after: false}],

      // Regular ESLint
      "constructor-super": "error",
      "no-unexpected-multiline": "error",
      "no-unused-vars": ["warn", {
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_+",
        argsIgnorePattern: "^_+",
        destructuredArrayIgnorePattern: "^_+",
        varsIgnorePattern: "^_+"
      }],
      "no-useless-assignment": "error",
    }
  },
  {
    ignores: ["src/**/vendor/**"]
  },
  {
    name: "gesslar/uglier/lints-jsdoc",
    files: ["src/**/*.{mjs,cjs,js}"],
    plugins: {
      jsdoc,
    },
    rules: {
      "jsdoc/require-description": "error",
      "jsdoc/tag-lines": ["error", "any", {"startLines":1}],
      "jsdoc/require-jsdoc": ["error", { publicOnly: true }],
      "jsdoc/check-tag-names": "error",
      "jsdoc/check-types": "error",
      "jsdoc/require-param-type": "error",
      "jsdoc/require-returns-type": "error"
    }
  },
  {
    plugins: {
      jsdoc
    },

    rules: {
      // Enforce strict JSDoc type grammar (no {object}, no {Object}, no blobs)
      "jsdoc/valid-types": "error",

      // Forces typedefs & named types to actually exist
      "jsdoc/no-undefined-types": "error",

      // Optional but nice: makes @typedef shapes mandatory
      "jsdoc/require-property": "error"
    },

    settings: {
      jsdoc: {
        mode: "typescript"
      }
    }
  }
]
