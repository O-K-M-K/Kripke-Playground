// Eagerly bundle every .md file in src/content as a raw string. Vite inlines
// these at build time, so lookups below are synchronous.
const files = import.meta.glob("../content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>

// Map bare file names (with and without the .md extension) to their contents.
const byName = new Map<string, string>()
for (const [path, content] of Object.entries(files)) {
  const base = path.split("/").pop()! // e.g. "explainer.md"
  byName.set(base, content)
  byName.set(base.replace(/\.md$/, ""), content) // e.g. "explainer"
}

/**
 * Read a Markdown file from `src/content` by name. The `.md` extension is
 * optional, so both `readContent("explainer")` and `readContent("explainer.md")`
 * work. Throws if no such file exists.
 */
export function readContent(name: string): string {
  const content = byName.get(name)
  if (content === undefined) {
    const available = [...byName.keys()].filter((k) => k.endsWith(".md"))
    throw new Error(
      `No content file named "${name}". Available: ${available.join(", ")}`,
    )
  }
  return content
}
