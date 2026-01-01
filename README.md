# @gesslar/toolkit

[![CodeQL, Linting, Testing](https://github.com/gesslar/toolkit/actions/workflows/Quality.yaml/badge.svg)](https://github.com/gesslar/toolkit/actions/workflows/Quality.yaml)

A collection of utilities for Node.js and browser environments, including file
and directory abstractions, terminal utilities, validation helpers, and data
manipulation functions.

## Included Classes

### Browser

These classes exist and function within the browser, or browser-like
environment, such as a Tauri app.

| Name | Description |
| ---- | ----------- |
| Collection | Array, Map, Set, and other collection manipulation methods |
| Data | Primitive manipulation and type identification |
| Disposer | Lifecycle management for disposable resources |
| HTML | HTML loading and sanitization utilities |
| Notify | Event system wrapper for DOM events |
| Promised | Promise utilities for settling, filtering, and extracting values from promise results |
| Sass | Custom Error class with enhanced features |
| Tantrum | AggregateError implementation |
| Time | Timing operations and promise-based delays with cancellation support |
| Type | String-based type management (exported as TypeSpec in browser) |
| Util | General utility functions |
| Valid | Validation and assertion methods |

### Node.js

Includes all browser functionality plus Node.js-specific modules for file I/O, logging, and system operations.

| Name | Description |
| ---- | ----------- |
| Cache | Cache management for file I/O operations |
| CappedDirectoryObject | Directory operations constrained to a specific tree |
| DirectoryObject | Directory metadata and operations including path resolution, existence checks, and traversal |
| FileObject | File system wrapper for file operations |
| FS | Base class for file system operations with static utilities |
| Glog | Logging framework |
| Notify | Event system wrapper for Node.js events |
| Sass | Custom Error class with enhanced features |
| Tantrum | AggregateError implementation |
| TempDirectoryObject | Temporary directory management with automatic cleanup |
| Term | Terminal formatting and output utilities |
| Util | General utility functions (Node-enhanced version) |
| Valid | Validation and assertion methods |

## Installation

```shell
npm i @gesslar/toolkit
```

## Usage

Toolkit is environment aware and automatically detects whether it is being used
in a web browser or in Node.js. You can optionally specify the `node` or
`browser` variant explicitly.

### Browser-like

TypeScript editors do not pick up types from jsDelivr. If you want inline types
without installing from npm, use the esm.sh `?dts` URL or install the package
locally for development and use the CDN at runtime.

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
import {Data, FileObject} from "@gesslar/toolkit/node"
```

```javascript
import { Data, Collection, Util } from '@gesslar/toolkit/browser'
```

The browser version includes: Collection, Data, Disposer, HTML, Notify, Sass,
Tantrum, Type (TypeSpec), Util, and Valid. Node-only modules (Cache,
CappedDirectoryObject, DirectoryObject, FileObject, FS, Glog,
TempDirectoryObject, Term) are not available in the browser version.

## Post Partum

If you made it this far, please understand that I have absolutely zero scruples
when it comes to breaking changes. Primarily, the audience for this library is
myself. Consequently, anything that relies on the contents of this library will
dutifully crash and I'll have to refactor those things then. It's like playing
nicky nicky nine doors. But with myself. And there's a lazy bomb waiting for
me. That I planted. For me. And the bomb just explodes poop.

You're of course welcome to use my library! It's pretty robust. Uhhh, but maybe
lock in the version until you see if something is gonna poop all over you. I
make robots make my PR notifications and generally they're very good at firing
off klaxons about my fetish for breaking changes, so you should be all right
if you're paying attention. 🤷🏻

Sincerely, Senator Yabba of the Dabba (Doo)
