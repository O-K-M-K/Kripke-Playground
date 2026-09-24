/**
 * Our one non-standard bit of syntax layered on top of Markdown:
 *
 *   [label]{hover}
 *
 * `label` is shown inline; `hover` is revealed in a tooltip. A `[label]` that is
 * not immediately followed by `{` is left untouched, so it can't be mistaken for
 * a tooltip — ordinary Markdown links (`[text](url)`) and references
 * (`[text][ref]`) pass through unchanged.
 *
 * Markdown tokenises emphasis (`**`, `*`) and math (`$...$`) while it *parses*,
 * before any plugin can run — so a tooltip whose label or hover contains those
 * would be split apart before we could see it. To avoid that we rewrite tooltips
 * at the raw-string level, ahead of Markdown, into an inline HTML element:
 *
 *   <kripke-tooltip label="..." hover="..."></kripke-tooltip>
 *
 * `label`/`hover` are URI-encoded raw Markdown, so they may contain further
 * math, emphasis, or nested tooltips; the {@link RichText} component decodes and
 * renders each recursively. A backslash escapes the opening `[`.
 */
export const TOOLTIP_TAG = "kripke-tooltip"

/** Rewrite every `[label]{hover}` in `input` into a `<kripke-tooltip>` element. */
export function encodeTooltips(input: string): string {
  let out = ""
  let i = 0
  while (i < input.length) {
    const c = input[i]

    // Preserve escapes verbatim so Markdown handles them (`\[` -> literal `[`).
    if (c === "\\" && i + 1 < input.length) {
      out += input[i] + input[i + 1]
      i += 2
      continue
    }

    // Copy code spans/fences verbatim: text inside backticks is literal in
    // Markdown, so `[x]{y}` there must not be treated as a tooltip.
    if (c === "`") {
      const code = skipCode(input, i)
      out += input.slice(i, code)
      i = code
      continue
    }

    if (c === "[") {
      const tooltip = parseTooltip(input, i)
      if (tooltip) {
        const label = encodeURIComponent(tooltip.label)
        const hover = encodeURIComponent(tooltip.hover)
        out += `<${TOOLTIP_TAG} label="${label}" hover="${hover}"></${TOOLTIP_TAG}>`
        i = tooltip.end
        continue
      }
    }

    out += c
    i += 1
  }
  return out
}

/** Parse a `[label]{hover}` beginning at `pos` (where `input[pos] === "["`). */
function parseTooltip(
  input: string,
  pos: number,
): { label: string; hover: string; end: number } | null {
  const label = scanSpan(input, pos, "[", "]")
  if (!label) return null
  if (input[label.end] !== "{") return null

  const hover = scanSpan(input, label.end, "{", "}")
  if (!hover) return null

  return { label: label.content, hover: hover.content, end: hover.end }
}

/**
 * Scan a balanced `open`…`close` span starting at `start` (where
 * `input[start] === open`). Honours backslash escapes, skips over `$…$` / `$$…$$`
 * math (so TeX braces like `\mathbb{R}` don't throw off the balance), and tracks
 * nesting so a span may contain further tooltips. Returns the inner content and
 * the index just past the closing delimiter, or `null` if unterminated.
 */
function scanSpan(
  input: string,
  start: number,
  open: string,
  close: string,
): { content: string; end: number } | null {
  const from = start + 1
  let depth = 1
  let i = from
  while (i < input.length) {
    const c = input[i]

    if (c === "\\") {
      i += 2
      continue
    }
    if (c === "$") {
      i = skipMath(input, i)
      continue
    }
    if (c === open) {
      depth += 1
    } else if (c === close) {
      depth -= 1
      if (depth === 0) return { content: input.slice(from, i), end: i + 1 }
    }
    i += 1
  }
  return null
}

/**
 * Return the index just past a backtick code span starting at `pos` (a run of
 * `n` backticks closed by the next run of exactly `n`). Covers both inline code
 * and fenced blocks. If the run is never closed, return the index just past the
 * opening backticks so the rest of the input is still scanned for tooltips —
 * matching Markdown, which then treats the stray backticks as literal text.
 */
function skipCode(input: string, pos: number): number {
  let n = 0
  while (input[pos + n] === "`") n += 1

  let i = pos + n
  while (i < input.length) {
    if (input[i] !== "`") {
      i += 1
      continue
    }
    let run = 0
    while (input[i + run] === "`") run += 1
    if (run === n) return i + run
    i += run
  }
  return pos + n
}

/**
 * Return the index just past a `$…$` or `$$…$$` math run starting at `pos`. If
 * the run is unterminated, treat the `$` as an ordinary character and advance by
 * one so scanning can continue.
 */
function skipMath(input: string, pos: number): number {
  const delim = input[pos + 1] === "$" ? "$$" : "$"
  let i = pos + delim.length
  while (i < input.length) {
    if (input[i] === "\\") {
      i += 2
      continue
    }
    if (input.startsWith(delim, i)) return i + delim.length
    i += 1
  }
  return pos + 1
}
