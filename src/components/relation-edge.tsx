import {
  BaseEdge,
  getBezierPath,
  getStraightPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react"

export type RelationEdgeData = {
  // Mirrors the canvas "Bezier / Straight" toggle for solo edges.
  variant?: "default" | "straight"
  // True when a reciprocal edge exists (A→B and B→A). Such edges are bowed so
  // the pair reads as two separate arcs instead of one overlapping line.
  bidirectional?: boolean
}

export type RelationEdgeType = Edge<RelationEdgeData, "relation">

// How far a bowed edge's belly pushes off the straight line between the nodes.
const BOW = 30

/**
 * The accessibility relation drawn between two distinct worlds. A solo edge
 * renders as the selected bezier / straight variant. When a reciprocal edge is
 * present, both edges arc to the LEFT of their own direction of travel — so the
 * mutual relation separates into two lanes, each keeping its own arrowhead, and
 * the direction of every arrow stays legible even where several meet at a node.
 */
export function RelationEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  interactionWidth,
  data,
}: EdgeProps<RelationEdgeType>) {
  let path: string

  if (data?.bidirectional) {
    // Quadratic arc whose control point sits off the midpoint along the LEFT
    // normal of the source→target direction. The reverse edge computes its own
    // left normal (which points the opposite way in absolute terms), so the two
    // bow to opposite sides.
    const mx = (sourceX + targetX) / 2
    const my = (sourceY + targetY) / 2
    const dx = targetX - sourceX
    const dy = targetY - sourceY
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const cx = mx + nx * BOW
    const cy = my + ny * BOW
    path = `M ${sourceX},${sourceY} Q ${cx},${cy} ${targetX},${targetY}`
  } else if (data?.variant === "straight") {
    ;[path] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  } else {
    ;[path] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })
  }

  return (
    <BaseEdge
      path={path}
      markerEnd={markerEnd}
      style={style}
      interactionWidth={interactionWidth}
    />
  )
}
