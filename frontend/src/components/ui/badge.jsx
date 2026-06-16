import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/20 text-primary border border-primary/30",
        accent: "bg-accent/20 text-accent border border-accent/30",
        destructive: "bg-danger/20 text-danger border border-danger/30",
        warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
        success: "bg-green-500/20 text-green-400 border border-green-500/30",
        outline: "text-gray-400 border border-dark-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
