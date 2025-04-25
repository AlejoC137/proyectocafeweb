"use client"

import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

export function Switch({ checked, onCheckedChange, className, ...props }) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        "inline-flex h-6 w-[40pxs] cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-[20px] w-[20px] rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-[19px]" : "translate-x-[-16px]",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

