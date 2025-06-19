'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface TruncatedTextWithTooltipProps {
  text: string;
  className?: string;
  asChild?: boolean;
}

export function TruncatedTextWithTooltip({ text, className, asChild = false }: TruncatedTextWithTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild={asChild}>
          <p className={cn("truncate", className)}>
            {text}
          </p>
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 