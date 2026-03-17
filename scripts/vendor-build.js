import {readFileSync, mkdirSync} from "node:fs"
import {rollup} from "rollup"
import {nodeResolve} from "@rollup/plugin-node-resolve"

const vendorDir = "vendor"
const {version} = JSON.parse(readFileSync("package.json", "utf8"))

mkdirSync(vendorDir, {recursive: true})

const bundle = await rollup({
  input: "src/browser/index.js",
  plugins: [nodeResolve()],
})

try {
  await bundle.write({
    file: `${vendorDir}/toolkit.esm.js`,
    format: "es",
    banner: `// @gesslar/toolkit v${version} - ES module bundle`,
  })

  await bundle.write({
    file: `${vendorDir}/toolkit.umd.js`,
    format: "umd",
    name: "Toolkit",
    banner: `// @gesslar/toolkit v${version} - UMD bundle`,
  })
} finally {
  await bundle.close()
}

console.log(`Built vendor bundles for @gesslar/toolkit@${version}`)
