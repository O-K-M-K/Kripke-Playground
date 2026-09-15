import { parseProposition } from "./parser"
import {
  type Formula,
  Top,
  Bot,
  P,
  Not,
  And,
  Box,
  or,
  diamond,
  implies,
} from "./ModelTypes"

// The normalized `.v` node shape emitted by every rule in modal.ne. The grammar
// keeps this tree separate from its parse metadata (the `d`/`type` fields), so
// it maps almost 1:1 onto our `Formula` constructors.
export type Ast =
  | { op: "prop"; name: string }
  | { op: "~" | "[]" | "<>"; a: Ast }
  | { op: "/\\" | "\\/" | "->" | "<->"; l: Ast; r: Ast }
  | { op: "T" | "F" }

// The top-level wrapper rule (`main`) hangs the whole tree off `.v`.
type ParseResult = { v: Ast }

export function toFormula(node: Ast): Formula {
  switch (node.op) {
    case "T":
      return Top
    case "F":
      return Bot
    case "prop":
      return P(node.name)
    case "~":
      return Not(toFormula(node.a))
    case "[]":
      return Box(toFormula(node.a))
    case "<>":
      return diamond(toFormula(node.a))
    case "/\\":
      return And(toFormula(node.l), toFormula(node.r))
    case "\\/":
      return or(toFormula(node.l), toFormula(node.r))
    case "->":
      return implies(toFormula(node.l), toFormula(node.r))
    case "<->": {
      // A ↔ B  ≡  (A → B) ∧ (B → A)
      const l = toFormula(node.l)
      const r = toFormula(node.r)
      return And(implies(l, r), implies(r, l))
    }
  }
}

// Parse a modal-logic string and convert it into a checkable `Formula`.
// Throws on a syntax error (no parse) or an ambiguous parse (>1 parse).
export function parseFormula(input: string): Formula {
  const results = parseProposition(input) as ParseResult[]
  if (results.length === 0) {
    throw new Error(`Syntax error: could not parse "${input}"`)
  }
  if (results.length > 1) {
    throw new Error(`Ambiguous parse: "${input}" has ${results.length} parse trees`)
  }
  return toFormula(results[0].v)
}
