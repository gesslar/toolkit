import {glob} from "node:fs/promises"
import process from "node:process"

const cwd = process.cwd()
const pat = "README.md"
const options = {
  cwd,
  withFileTypes: true,
  exclude: candidate => candidate.parentPath !== cwd
}

const arr = await Array.fromAsync(glob(pat, options))

console.log(arr)
