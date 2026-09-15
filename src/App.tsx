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

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { nodeTypes, SatisfiedWorldsContext, FormulaActiveContext, type CircleNode } from "@/components/circle-node"
import { Sidebar } from "@/components/sidebar"
import { parseFormula } from "./formulaFromAst"
import { validInModel } from "./ModelChecker"
import type { KripkeModel } from "./ModelTypes"

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

type PaneMenu = { screenX: number; screenY: number } | null

const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<CircleNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { screenToFlowPosition } = useReactFlow()

  const [menu, setMenu] = useState<PaneMenu>(null)
  const [edgeVariant, setEdgeVariant] = useState<EdgeVariant>("default")

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

  // The toggle applies live to every edge, not just newly created ones.
  const displayedEdges = useMemo(
    () => edges.map((edge) => ({ ...edge, type: edgeVariant })),
    [edges, edgeVariant],
  )

  const adjacencyMap = useMemo(() => {
    const map = new Map<string, string[]>()
    // Seed every node so isolated worlds (no outgoing edges) still appear.
    for (const node of nodes) map.set(node.id, [])
    for (const edge of edges) {
      map.get(edge.source)?.push(edge.target)
    }
    return map
  }, [nodes, edges])

  const nodeById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
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

  // The bundle the model checker consumes. Everything derives from React Flow
  // state, so it stays live as worlds, edges, and valuations change.
  const model: KripkeModel = useMemo(
    () => ({ nodeById, adjacency: adjacencyMap }),
    [nodeById, adjacencyMap],
  )

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


  return (
    <SatisfiedWorldsContext.Provider value={satisfiedWorlds}>
    <FormulaActiveContext.Provider value={Boolean(proposition.trim())}>
    <div className="flex h-svh w-full">
      <Sidebar
        value={proposition}
        onValueChange={setProposition}
        error={formulaError}
        satisfiedLabels={satisfiedLabels}
        unsatisfiedLabels={unsatisfiedLabels}
      />
      <div className="relative flex-1">
      <ReactFlow<CircleNode, Edge>
        nodes={nodes}
        edges={displayedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
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
        <Panel
          position="top-right"
          className="flex flex-col gap-2 rounded-md border bg-card/80 p-3 text-xs shadow-sm backdrop-blur"
        >
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
      </div>
    </div>
    </FormulaActiveContext.Provider>
    </SatisfiedWorldsContext.Provider>
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
