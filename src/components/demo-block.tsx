import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { parseDemo } from "@/lib/demoModel"
import { useLoadModel } from "@/lib/loadModel"

/**
 * Renders a ```demo fenced block as a button that loads its Kripke model into
 * the graph. Parsing happens once up front so a malformed block surfaces its
 * error inline instead of failing on click.
 */
export function DemoBlock({ source }: { source: string }) {
  const loadModel = useLoadModel()
  const parsed = useMemo(() => {
    try {
      return { demo: parseDemo(source), error: null as string | null }
    } catch (err) {
      return { demo: null, error: err instanceof Error ? err.message : String(err) }
    }
  }, [source])

  if (parsed.error) {
    return (
      <div className="my-3 rounded-md border border-red-500/40 bg-red-500/5 px-3 py-2 font-mono text-xs text-red-600 dark:text-red-400">
        Demo block error: {parsed.error}
      </div>
    )
  }

  const demo = parsed.demo!
  return (
    <div className="my-3">
      <Button size="sm" onClick={() => loadModel(demo)}>
        {demo.label}
      </Button>
    </div>
  )
}
