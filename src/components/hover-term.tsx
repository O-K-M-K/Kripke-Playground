import type { ReactNode } from "react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface HoverTermProps { 
    children: ReactNode;
    hover: ReactNode;
}

function HoverTerm( { children, hover} : HoverTermProps ) {
    return (
       <Tooltip>
            <TooltipTrigger render={<span className="decoration-dotted underline decoration-blue-500">{children}</span>} />
            <TooltipContent>
                {hover}
            </TooltipContent>
        </Tooltip> 
    )
}

export { HoverTerm }
