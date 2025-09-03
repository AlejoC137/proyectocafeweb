import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold font-PlaywriteDE transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-blue disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-cobalt-blue text-white shadow-md hover:bg-cobalt-blue/90 hover:shadow-lg",
        destructive:
          "bg-red-500 text-white shadow-md hover:bg-red-500/90 hover:shadow-lg",
        outline:
          "border border-sage-green bg-white shadow-sm hover:bg-sage-green/10 hover:text-sage-green text-sage-green",
        secondary:
          "bg-terracotta-pink text-white shadow-md hover:bg-terracotta-pink/90 hover:shadow-lg",
        ghost: "hover:bg-sage-green/10 hover:text-sage-green text-gray-700",
        link: "text-cobalt-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
