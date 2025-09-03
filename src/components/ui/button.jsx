import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium font-PlaywriteDE transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Botones básicos
        default: "bg-cream-bg text-cobalt-blue border border-cobalt-blue hover:bg-cobalt-blue hover:text-white",
        secondary: "bg-cream-bg text-sage-green border border-sage-green hover:bg-sage-green hover:text-white",
        destructive: "bg-cream-bg text-action-delete border border-action-delete hover:bg-action-delete hover:text-white",
        outline: "border border-input bg-cream-bg hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Estados OK/NA
        "status-ok": "bg-cream-bg text-status-ok border border-status-ok hover:bg-status-ok hover:text-white",
        "status-na": "bg-cream-bg text-status-na border border-status-na hover:bg-status-na hover:text-white",
        "status-pending": "bg-cream-bg text-status-pending border border-status-pending hover:bg-status-pending hover:text-white",
        
        // Acciones de edición
        "action-edit": "bg-cream-bg text-action-edit border border-action-edit hover:bg-action-edit hover:text-white",
        "action-save": "bg-cream-bg text-action-save border border-action-save hover:bg-action-save hover:text-white",
        "action-cancel": "bg-cream-bg text-action-cancel border border-action-cancel hover:bg-action-cancel hover:text-white",
        
        // Funciones de tarjetas y exportación
        "card-primary": "bg-cream-bg text-card-primary border border-card-primary hover:bg-card-primary hover:text-white",
        "excel-export": "bg-cream-bg text-excel-export border border-excel-export hover:bg-excel-export hover:text-white",
        "pdf-export": "bg-cream-bg text-pdf-export border border-pdf-export hover:bg-pdf-export hover:text-white",
        
        // Módulos específicos
        "almacen": "bg-cream-bg text-almacen-primary border border-almacen-primary hover:bg-almacen-primary hover:text-white",
        "produccion": "bg-cream-bg text-produccion-primary border border-produccion-primary hover:bg-produccion-primary hover:text-white",
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
