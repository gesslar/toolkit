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
| DirectoryObject | Directory metadata and operations including path resolution, existence checks, and traversal |
| FileObject | File system wrapper for file operations |
| FileSystem | Base class for file system operations with static utilities |
| Glog | Logging framework |
| Notify | Event system wrapper for Node.js events |
| Sass | Custom Error class with enhanced features |
| Tantrum | AggregateError implementation |
| Term | Terminal formatting and output utilities |
| Util | General utility functions (Node-enhanced version) |
| Valid | Validation and assertion methods |
| Watcher | File and directory change watcher with debounce protection |


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
DirectoryObject, FileObject, FileSystem, Glog, Term) are not available in the browser version.

### Vendor Bundle

Pre-built bundles are included for environments without a build pipeline, such
as webviews (VS Code, Tauri, Electron) or plain HTML pages. No bundler required.

#### ES module

```html
<script type="module">
  import {Data, Collection} from "./node_modules/@gesslar/toolkit/vendor/toolkit.esm.js"
</script>
```

Or import via the package export:

```javascript
import {Data, Collection} from "@gesslar/toolkit/vendor"
```

#### UMD (global script)

```html
<script src="./node_modules/@gesslar/toolkit/vendor/toolkit.umd.js"></script>
<script>
  const {Data, Collection} = Toolkit
</script>
```

The vendor bundles contain the same browser-compatible utilities listed above,
fully self-contained with zero external dependencies.

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

## License

`@gesslar/toolkit` is released into the public domain under the [0BSD](LICENSE.txt).

This package includes or depends on third-party components under their own
licenses:

| Dependency | License |
| --- | --- |
| [@gesslar/colours](https://github.com/gesslar/colours) | 0BSD |
| [ajv](https://github.com/ajv-validator/ajv) | MIT |
| [json5](https://github.com/json5/json5) | MIT |
| [supports-color](https://github.com/chalk/supports-color) | MIT |
| [yaml](https://github.com/eemeli/yaml) | ISC |
