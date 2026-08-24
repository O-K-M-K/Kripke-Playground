import { useState } from "react"
import { InlineMath } from "react-katex"

// Left rail for entering a modal-logic proposition and previewing it as
// typeset math. The raw text is treated as LaTeX, so commands like `\to`,
// `\Box`, `\Diamond`, `\land`, `\lor` and `\neg` render as their symbols.
export function Sidebar() {
  const [proposition, setProposition] = useState("")
  const trimmed = proposition.trim()

  return (
    <aside className="flex h-svh w-72 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
      <div className="flex flex-col gap-2">
        <label htmlFor="proposition" className="text-sm font-medium">
          Proposition
        </label>
        <textarea
          id="proposition"
          value={proposition}
          onChange={(e) => setProposition(e.target.value)}
          placeholder={"\\Box (p \\to q)"}
          spellCheck={false}
          rows={3}
          className="resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <p className="text-xs text-muted-foreground">
          Type LaTeX — e.g. <code className="font-mono">{"\\to"}</code>,{" "}
          <code className="font-mono">{"\\Box"}</code>,{" "}
          <code className="font-mono">{"\\Diamond"}</code>.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Preview</span>
        <div className="grid min-h-16 place-items-center rounded-md border border-sidebar-border bg-card p-4 text-lg">
          {trimmed ? (
            // Surface parse errors inline so a half-typed formula doesn't blank
            // the sidebar.
            <InlineMath
              math={trimmed}
              renderError={() => (
                <span className="text-sm text-destructive">Invalid LaTeX</span>
              )}
            />
          ) : (
            <span className="text-sm text-muted-foreground">
              Nothing to render yet
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}
