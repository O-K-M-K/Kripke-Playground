import type { CircleNode } from "@/components/circle-node"

export type WorldId = string

// A Kripke model, decoupled from React Flow: just the frontier the checker
// needs. Both maps are exactly what `Flow` already memoizes in App.tsx.
export type KripkeModel = {
  // worldId -> node (carries the label and its valuation via data.propositions)
  nodeById: Map<WorldId, CircleNode>
  // worldId -> ids of worlds accessible from it (the accessibility relation)
  adjacency: Map<WorldId, WorldId[]>
}

export type Formula =
    | { tag: "Top" }
    | { tag: "Bot" }
    | { tag: "P"; value: string}
    | { tag: "Not"; formula: Formula}
    | { tag: "And"; left: Formula; right: Formula }
    | { tag: "Box"; formula: Formula};

export const Top: Formula = { tag: "Top" };
export const Bot: Formula = { tag: "Bot" };
export const P = (value: string): Formula => ({ tag: "P", value });
export const Not = (formula: Formula): Formula => ({ tag: "Not", formula });
export const And = (left: Formula, right: Formula): Formula => ({ tag: "And", left, right });
export const Box = (formula: Formula): Formula => ({ tag: "Box", formula });
export const or = (a : Formula, b: Formula) : Formula => {
    return {tag : "Not", formula: {tag : "And", left : {tag : "Not", formula: a}, right : {tag : "Not", formula: b}}}
}
export const diamond = (f: Formula) : Formula => {
    return {tag : "Not", formula: {tag : "Box", formula : {tag : "Not", formula: f}}}
}
export const implies = (a: Formula, b: Formula) : Formula => {
    return {tag : "Not", formula : {tag : "And", left : a, right : {tag : "Not", formula : b}}}
}



