"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "tap inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-muted p-0.5 transition-colors outline-none",
        "data-[checked]:bg-primary",
        "focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "size-5 rounded-full bg-background shadow-sm transition-transform",
          "translate-x-0 data-[checked]:translate-x-4",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
