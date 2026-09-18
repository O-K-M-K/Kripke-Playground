import type { KripkeModel, WorldId, Formula } from "./ModelTypes"


// Building a formula
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

export const valuation = (
  model: KripkeModel,
  world: WorldId,
  p: string,
): boolean => model.nodeById.get(world)?.data.propositions.includes(p) ?? false

export const satisfies = (m : KripkeModel, f: Formula, w: WorldId) : boolean => {
    switch (f.tag) {
        case "Top" : return true
        case "Bot" : return false
        case "P" : return valuation(m, w, f.value)
        case "Not" : return !satisfies(m, f.formula, w)
        case "And" : return (satisfies(m, f.left, w) && satisfies(m, f.right, w))
        case "Box" : {
            const connectedSet = m.adjacency.get(w) ?? []
            return Array.from(connectedSet).every((wNext) => satisfies(m, f.formula, wNext))
        }
    }
}

// KripkeModel technically holds all worlds inside  adjacency keys so no need to take in nodes
// TODO : maybe make it return list of nodes or have app.tsx map over the list of world id's turning them into nodes 
// so then can easily set colour of each node to show if they are valid or not. Maybe this is best as then can just loop and go if id in list
// as we don't hold list of invalid worlds in model
export const validInModel = (m: KripkeModel, f: Formula) : string[] => {
    const worldsIds = Array.from(m.adjacency.keys())
    return worldsIds.filter(w => satisfies(m, f, w))

}

