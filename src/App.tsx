import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  useReactFlow,
  ConnectionMode,
  MarkerType,
  type Edge,
  type Connection,
  type OnConnectEnd,
  type DefaultEdgeOptions,
} from "@xyflow/react"
import type { PanelImperativeHandle } from "react-resizable-panels"
import { PanelRightClose, PanelRightOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { nodeTypes, SatisfiedWorldsContext, FormulaActiveContext, type CircleNode } from "@/components/circle-node"
import { SelfLoopEdge } from "@/components/self-loop-edge"
import { RelationEdge } from "@/components/relation-edge"
import { Sidebar } from "@/components/sidebar"
import { RightSidebar } from "@/components/right-sidebar"
import { layoutNodes, type LayoutAlgorithm } from "@/lib/layout"
import { parseFormula } from "@/lib/formulaFromAst"
import { validInModel } from "@/lib/ModelChecker"
import type { KripkeModel } from "@/lib/ModelTypes"
import { LoadModelContext, type LoadModel } from "@/lib/loadModel"

const initialNodes: CircleNode[] = [
  {
    id: "0",
    type: "circle",
    data: { label: "w0", propositions: [] },
    position: { x: 0, y: 50 },
  },
]

let id = 1
const getId = () => `${id++}`
const nodeOrigin: [number, number] = [0.5, 0.5]

// Directed edges (the accessibility relation) drawn with an arrowhead.
const defaultEdgeOptions: DefaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
  reconnectable: true,
}

// React Flow's built-in edge renderers: curved bezier vs. straight line.
type EdgeVariant = "default" | "straight"

// Accent for the hovered edge (stroke + arrowhead). Matches the link blue used
// elsewhere and reads on both light and dark canvases.
const EDGE_HOVER_COLOR = "#3b82f6"

// Self-loops arc around the node (SelfLoopEdge); every other edge goes through
// RelationEdge, which bows reciprocal pairs apart so direction stays readable.
const edgeTypes = { selfloop: SelfLoopEdge, relation: RelationEdge }

type PaneMenu = { screenX: number; screenY: number } | null

const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<CircleNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { screenToFlowPosition, fitView } = useReactFlow()

  const [menu, setMenu] = useState<PaneMenu>(null)
  const [edgeVariant, setEdgeVariant] = useState<EdgeVariant>("default")
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<LayoutAlgorithm>("layered")
  const [isLayouting, setIsLayouting] = useState(false)

  // The right rail is a collapsible ResizablePanel; we drive it imperatively
  // (v4 exposes collapse/expand through the `panelRef` prop, not React's ref)
  // and mirror its collapsed state so the canvas toggle shows the right icon.
  const rightPanelRef = useRef<PanelImperativeHandle>(null)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  const toggleRightPanel = useCallback(() => {
    const panel = rightPanelRef.current
    if (!panel) return
    if (panel.isCollapsed()) panel.expand()
    else panel.collapse()
  }, [])

  // The proposition typed in the sidebar. Owned here so it can be handed both to
  // the sidebar (for editing) and to the parser.
  const [proposition, setProposition] = useState("")

  // World ids satisfying the current proposition. Derived from the model, but
  // kept in its own state (not written back into `nodes`) so the model never
  // depends on its own output. Nodes read it via SatisfiedWorldsContext.
  const [satisfiedWorlds, setSatisfiedWorlds] = useState<Set<string>>(new Set())

  // Non-null while the current proposition can't be parsed (incomplete or
  // invalid). Shown in the sidebar rather than logged, since a half-typed
  // formula failing to parse is expected, not an error.
  const [formulaError, setFormulaError] = useState<string | null>(null)

  // Resolve each edge's renderer and shape. Self-loops get SelfLoopEdge; every
  // other edge is a RelationEdge carrying the current bezier/straight variant.
  // Edges whose reverse also exists are flagged `bidirectional` so RelationEdge
  // bows the pair into two distinct lanes. The toggle applies live to all edges.
  //
  // Hovering an edge highlights it (thicker blue stroke + matching arrowhead,
  // raised above its neighbours) and dims every other edge, so a single relation
  // stays traceable through a crowded graph.
  const displayedEdges = useMemo(() => {
    const present = new Set(edges.map((e) => `${e.source}->${e.target}`))
    const anyHovered = hoveredEdgeId !== null
    return edges.map((edge) => {
      const hovered = edge.id === hoveredEdgeId
      const style = {
        ...edge.style,
        ...(hovered
          ? { stroke: EDGE_HOVER_COLOR, strokeWidth: 3 }
          : { opacity: anyHovered ? 0.2 : 1 }),
      }
      const markerEnd = {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        ...(hovered ? { color: EDGE_HOVER_COLOR } : {}),
      }
      const base = { ...edge, style, markerEnd, zIndex: hovered ? 1000 : 0 }
      if (edge.source === edge.target) {
        return { ...base, type: "selfloop" }
      }
      return {
        ...base,
        type: "relation",
        data: {
          ...edge.data,
          variant: edgeVariant,
          bidirectional: present.has(`${edge.target}->${edge.source}`),
        },
      }
    })
  }, [edges, edgeVariant, hoveredEdgeId])

  const nodeById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  )

  // A fingerprint of everything the model checker actually cares about — world
  // ids, their valuations, and the accessibility relation — but NOT positions.
  // Dragging a node rewrites `nodes` every frame; without this, `model` (and the
  // checking effect below) would recompute on every frame of a drag. Keying the
  // model on a value that ignores positions keeps its reference stable while a
  // world is only being moved, so the checker runs on genuine model changes.
  const modelSignature = useMemo(
    () =>
      JSON.stringify({
        worlds: nodes.map((n) => [n.id, n.data.propositions]),
        edges: edges.map((e) => [e.source, e.target]),
      }),
    [nodes, edges],
  )

  // Display labels of the satisfying worlds. Resolved from ids (which stay the
  // unique key we match on) so renamed worlds show their custom label, even if
  // two worlds happen to share one.
  const satisfiedLabels = useMemo(
    () =>
      Array.from(satisfiedWorlds)
        .map((worldId) => nodeById.get(worldId)?.data.label)
        .filter((label): label is string => label !== undefined),
    [satisfiedWorlds, nodeById],
  )

  // Labels of the worlds where the proposition fails: the complement of the
  // satisfying set over every world. Empty when no proposition is entered,
  // since without an A there is nothing for a world to falsify.
  const unsatisfiedLabels = useMemo(
    () =>
      proposition.trim()
        ? nodes
            .filter((node) => !satisfiedWorlds.has(node.id))
            .map((node) => node.data.label)
        : [],
    [proposition, nodes, satisfiedWorlds],
  )

  // The bundle the model checker consumes. Rebuilt only when `modelSignature`
  // changes (worlds, valuations, or edges) — never for a mere position change —
  // so it stays live without churning on every drag frame.
  const model: KripkeModel = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const adjacency = new Map<string, string[]>()
    // Seed every node so isolated worlds (no outgoing edges) still appear.
    for (const node of nodes) adjacency.set(node.id, [])
    for (const edge of edges) adjacency.get(edge.source)?.push(edge.target)
    return { nodeById: byId, adjacency }
    // Intentionally keyed on the position-free signature, not nodes/edges.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelSignature])

  // Parse the proposition into a checkable Formula whenever it (or the model)
  // changes, then record which worlds satisfy it.
  useEffect(() => {
    if (!proposition.trim()) {
      setSatisfiedWorlds(new Set())
      setFormulaError(null)
      return
    }
    try {
      const formula = parseFormula(proposition)
      setSatisfiedWorlds(new Set(validInModel(model, formula)))
      setFormulaError(null)
    } catch (err) {
      // Incomplete or invalid formula — surface it in the UI, keep the last
      // valid highlight so the graph doesn't flicker mid-edit.
      setFormulaError(err instanceof Error ? err.message : String(err))
    }
  }, [proposition, model])


  // Tracks whether a reconnect drag landed on a valid handle. If not, the edge
  // was dragged off into empty space and should be deleted.
  const edgeReconnectSuccessful = useRef(true)

  const addNodeAt = useCallback(
    (position: { x: number; y: number }) => {
      const newId = getId()
      setNodes((nds) =>
        nds.concat({
          id: newId,
          type: "circle",
          position,
          data: { label: `w${newId}`, propositions: [] },
          origin: [0.5, 0.5],
        }),
      )
    },
    [setNodes],
  )

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onEdgeMouseEnter = useCallback(
    (_: React.MouseEvent, edge: Edge) => setHoveredEdgeId(edge.id),
    [],
  )
  const onEdgeMouseLeave = useCallback(() => setHoveredEdgeId(null), [])

  // Re-position every world with ELK, then reframe. Runs on demand (the
  // "Auto-layout" button) rather than continuously, so manual drags are kept.
  const runLayout = useCallback(async () => {
    setIsLayouting(true)
    try {
      const laidOut = await layoutNodes(nodes, edges, layoutAlgorithm)
      setNodes(laidOut)
      requestAnimationFrame(() => fitView({ padding: 2 }))
    } finally {
      setIsLayouting(false)
    }
  }, [nodes, edges, layoutAlgorithm, setNodes, fitView])

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false
  }, [])

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els))
    },
    [setEdges],
  )

  const onReconnectEnd = useCallback(
    (_: unknown, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id))
      }
      edgeReconnectSuccessful.current = true
    },
    [setEdges],
  )

  // Drop a connection onto the empty pane to spawn a new world wired up to it.
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (connectionState.isValid) return

      const newId = getId()
      const { clientX, clientY } =
        "changedTouches" in event ? event.changedTouches[0] : event

      const newNode: CircleNode = {
        id: newId,
        type: "circle",
        position: screenToFlowPosition({ x: clientX, y: clientY }),
        data: { label: `w${newId}`, propositions: [] },
        origin: [0.5, 0.5],
      }

      setNodes((nds) => nds.concat(newNode))
      setEdges((eds) =>
        addEdge(
          {
            source: connectionState.fromNode?.id ?? newId,
            target: newId,
            sourceHandle: connectionState.fromHandle?.id ?? null,
            targetHandle: null,
          },
          eds,
        ),
      )
    },
    [screenToFlowPosition, setNodes, setEdges],
  )

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault()
      setMenu({ screenX: event.clientX, screenY: event.clientY })
    },
    [],
  )

  // Virtual anchor so the Base UI menu opens exactly at the cursor.
  const menuAnchor = useMemo(() => {
    if (!menu) return undefined
    return {
      getBoundingClientRect: () =>
        new DOMRect(menu.screenX, menu.screenY, 0, 0),
    }
  }, [menu])

  const addNodeFromMenu = useCallback(() => {
    if (!menu) return
    addNodeAt(
      screenToFlowPosition({ x: menu.screenX, y: menu.screenY }),
    )
    setMenu(null)
  }, [menu, addNodeAt, screenToFlowPosition])

  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setNodes, setEdges])

  // Replace the current graph with a model parsed from a ```demo block. Worlds
  // start on a circle (used as-is if layout fails), then ELK repositions them
  // with the currently selected algorithm; `fitView` reframes once committed.
  const loadModel = useCallback<LoadModel>(
    (demo) => {
      const n = demo.worlds.length
      const radius = Math.max(160, n * 45)
      const newNodes: CircleNode[] = demo.worlds.map((world, i) => {
        const angle = (2 * Math.PI * i) / n
        return {
          id: world.name,
          type: "circle",
          position:
            n === 1
              ? { x: 0, y: 0 }
              : { x: radius * Math.cos(angle), y: radius * Math.sin(angle) },
          data: { label: world.name, propositions: world.propositions },
          origin: nodeOrigin,
        }
      })

      // Dedupe edges by id so a repeated / bidirectional pair can't collide.
      const edgeById = new Map<string, Edge>()
      for (const { source, target } of demo.relation) {
        const edgeId = `${source}->${target}`
        edgeById.set(edgeId, { id: edgeId, source, target, ...defaultEdgeOptions })
      }

      // Keep the auto-id counter clear of any numeric world names so later
      // "Add world" clicks can't reuse a loaded id.
      id = demo.worlds.reduce((max, world) => {
        const parsed = Number(world.name)
        return Number.isInteger(parsed) && parsed >= max ? parsed + 1 : max
      }, 1)

      const newEdges = [...edgeById.values()]
      setNodes(newNodes)
      setEdges(newEdges)
      setProposition(demo.formula)

      // Auto-layout the freshly loaded model with the selected algorithm, then
      // reframe. On failure the circular positions above remain. Nodes aren't
      // measured yet, so ELK uses fallback dimensions — fine for initial placement.
      layoutNodes(newNodes, newEdges, layoutAlgorithm)
        .then((laidOut) => setNodes(laidOut))
        .catch(() => {})
        .finally(() =>
          requestAnimationFrame(() => fitView({ padding: 2 })),
        )
    },
    [setNodes, setEdges, setProposition, fitView, layoutAlgorithm],
  )


  return (
    <LoadModelContext.Provider value={loadModel}>
    <SatisfiedWorldsContext.Provider value={satisfiedWorlds}>
    <FormulaActiveContext.Provider value={Boolean(proposition.trim())}>
    <div className="flex h-svh w-full">
      <ScrollArea>
          <Sidebar
            value={proposition}
            onValueChange={setProposition}
            error={formulaError}
            satisfiedLabels={satisfiedLabels}
            unsatisfiedLabels={unsatisfiedLabels}
          />
      </ScrollArea>
      <div className="relative min-w-0 flex-1">
      <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel minSize="30%" className="relative">
      <ReactFlow<CircleNode, Edge>
        nodes={nodes}
        edges={displayedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onPaneContextMenu={onPaneContextMenu}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={40}
        defaultEdgeOptions={defaultEdgeOptions}
        deleteKeyCode={["Delete", "Backspace"]}
        edgesReconnectable
        fitView
        fitViewOptions={{ padding: 2 }}
        nodeOrigin={nodeOrigin}
        colorMode="system"
      >
        <Panel position="top-left" className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              addNodeAt({
                x: Math.random() * 300 - 150,
                y: Math.random() * 200,
              })
            }
          >
            Add world
          </Button>
          <Button size="sm" variant="destructive" onClick={deleteSelected}>
            Delete selected
          </Button>
        </Panel>
        <Panel position="top-right" className="flex items-start gap-2">
          <div className="flex flex-col gap-2 rounded-md border bg-card/80 p-3 text-xs shadow-sm backdrop-blur">
          <label className="flex items-center justify-between gap-4">
            <span className="font-medium">
              {edgeVariant === "straight" ? "Straight" : "Bezier"} edges
            </span>
            <Switch
              checked={edgeVariant === "straight"}
              onCheckedChange={(checked) =>
                setEdgeVariant(checked ? "straight" : "default")
              }
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="font-medium">
              {layoutAlgorithm === "stress" ? "Organic" : "Layered"} layout
            </span>
            <Switch
              checked={layoutAlgorithm === "stress"}
              onCheckedChange={(checked) =>
                setLayoutAlgorithm(checked ? "stress" : "layered")
              }
            />
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={runLayout}
            disabled={isLayouting}
          >
            {isLayouting ? "Laying out…" : "Auto-layout"}
          </Button>
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={toggleRightPanel}
            aria-label={rightCollapsed ? "Show right panel" : "Hide right panel"}
            title={rightCollapsed ? "Show right panel" : "Hide right panel"}
          >
            {rightCollapsed ? <PanelRightOpen /> : <PanelRightClose />}
          </Button>
        </Panel>
        <Background />
      </ReactFlow>

      <ContextMenu
        open={menu !== null}
        onOpenChange={(open) => {
          if (!open) setMenu(null)
        }}
      >
        <ContextMenuContent anchor={menuAnchor}>
          <ContextMenuLabel>Canvas</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={addNodeFromMenu}>Add world here</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        panelRef={rightPanelRef}
        collapsible
        collapsedSize="0%"
        minSize="15%"
        defaultSize="20%"
        maxSize="60%"
        onResize={(size) => setRightCollapsed(size.asPercentage === 0)}
        className="min-w-0"
      >
        <RightSidebar />
      </ResizablePanel>
      </ResizablePanelGroup>
      </div>
    </div>
    </FormulaActiveContext.Provider>
    </SatisfiedWorldsContext.Provider>
    </LoadModelContext.Provider>
  )
}

export function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  )
}

export default App
