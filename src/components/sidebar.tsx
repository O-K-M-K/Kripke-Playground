import { useLayoutEffect, useRef } from "react"
import { InlineMath } from "react-katex"
import { replace as unicodeReplace } from "unicodeit"

// unicodeit misses a couple of modal-logic staples, and renders \square filled
// (■) rather than the hollow box logicians use. Override those to taste.
// also gives some synonyms so is more comfortable (like lean)
const OVERRIDES: Record<string, string> = {
  "\\box": "□",
  "\\square": "□",
  "\\diamond": "◇",
  "\\lozenge": "◇",
}

// cannon latex left synonyms right
const SYNONYM_GROUPS: Record<string, Array<string>> = {
    "top" : ["t", "true"],
    "bot" : ["f", "false", "btm"],
    "forall" : ["all"],
    "exists" : ["ex"],
    "box" : ["square", "sqr"],
    "diamond" : ["dmnd", "lozenge"],
    "leftrightarrow" : ["iff"],
    "to" : ["rightarrow"],
    "land" : ["and"],
    "lor" : ["or"]
}
const SYNONYM_LOOKUP: Record<string, string> = Object.fromEntries(
    Object.entries(SYNONYM_GROUPS).flatMap(([canonical, aliases]) => [
        [canonical, canonical],
        ...aliases.map((alias) => [alias, canonical]),
    ])
);

// Convert a single LaTeX command token (e.g. "\to") to its unicode symbol, or
// null when unicodeit doesn't recognise it — in which case we leave the raw
// command in place rather than guessing.
function convertCommand(token: string): string | null {
  const lowerToken = token.toLowerCase();
  const bareToken = lowerToken.startsWith("\\") ? lowerToken.slice(1) : lowerToken;

  const canonToken = bareToken in SYNONYM_LOOKUP ? SYNONYM_LOOKUP[bareToken] : bareToken;
  const canonCommand = `\\${canonToken}`;

  if (canonCommand in OVERRIDES) {
    return OVERRIDES[canonCommand];
  }

  const converted = unicodeReplace(canonCommand);
  return converted !== canonCommand ? converted : null;
}

// Roster notation for a set of world labels: "{ w0, w1 }", or the empty-set
// glyph when there are none.
function rosterText(labels: string[]): string {
  return labels.length ? `{ ${labels.join(", ")} }` : "∅"
}

// A backslash command sitting right at the caret, e.g. the "\to" in "p \to".
const COMMAND_AT_CARET = /\\[a-zA-Z]+$/

// KaTeX's Computer Modern faces (loaded via katex.min.css) give the field its
// LaTeX look; the rest are fallbacks for the substituted symbols.
const LATEX_FONT =
  "'KaTeX_Main', 'KaTeX_Math', 'Cambria Math', 'Times New Roman', serif"

type SidebarProps = {
  value: string
  onValueChange: (value: string) => void
  // A short parse-status message, or null when the formula is valid/empty.
  error?: string | null
  // Labels of the worlds satisfying the current proposition, resolved from ids
  // upstream so custom renames show through (and duplicates are allowed).
  satisfiedLabels: string[]
  // Labels of the worlds where the proposition fails (the complement set).
  unsatisfiedLabels: string[]
}

// Left rail with a MathLive-style proposition field: type a LaTeX command and
// press space to swap it, in place, for the matching unicode symbol. The value
// is owned by the parent so it can also be fed to the parser.
export function Sidebar({ value, onValueChange, error, satisfiedLabels, unsatisfiedLabels }: SidebarProps) {
  // □ (a → b) ◇ (∀ p → ∃ q)
  const inputRef = useRef<HTMLInputElement>(null)
  // Caret to restore after we rewrite the value programmatically.
  const caretRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (caretRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(caretRef.current, caretRef.current)
      caretRef.current = null
    }
  })


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== " ") return

    const el = e.currentTarget
    const pos = el.selectionStart ?? value.length
    // Only act on a plain caret, not an active selection.
    if (el.selectionEnd !== pos) return

    const before = value.slice(0, pos)
    const match = before.match(COMMAND_AT_CARET)
    if (!match) return

    const symbol = convertCommand(match[0])
    if (!symbol) return

    // Replace the command with its symbol and keep the space as a separator.
    e.preventDefault()
    const head = before.slice(0, before.length - match[0].length)
    const after = value.slice(pos)
    onValueChange(head + symbol + " " + after)
    caretRef.current = head.length + symbol.length + 1
  }

  return (
    <aside className="flex h-svh w-72 shrink-0 flex-col gap-3 border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
      <label htmlFor="proposition" className="text-sm font-medium">
        Proposition
      </label>
      <input
        id="proposition"
        ref={inputRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={"\\box (p \\to q)"}
        spellCheck={false}
        autoComplete="off"
        style={{ fontFamily: LATEX_FONT }}
        className="rounded-md border border-input bg-background px-3 py-2 text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      {error && value.trim() ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Type a command like <code className="font-mono">{"\\to"}</code>,{" "}
        <code className="font-mono">{"\\Box"}</code> or{" "}
        <code className="font-mono">{"\\forall"}</code> and press{" "}
        <kbd className="rounded border border-border bg-muted px-1">space</kbd>{" "}
        to insert its symbol.
      </p>
      <p className="text-xs">Reference (captials don't matter). Typical synonyms and common latex are also supported</p>
      <p className="text-md font-mono" style={{fontFamily: LATEX_FONT}}/>
                <div className="grid grid-cols-2 gap-1 text-center ">
                    <div>\box</div> <div>□</div>
                    <div>\dmnd</div> <div>◇</div>
                    <div>\t</div> <div>⊤</div>
                    <div>\f</div> <div>⊥</div>
                    <div>\to</div> <div>→</div>
                </div>
      <div>
        Valid set <InlineMath math="\{\, w : w \Vdash A \,\}" />
      </div>
      <div className="border-2 border-dotted rounded-md border-green-600 p-2 text-lg">
        {rosterText(satisfiedLabels)}
      </div>
      <div>
        Invalid set <InlineMath math="\{\, w : w \nVdash A \,\}" />
      </div>
      <div className="border-2 border-dotted rounded-md border-red-600 p-2 text-lg">
        {rosterText(unsatisfiedLabels)}
      </div>
      <p>Inspired by: <a>https://rkirsling.github.io/modallogic/</a> </p>
    </aside>
  )
}
