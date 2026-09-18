import nearley from "nearley"

// modal.js is a nearley-generated grammar with a UMD-style footer. Under Vite's
// CommonJS interop `module` is defined, so it takes the `module.exports = grammar`
// branch — meaning we must import the default export, not read `window.grammar`
// (that branch never runs, so the global stays undefined).
import compiledGrammar from "./modal.js"

// Parse a proposition with the modal-logic grammar. Nearley returns an array of
// possible parses (more than one when the grammar is ambiguous).
export function parseProposition(input: string): unknown[] {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(compiledGrammar))
  try {
    parser.feed(input)
  } catch (err) {
    // nearley appends a long "expected one of ..." dump; keep only the summary
    // line (e.g. "Syntax error at line 1 col 3") for display.
    const summary = err instanceof Error ? err.message.split("\n")[0] : String(err)
    throw new Error(summary)
  }
  return parser.results
}
