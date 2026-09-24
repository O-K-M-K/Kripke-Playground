import { BaseEdge, Position, type EdgeProps } from "@xyflow/react"

// How far the control points push out (OUT) and how far apart the loop's two
// legs sit (SPREAD). OUT is large enough that the curve's belly (~0.75·OUT from
// the handle line) clears the node's ~48px radius from any pair of handles.
const OUT = 86
const SPREAD = 34

// Outward-pointing unit normal for the side a handle sits on.
const normal = (position?: Position): [number, number] => {
  switch (position) {
    case Position.Top:
      return [0, -1]
    case Position.Bottom:
      return [0, 1]
    case Position.Left:
      return [-1, 0]
    default:
      return [1, 0] // Position.Right
  }
}

// Edge renderer used only when source === target. React Flow's built-in bezier /
// straight edges collapse a self-loop into a barely-visible stub through the
// node; this draws a cubic that arcs outward, around the circle, so the
// reflexive relation (and its arrowhead) reads clearly.
export function SelfLoopEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  interactionWidth,
}: EdgeProps) {
  const [snx, sny] = normal(sourcePosition)
  const [tnx, tny] = normal(targetPosition)

  // Direction the loop bulges. For same / adjacent handles the summed normals
  // already point away from the node. For opposite handles (e.g. left↔right)
  // they cancel, which used to let the curve sag straight back through the
  // node — so in that case arc over the side perpendicular to them instead.
  let bx = snx + tnx
  let by = sny + tny
  const blen = Math.hypot(bx, by)
  if (blen < 0.001) {
    bx = -sny
    by = snx
  } else {
    bx /= blen
    by /= blen
  }

  // Perpendicular to the bulge, used to separate the loop's two legs so it
  // reads as an open arc rather than a spike doubling back on itself.
  const px = -by
  const py = bx

  const cp1x = sourceX + bx * OUT - px * SPREAD
  const cp1y = sourceY + by * OUT - py * SPREAD
  const cp2x = targetX + bx * OUT + px * SPREAD
  const cp2y = targetY + by * OUT + py * SPREAD

  const path = `M ${sourceX},${sourceY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${targetX},${targetY}`

  return (
    <BaseEdge
      path={path}
      markerEnd={markerEnd}
      style={style}
      interactionWidth={interactionWidth}
    />
  )
}
