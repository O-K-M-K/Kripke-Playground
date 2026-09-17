import { Fragment } from "react"
import Markdown, { type Components } from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import { HoverTerm } from "@/components/hover-term"
import { DemoBlock } from "@/components/demo-block"
import { encodeTooltips, TOOLTIP_TAG } from "@/lib/tooltipMarkup"
import { DEMO_LANGUAGE } from "@/lib/demoModel"

/** Flatten a React node tree into its plain text (used to read fenced-block source). */
function nodeText(node: React.ReactNode): string {
  if (typeof node === "string") return node
  if (Array.isArray(node)) return node.map(nodeText).join("")
  if (node && typeof node === "object" && "props" in node) {
    return nodeText((node as { props?: { children?: React.ReactNode } }).props?.children)
  }
  return ""
}

/** Read a URI-encoded attribute off a rehype element node, decoded. */
function readAttr(node: unknown, name: string): string {
  const props = (node as { properties?: Record<string, unknown> })?.properties
  const raw = props?.[name]
  return typeof raw === "string" ? decodeURIComponent(raw) : ""
}

/**
 * Build the component overrides for {@link Markdown}. The `<kripke-tooltip>`
 * element (produced by {@link encodeTooltips}) becomes a {@link HoverTerm} whose
 * label and hover are rendered recursively. When `inline` is set, paragraphs
 * collapse to fragments so nested content flows inline inside the trigger.
 */
type ElementProps = { children?: React.ReactNode; href?: string }

function makeComponents(inline: boolean): Components {
  const components: Record<string, unknown> = {
    [TOOLTIP_TAG]: ({ node }: { node?: unknown }) => (
      <HoverTerm hover={<RichText inline>{readAttr(node, "hover")}</RichText>}>
        <RichText inline>{readAttr(node, "label")}</RichText>
      </HoverTerm>
    ),
    h1: ({ children }: ElementProps) => (
      <h1 className="mt-6 mb-3 text-3xl font-bold tracking-tight">{children}</h1>
    ),
    h2: ({ children }: ElementProps) => (
      <h2 className="mt-6 mb-2 text-2xl font-semibold tracking-tight">{children}</h2>
    ),
    h3: ({ children }: ElementProps) => (
      <h3 className="mt-4 mb-2 text-xl font-semibold">{children}</h3>
    ),
    h4: ({ children }: ElementProps) => (
      <h4 className="mt-4 mb-1 text-lg font-semibold">{children}</h4>
    ),
    a: ({ children, href }: ElementProps) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400"
      >
        {children}
      </a>
    ),
    ul: ({ children }: ElementProps) => (
      <ul className="my-3 list-disc pl-6 space-y-1">{children}</ul>
    ),
    ol: ({ children }: ElementProps) => (
      <ol className="my-3 list-decimal pl-6 space-y-1">{children}</ol>
    ),
    code: ({ children }: ElementProps) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{children}</code>
    ),
    // Fenced ```demo blocks become a "load this model" button; every other
    // fenced block renders as a normal preformatted box.
    pre: ({ children }: ElementProps) => {
      const child = children as React.ReactElement<{ className?: string }> | undefined
      const className = child?.props?.className ?? ""
      if (new RegExp(`language-${DEMO_LANGUAGE}`, "i").test(className)) {
        return <DemoBlock source={nodeText(children)} />
      }
      return (
        <pre className="my-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-sm">
          {children}
        </pre>
      )
    },
    blockquote: ({ children }: ElementProps) => (
      <blockquote className="my-3 border-l-2 border-border pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
  }
  if (inline) {
    components.p = ({ children }: ElementProps) => (
      <Fragment>{children}</Fragment>
    )
  } else {
    components.p = ({ children }: ElementProps) => (
      <p className="my-3 leading-relaxed">{children}</p>
    )
  }
  return components as Components
}

const blockComponents = makeComponents(false)
const inlineComponents = makeComponents(true)

interface RichTextProps {
  /** The Markdown source (with our `(label){hover}` tooltips) to render. */
  children: string
  /** Collapse block wrappers so the content renders inline (used for tooltips). */
  inline?: boolean
}

/**
 * Render Markdown extended with `$…$`/`$$…$$` math (via KaTeX) and our
 * `(label){hover}` tooltip syntax.
 *
 *   <RichText>{"A **world** (v){a node $v \\in W$}. $\\forall x$."}</RichText>
 *
 * See {@link encodeTooltips} for the tooltip syntax.
 */
function RichText({ children, inline = false }: RichTextProps) {
  return (
    <Markdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={inline ? inlineComponents : blockComponents}
    >
      {encodeTooltips(children)}
    </Markdown>
  )
}

export { RichText }
