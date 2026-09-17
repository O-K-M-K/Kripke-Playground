// Parser for ```demo fenced blocks in the lesson content. A block lays out a
// Kripke model in keyed, order-independent lines:
//
//   name: Click me          (optional) the button label
//   w0 -> w1                 an edge (accessibility relation)
//   w0 -> w1, w2             one source, several targets
//   w0 <-> w1                a bidirectional edge (two directed edges)
//   w0:                      a world with no true propositions
//   w1: p, q                 a world where p and q hold
//   formula: [] (p -> q)     (optional) the modal formula to check
//
// The `formula` may be written in ASCII shorthand (`[] <> -> <-> T F`), LaTeX
// (`\Box \Diamond \to \iff \t \f`), or the raw unicode symbols; it is normalized
// to the unicode the grammar expects (see `normalizeFormula`).
//
// Worlds are declared solely by their valuation lines (`name:`), so a typo in
// an edge can't silently spawn a phantom world. World names may be any token
// without spaces (e.g. `julia`, `rainyworld`); `name` and `formula` are
// reserved keys. The parser is React-Flow agnostic: it returns plain data that
// the app turns into nodes/edges (see `loadModel` in App.tsx).

import { normalizeFormula } from "./formulaSyntax"

export type ParsedWorld = { name: string; propositions: string[] }
export type ParsedEdge = { source: string; target: string }

export type ParsedDemo = {
  label: string
  worlds: ParsedWorld[]
  relation: ParsedEdge[]
  formula: string
}

/** The tag used as the code-fence language: ```demo … ``` (case-insensitive). */
export const DEMO_LANGUAGE = "demo"

const DEFAULT_LABEL = "Load model"

/** Split a comma-separated list into trimmed, non-empty tokens. */
function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Parse a ```demo block body into a {@link ParsedDemo}. Throws with a
 * human-readable message (naming the offending line) on malformed input or a
 * reference to an undeclared world.
 */
export function parseDemo(source: string): ParsedDemo {
  let label = DEFAULT_LABEL
  let formula = ""
  const worlds: ParsedWorld[] = []
  const relation: ParsedEdge[] = []
  const seen = new Set<string>()

  const lines = source.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.length === 0) continue

    const at = `line ${i + 1} ("${line}")`

    // `name:` and `formula:` are reserved keys, checked before world lines so a
    // world can't accidentally be named after them.
    const key = line.slice(0, line.indexOf(":")).trim().toLowerCase()
    if (line.includes(":") && key === "name") {
      label = line.slice(line.indexOf(":") + 1).trim() || DEFAULT_LABEL
      continue
    }
    if (line.includes(":") && key === "formula") {
      formula = normalizeFormula(line.slice(line.indexOf(":") + 1).trim())
      continue
    }

    // Edge line: `a -> b` / `a -> b, c` / `a <-> b`. Checked before the world
    // line since `<->`/`->` are unambiguous and contain no colon.
    const bidir = line.includes("<->")
    if (bidir || line.includes("->")) {
      const [lhs, rhs] = line.split(bidir ? "<->" : "->")
      const source = lhs.trim()
      const targets = splitList(rhs ?? "")
      if (!source || targets.length === 0) {
        throw new Error(`Malformed edge at ${at}: expected "a -> b"`)
      }
      for (const target of targets) {
        relation.push({ source, target })
        if (bidir) relation.push({ source: target, target: source })
      }
      continue
    }

    // World line: `w:` or `w: p, q`. The single source of truth for which
    // worlds exist.
    if (line.includes(":")) {
      const name = line.slice(0, line.indexOf(":")).trim()
      const propositions = splitList(line.slice(line.indexOf(":") + 1))
      if (!name) throw new Error(`Missing world name at ${at}`)
      if (seen.has(name)) throw new Error(`Duplicate world "${name}" at ${at}`)
      seen.add(name)
      worlds.push({ name, propositions })
      continue
    }

    throw new Error(`Unrecognized line at ${at}`)
  }

  if (worlds.length === 0) {
    throw new Error("Demo block declares no worlds")
  }

  // Every edge endpoint must be a declared world.
  for (const { source, target } of relation) {
    for (const end of [source, target]) {
      if (!seen.has(end)) {
        throw new Error(`Edge references undeclared world "${end}"`)
      }
    }
  }

  return { label, worlds, relation, formula }
}
