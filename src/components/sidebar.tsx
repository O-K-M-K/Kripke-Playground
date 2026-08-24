import { useLayoutEffect, useRef, useState } from "react"
import { replace as unicodeReplace } from "unicodeit"

// unicodeit misses a couple of modal-logic staples, and renders \square filled
// (■) rather than the hollow box logicians use. Override those to taste.
const OVERRIDES: Record<string, string> = {
  "\\Box": "□",
  "\\square": "□",
  "\\Diamond": "◇",
  "\\lozenge": "◇",
}

// Convert a single LaTeX command token (e.g. "\to") to its unicode symbol, or
// null when unicodeit doesn't recognise it — in which case we leave the raw
// command in place rather than guessing.
function convertCommand(token: string): string | null {
  if (token in OVERRIDES) return OVERRIDES[token]
  const converted = unicodeReplace(token)
  return converted !== token ? converted : null
}

// A backslash command sitting right at the caret, e.g. the "\to" in "p \to".
const COMMAND_AT_CARET = /\\[a-zA-Z]+$/

// KaTeX's Computer Modern faces (loaded via katex.min.css) give the field its
// LaTeX look; the rest are fallbacks for the substituted symbols.
const LATEX_FONT =
  "'KaTeX_Main', 'KaTeX_Math', 'Cambria Math', 'Times New Roman', serif"

// Left rail with a MathLive-style proposition field: type a LaTeX command and
// press space to swap it, in place, for the matching unicode symbol.
export function Sidebar() {
  const [value, setValue] = useState("")
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
    setValue(head + symbol + " " + after)
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
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={"\\Box (p \\to q)"}
        spellCheck={false}
        autoComplete="off"
        style={{ fontFamily: LATEX_FONT }}
        className="rounded-md border border-input bg-background px-3 py-2 text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      <p className="text-xs text-muted-foreground">
        Type a command like <code className="font-mono">{"\\to"}</code>,{" "}
        <code className="font-mono">{"\\Box"}</code> or{" "}
        <code className="font-mono">{"\\forall"}</code> and press{" "}
        <kbd className="rounded border border-border bg-muted px-1">space</kbd>{" "}
        to insert its symbol.
      </p>
    </aside>
  )
}
