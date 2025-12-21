# Gesslar's Toolkit of Amazing ✌🏻

This package is intended to be a collection of useful utilities for any
project's consumption. Not the kind that gives you bleeding, hacking coughs,
but the kind that gives "yumyum."

There are file and directory abstractions, uhmm, there's also some terminal
things and validity checkers, lots of data functions.

## Included Classes

### Browser

These classes exist and function within the browser, or browser-like environment, such as
a Tauri app.

| Name | Description |
| ---- | ----------- |
| Collection | Array, Map, etc methods |
| Data | Primitive manipulation and identification |
| Disposer | Participate in lifecycle mechanics |
| HTML | HTML-related methods |
| Notify | Wrapper around DOM event system |
| Sass | The best Error class this side of Tatooine |
| Tantrum | Sass's louder, shoutier AggregateError cousin |
| TypeSpec | String-based type management |
| Util | Porn |
| Valid | Assert methods for validation |

### Node.js

Everything included in the browser but more, and backendier.

| Name | Description |
| ---- | ----------- |
| Cache | Cache management for use with file IO |
| Contract | Contract management |
| DirectoryObject | Wrapper around Node's fs for directories |
| FileObject | Wrapper around Node's fs for directories |
| FS | Base for DirectoryObject and FileObject, but with additional static methods |
| Glog | The superior logging framework |
| Notify | Wrapper around Node's event system |
| Sass | The best Error class the other side of Tatooine |
| Schemer | Schema management |
| Tantrum | *crowd of wookiee roars* |
| Term | Terminal based methods |
| Terms | Terms for use with Contract |
| Util | Not porn, promise 🤞🏼 |
| Valid | Assert methods for validation |

## Installation

```shell
npm i @gesslar/toolkit
```

## Usage

Toolkit is environment aware and knows whether it is being used in a web browser or in
Node.js. It is not strictly necessary to specify whether you require the `node` or
`browser` variant, but you may do so if you like to feel like a nice control daddy.

### Browser-like

TypeScript editors do not pick up types from jsDelivr. If you want inline types without
installing from npm, use the esm.sh `?dts` URL or install the package locally for
development and use the CDN at runtime.

#### jsDelivr (runtime only)

```html
https://cdn.jsdelivr.net/npm/@gesslar/toolkit
```

#### esm.sh (runtime, types)

```html
https://esm.sh/@gesslar/toolkit
https://esm.sh/@gesslar/toolkit?dts` (serves `.d.ts` for editors)
```

### Node.js

```javascript
import * as TK from "@gesslar/toolkit"
```

```javascript
import {Data, FileObject, Cache} from "@gesslar/toolkit"
```

```javascript
import {Data, Filebject} from "@gesslar/toolkit/node"
```

```javascript
import { Data, Collection, Util } from '@gesslar/toolkit/browser'
```

The browser version includes: Data, Collection, Util, Type (TypeSpec), Valid,
Sass, and Tantrum. Node-only modules (FileObject, Cache, FS, etc.) are not
available in the browser version.

Basically, if you want it, it is most definitely here, and working 100% and
absolutely none of that is true. There are only a few classes here, but they're
pretty. And if you bug-shame them, I will *come for you like* ...

nah. Just don't be a dick, okay? Play nice, share, lick a veggie and gentlemen,
spend fewer than 5 minutes washing your pits, chest, and downstairs and maybe
give some time to the other parts. Like the parts that walk on things, sit
on things. Some things that enjoy being sat upon do not enjoy being sat upon
by gross sitter-upon-things.

Also,
