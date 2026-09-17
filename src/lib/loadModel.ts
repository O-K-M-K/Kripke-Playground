import { createContext, useContext } from "react"
import type { ParsedDemo } from "@/lib/demoModel"

// Loads a parsed ```demo model into the live graph (worlds, edges, formula).
// Provided by `Flow` (App.tsx), consumed by the demo button rendered deep in
// the lesson content. Defaults to a no-op so `RichText` renders safely outside
// the app shell (e.g. in isolation/tests).
export type LoadModel = (demo: ParsedDemo) => void

export const LoadModelContext = createContext<LoadModel>(() => {})

export function useLoadModel(): LoadModel {
  return useContext(LoadModelContext)
}
