import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

// The visible track stays 44x24; the button itself is 44x44 so the tap target meets the 44px rule.
const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer group relative inline-flex h-11 w-11 shrink-0 cursor-pointer items-center rounded-full bg-transparent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      "before:pointer-events-none before:absolute before:inset-x-0 before:top-1/2 before:h-6 before:-translate-y-1/2 before:rounded-full before:shadow-sm before:transition-colors before:content-['']",
      "data-[state=checked]:before:bg-primary data-[state=unchecked]:before:bg-input focus-visible:before:ring-2 focus-visible:before:ring-ring focus-visible:before:ring-offset-2 focus-visible:before:ring-offset-background",
      className
    )}
    {...props}
    ref={ref}>
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none relative z-[1] ms-0.5 block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-spring data-[state=checked]:translate-x-5 rtl:data-[state=checked]:-translate-x-5 data-[state=unchecked]:translate-x-0"
      )} />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
