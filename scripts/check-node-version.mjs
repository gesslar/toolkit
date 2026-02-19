/* -- temporarily turning off

import {readFile} from "node:fs/promises"
import {dirname, join} from "node:path"
import {fileURLToPath} from "node:url"

await(async() => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const pkgPath = join(__dirname, "../package.json")

  try {
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8"))
    const nodeEngine = pkg.engines?.node

    const versionMatch = nodeEngine?.match(/(?<target>\d+\.\d+\.\d+)$/)
    const {target} = versionMatch?.groups ?? {}

    if(!target)
      throw new Error(`Could not parse target version from engines.node: "${nodeEngine}"`)

    const current = process.versions.node

    const isCompatible = (() => {
      const c = current.split(".").map(Number)
      const t = target.split(".").map(Number)

      // Major
      if(c[0] > t[0])
        return true

      if(c[0] < t[0])
        return false

      // Minor
      if(c[1] > t[1])
        return true

      if(c[1] < t[1])
        return false

      // Patch
      if(c[2] < t[2])
        return false

      return true
    })()

    if(!isCompatible) {
      console.error(`\x1b[31m%s\x1b[0m`, `✖ Error: @gesslar/toolkit requires Node.js ${nodeEngine}`)
      console.error(`\x1b[90m%s\x1b[0m`, `  Current version: ${current}`)
      process.exit(1)
    }
  } catch(err) {
    console.warn(`\x1b[33m%s\x1b[0m`, `⚠ Compatibility check failed: ${err.message}`)
    // We exit 0 here if we want to allow the install to proceed despite a script error,
    // or exit 1 to be strictly safe.
    process.exit(0)
  }
})()
*/
