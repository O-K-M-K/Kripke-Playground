import { useEffect, useRef, useState } from "react"
import {
  Handle,
  Position,
  useReactFlow,
  type NodeProps,
  type Node,
} from "@xyflow/react"
import { Plus, X } from "lucide-react"

export type CircleNodeData = {
  label: string
  // The valuation: atomic propositions that hold at this world.
  propositions: string[]
}

export type CircleNode = Node<CircleNodeData, "circle">

// Visible grab targets for starting a connection. They brighten on hover /
// selection and stay faintly visible otherwise.
const handleStyle =
  "size-3! border-2! border-background! bg-primary! opacity-40! transition-opacity duration-150 group-hover:opacity-100!"

// The set of atomic propositions true at a world, rendered beneath its circle.
// Each can be removed on hover, and new ones added through an inline input.
function PropositionSet({
  propositions,
  onAdd,
  onRemove,
}: {
  propositions: string[]
  onAdd: (value: string) => void
  onRemove: (value: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const commit = () => {
    onAdd(draft)
    setDraft("")
    // Keep the input open so several propositions can be added in a row.
    inputRef.current?.focus()
  }

  const brace = "font-mono text-sm leading-none text-muted-foreground"

  return (
    <div className="nodrag flex max-w-40 flex-wrap items-center justify-center gap-1">
      {propositions.length === 0 ? (
        <span className={brace}>{"{}"}</span>
      ) : (
        <>
          <span className={brace}>{"{"}</span>
          {propositions.map((p) => (
            <span
              key={p}
              className="group/prop inline-flex items-center gap-0.5 rounded-full bg-secondary py-0.5 pr-1 pl-1.5 font-mono text-xs text-secondary-foreground"
            >
              {p}
              <button
                type="button"
                aria-label={`Remove ${p}`}
                onClick={() => onRemove(p)}
                className="grid size-3 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity group-hover/prop:opacity-100 hover:text-foreground"
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))}
          <span className={brace}>{"}"}</span>
        </>
      )}

      {adding ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onAdd(draft)
            setDraft("")
            setAdding(false)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") {
              setDraft("")
              setAdding(false)
            }
          }}
          placeholder="p"
          className="h-5 w-10 rounded-full border border-input bg-background px-2 text-center font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      ) : (
        <button
          type="button"
          aria-label="Add proposition"
          onClick={() => setAdding(true)}
          className="grid size-5 place-items-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <Plus className="size-3" />
        </button>
      )}
    </div>
  )
}

export function CircleNode({ id, data, selected }: NodeProps<CircleNode>) {
  const { updateNodeData } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(data.label)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep the local draft in sync when the label changes elsewhere.
  useEffect(() => {
    setValue(data.label)
  }, [data.label])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    const next = value.trim() || data.label
    updateNodeData(id, { label: next })
    setValue(next)
    setEditing(false)
  }

  const addProposition = (raw: string) => {
    const name = raw.trim()
    if (!name || data.propositions.includes(name)) return
    updateNodeData(id, { propositions: [...data.propositions, name] })
  }

  const removeProposition = (name: string) => {
    updateNodeData(id, {
      propositions: data.propositions.filter((p) => p !== name),
    })
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        onDoubleClick={() => setEditing(true)}
        className={`group flex size-24 items-center justify-center rounded-full border-2 bg-card text-center text-sm font-medium shadow-sm transition-colors ${
          selected ? "border-primary [&_.react-flow\\_\\_handle]:opacity-100!" : "border-border"
        }`}
      >
        {/* Loose connection mode lets each handle act as both source and target,
            which enables bidirectional and self-connecting edges. The bottom is
            left open so the proposition set's add button stays clear. */}
        <Handle id="top" type="source" position={Position.Top} className={handleStyle} />
        <Handle id="right" type="source" position={Position.Right} className={handleStyle} />
        <Handle id="left" type="source" position={Position.Left} className={handleStyle} />

        {editing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
              if (e.key === "Escape") {
                setValue(data.label)
                setEditing(false)
              }
            }}
            className="nodrag w-16 rounded-sm border border-input bg-background px-1 py-0.5 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        ) : (
          <span className="pointer-events-none max-w-20 truncate px-1">
            {data.label}
          </span>
        )}
      </div>

      <PropositionSet
        propositions={data.propositions}
        onAdd={addProposition}
        onRemove={removeProposition}
      />
    </div>
  )
}

export const nodeTypes = { circle: CircleNode }
