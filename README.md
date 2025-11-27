# `npm i @gesslar/toolkit`

This package is intended to be a collection of useful utilities for any
project's consumption. Not the kind that gives you bleeding, hacking coughs,
but the kind that says "yumyum."

There are file and directory abstractions, uhmm, there's also some terminal
things and validity checkers, lots of data functions.

## Usage

**For Node.js projects:**

```javascript
import { Data, FileObject, Cache } from '@gesslar/toolkit'
// or explicitly:
import { Data, FileObject } from '@gesslar/toolkit/node'
```

**For browsers or Tauri apps:**

```javascript
import { Data, Collection, Util } from '@gesslar/toolkit/browser'
```

The browser version includes: Data, Collection, Util, Type (TypeSpec), Valid,
Sass, and Tantrum. Node-only modules (FileObject, Cache, FS, etc.) are not
available in the browser version.

**Browser via CDN (no install):**

- jsDelivr (runtime only):
  `https://cdn.jsdelivr.net/npm/@gesslar/toolkit@__VERSION__/browser`
- esm.sh (runtime + optional types):
  `https://esm.sh/@gesslar/toolkit@__VERSION__/browser`
  `https://esm.sh/@gesslar/toolkit@__VERSION__/browser?dts` (serves `.d.ts` for editors)

Notes:

- Nothing to configure in this repo for CDN use; both URLs just work.
- TypeScript editors do not pick up types from jsDelivr. If you want inline
  types without installing from npm, use the esm.sh `?dts` URL or install the
  package locally for development and use the CDN at runtime.

Basically, if you want it, it is most definitely here, and working 100% and
absolutely none of that is true. There are only a few classes here, but they're
pretty. And if you bug-shame them, I will _come for you like_ ...

nah. Just don't be a dick, okay? Play nice, share, lick a veggie and gentlemen,
spend less than 5 minutes washing your pits, chest, and downstairs and maybe
give some time to the other parts. Like the parts that walk on things, sit
on things. Some things that enjoy being sat upon do not enjoy being sat upon
by gross sitter-upon-things.

Also,
