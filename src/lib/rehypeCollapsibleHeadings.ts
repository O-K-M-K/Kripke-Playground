import type { Root, Element, ElementContent } from "hast"
import type { Plugin } from "unified"

/** Map heading tag names to their depth (h1 → 1 … h6 → 6). */
const HEADING_DEPTH: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
}

/**
 * Rehype plugin that turns every heading into a collapsible section: each
 * heading becomes the `<summary>` of a `<details>` whose body is all the content
 * up to the next heading of the same or higher level. Sections nest by depth, so
 * an `h3` collapsible lives inside its parent `h2` collapsible.
 *
 * Runs on the final hast (after rehype-raw / rehype-katex), so it only moves
 * already-processed subtrees around — math, demo blocks and tooltips are
 * untouched. Sections default to open; remove `open: true` below to start
 * collapsed.
 */
const rehypeCollapsibleHeadings: Plugin<[], Root> = () => (tree) => {
  tree.children = group(tree.children as ElementContent[]) as Root["children"]
}

function group(children: ElementContent[]): ElementContent[] {
  const result: ElementContent[] = []
  // Open sections, innermost last. Each new heading closes any open section of
  // equal-or-greater depth before it starts.
  const stack: { depth: number; details: Element }[] = []

  for (const node of children) {
    const depth =
      node.type === "element" ? (HEADING_DEPTH[node.tagName] ?? 0) : 0

    const parent = stack.length ? stack[stack.length - 1].details.children : result

    if (depth) {
      while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop()
      const target = stack.length
        ? stack[stack.length - 1].details.children
        : result

      const summary: Element = {
        type: "element",
        tagName: "summary",
        properties: {},
        children: [node],
      }
      const details: Element = {
        type: "element",
        tagName: "details",
        properties: { open: true },
        children: [summary],
      }
      target.push(details)
      stack.push({ depth, details })
    } else {
      parent.push(node)
    }
  }

  return result
}

export { rehypeCollapsibleHeadings }
