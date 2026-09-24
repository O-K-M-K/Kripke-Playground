import type { ELK as ElkEngine, ElkNode, LayoutOptions } from "elkjs/lib/elk-api"
import type { Edge } from "@xyflow/react"
import type { CircleNode } from "@/components/circle-node"

// One shared engine, lazily constructed on first layout. The bundled build is
// ~1.4MB, so we dynamic-import it (keeping it out of the initial bundle) and
// build the engine once. It runs in-process — no worker file to wire into Vite.
let elkPromise: Promise<ElkEngine> | null = null
function getElk(): Promise<ElkEngine> {
  if (!elkPromise) {
    elkPromise = import("elkjs/lib/elk.bundled.js").then(
      ({ default: ELK }) => new ELK(),
    )
  }
  return elkPromise
}

export type LayoutAlgorithm = "layered" | "stress"

// Fallbacks for nodes React Flow hasn't measured yet (e.g. straight after a
// model load, before first paint). Match the ~96px circle plus its proposition
// row so spacing is roughly right even without measurements.
const DEFAULT_WIDTH = 96
const DEFAULT_HEIGHT = 130

const OPTIONS: Record<LayoutAlgorithm, LayoutOptions> = {
  // Hierarchical: ranks worlds along the accessibility flow, top to bottom.
  layered: {
    "elk.algorithm": "layered",
    "elk.direction": "DOWN",
    "elk.layered.spacing.nodeNodeBetweenLayers": "110",
    "elk.spacing.nodeNode": "90",
  },
  // Organic: distance-minimising placement that reads well for cyclic and
  // symmetric frames where no hierarchy exists. Deterministic, unlike force.
  stress: {
    "elk.algorithm": "stress",
    "org.eclipse.elk.stress.desiredEdgeLength": "180",
    "elk.spacing.nodeNode": "90",
  },
}

/**
 * Compute new positions for `nodes` with ELK and return updated node objects
 * (positions only — data, ids and everything else are preserved). Async; call
 * it from an event handler and `setNodes` with the result, then `fitView`.
 *
 * Self-loops are excluded from the layout graph: they never inform placement and
 * only muddy layered ranking. Real node dimensions are used when React Flow has
 * measured them, so variable-height worlds (those with proposition sets) don't
 * overlap.
 */
export async function layoutNodes(
  nodes: CircleNode[],
  edges: Edge[],
  algorithm: LayoutAlgorithm,
): Promise<CircleNode[]> {
  if (nodes.length === 0) return nodes

  const graph: ElkNode = {
    id: "root",
    layoutOptions: OPTIONS[algorithm],
    children: nodes.map((n) => ({
      id: n.id,
      width: n.measured?.width ?? DEFAULT_WIDTH,
      height: n.measured?.height ?? DEFAULT_HEIGHT,
    })),
    edges: edges
      .filter((e) => e.source !== e.target)
      .map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  }

  const elk = await getElk()
  const laidOut = await elk.layout(graph)
  const byId = new Map((laidOut.children ?? []).map((c) => [c.id, c]))

  return nodes.map((n) => {
    const c = byId.get(n.id)
    if (!c || c.x === undefined || c.y === undefined) return n
    const w = c.width ?? DEFAULT_WIDTH
    const h = c.height ?? DEFAULT_HEIGHT
    // Nodes use a centre origin ([0.5, 0.5]); ELK reports the top-left corner,
    // so shift by half the size to place the centre where ELK put the corner.
    return { ...n, position: { x: c.x + w / 2, y: c.y + h / 2 } }
  })
}
