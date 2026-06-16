import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20",
        accent: "bg-accent text-dark-bg hover:bg-accent-hover shadow-lg shadow-accent/20 font-semibold",
        destructive: "bg-danger text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
        outline: "border border-dark-border bg-transparent hover:bg-dark-card hover:border-primary/50 text-gray-300",
        secondary: "bg-dark-card text-gray-300 hover:bg-dark-border border border-dark-border",
        ghost: "text-gray-400 hover:text-white hover:bg-dark-card",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export { buttonVariants }
