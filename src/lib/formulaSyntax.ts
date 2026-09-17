import { replace as unicodeReplace } from "unicodeit"

// Formula syntax normalization shared by the proposition field (sidebar.tsx) and
// the ```demo block parser (demoModel.ts).
//
// The grammar in modal.ne only accepts unicode symbols:
//
//   □ ◇ ¬ ∧ ∨ → ↔ ⊤ ⊥   plus lowercase propositional letters (p, q1, ...)
//
// Authors, however, want to type in plain ASCII or LaTeX. So we accept three
// equivalent spellings for each operator and normalize them all to the unicode
// the parser expects:
//
//   ASCII     LaTeX        unicode
//   [] . . . .\Box . . . . □
//   <> . . . .\Diamond . . ◇
//   ~ / ! . . \lnot/\neg . ¬
//   /\ . . . .\land/\and . ∧
//   \/ . . . .\lor/\or . . ∨
//   -> . . . .\to  . . . . →
//   <->. . . .\iff . . . . ↔
//   T  . . . .\t / \top . .⊤
//   F  . . . .\f / \bot . .⊥

// unicodeit misses a couple of modal-logic staples, and renders \square filled
// (■) rather than the hollow box logicians use. Override those to taste, and
// give some synonyms so the field is more comfortable (as in Lean).
const OVERRIDES: Record<string, string> = {
  "\\box": "□",
  "\\square": "□",
  "\\diamond": "◇",
  "\\lozenge": "◇",
}

// Canonical LaTeX command (left) with the synonyms that resolve to it (right).
const SYNONYM_GROUPS: Record<string, string[]> = {
  top: ["t", "true"],
  bot: ["f", "false", "btm"],
  forall: ["all"],
  exists: ["ex"],
  box: ["square", "sqr"],
  diamond: ["dmnd", "lozenge"],
  leftrightarrow: ["iff"],
  to: ["rightarrow"],
  land: ["and"],
  lor: ["or"],
}
const SYNONYM_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(SYNONYM_GROUPS).flatMap(([canonical, aliases]) => [
    [canonical, canonical],
    ...aliases.map((alias) => [alias, canonical]),
  ]),
)

/**
 * Convert a single LaTeX command token (e.g. `\to`) to its unicode symbol, or
 * `null` when unicodeit doesn't recognise it — in which case callers leave the
 * raw command in place rather than guessing. Case-insensitive, and resolves the
 * synonyms above (so `\Box`, `\square` and `\sqr` all give □).
 */
export function convertCommand(token: string): string | null {
  const lowerToken = token.toLowerCase()
  const bareToken = lowerToken.startsWith("\\") ? lowerToken.slice(1) : lowerToken

  const canonToken = bareToken in SYNONYM_LOOKUP ? SYNONYM_LOOKUP[bareToken] : bareToken
  const canonCommand = `\\${canonToken}`

  if (canonCommand in OVERRIDES) {
    return OVERRIDES[canonCommand]
  }

  const converted = unicodeReplace(canonCommand)
  return converted !== canonCommand ? converted : null
}

// ASCII operator spellings, longest first so a left-to-right scan matches `<->`
// before `<>`/`->` and `[]`/`<>` as whole tokens.
const ASCII_OPERATORS: Array<[string, string]> = [
  ["<->", "↔"],
  ["->", "→"],
  ["[]", "□"],
  ["<>", "◇"],
  ["/\\", "∧"],
  ["\\/", "∨"],
  ["&", "∧"],
  ["|", "∨"],
  ["~", "¬"],
  ["!", "¬"],
  ["T", "⊤"],
  ["F", "⊥"],
]

// A LaTeX command: a backslash followed by one or more letters.
const LATEX_COMMAND = /^\\[a-zA-Z]+/

/**
 * Rewrite a formula written in ASCII shorthand and/or LaTeX into the unicode the
 * grammar accepts. Symbols that are already unicode (and unrecognised text like
 * propositional letters or parentheses) pass through untouched, so this is safe
 * to run on any formula:
 *
 *   normalizeFormula("[] (p -> q)")      -> "□ (p → q)"
 *   normalizeFormula("\\Box(p \\to q)")  -> "□(p → q)"
 *   normalizeFormula("□ (p → q)")        -> "□ (p → q)"
 *
 * A single left-to-right scan takes the longest match at each position: LaTeX
 * commands (which start with `\` and letters) never collide with the ASCII
 * operators (`\/`, `/\` have no letters after the backslash).
 */
export function normalizeFormula(input: string): string {
  let out = ""
  let i = 0

  outer: while (i < input.length) {
    const rest = input.slice(i)

    // LaTeX command: convert if recognised, otherwise keep it verbatim.
    const command = rest.match(LATEX_COMMAND)
    if (command) {
      const symbol = convertCommand(command[0])
      out += symbol ?? command[0]
      i += command[0].length
      continue
    }

    // ASCII operator (longest match wins).
    for (const [ascii, symbol] of ASCII_OPERATORS) {
      if (rest.startsWith(ascii)) {
        out += symbol
        i += ascii.length
        continue outer
      }
    }

    // Anything else (letters, digits, parens, unicode symbols) passes through.
    out += input[i]
    i += 1
  }

  return out
}
