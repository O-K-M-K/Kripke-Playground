// Post-process nearley's compiled grammar into an ES module.
//
// `nearleyc` emits a UMD file: the grammar lives inside an IIFE and is exposed
// via `module.exports` / `window.grammar`. Vite's dev server serves files under
// src/ as raw ESM, where neither branch runs and there is no export — so a
// `default` import fails. This rewrites the wrapper into a plain module with a
// single `export default grammar`, which works identically in dev and build.
import { readFile, writeFile } from "node:fs/promises"

const target = process.argv[2]
if (!target) {
  console.error("usage: node scripts/esmify-grammar.mjs <path-to-generated-grammar.js>")
  process.exit(1)
}

let src = await readFile(target, "utf8")

// Drop the leading IIFE wrapper `(function () {` and turn the grammar into a
// module-scoped const.
src = src.replace(/\(function \(\) \{\s*/, "")
src = src.replace(/var grammar = \{/, "const grammar = {")

// Replace the UMD footer (`if (typeof module ...) { ... } else { ... }})();`)
// with a clean ESM default export.
src = src.replace(
  /if \(typeof module[\s\S]*$/,
  "export default grammar\n",
)

await writeFile(target, src)
console.log(`esmified ${target}`)
