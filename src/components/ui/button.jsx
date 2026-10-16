import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"
import { isPlayful } from "@/ui-direction/flag"

// v4: 12px radius (A), fully round (B, playful light)
const RADIUS = isPlayful ? "rounded-full" : "rounded-[12px]"

const buttonVariants = cva(
  `press inline-flex items-center justify-center gap-2 whitespace-nowrap ${RADIUS} text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0 select-none touch-manipulation`,
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-white shadow-[0_1px_2px_rgba(42,26,201,0.2),0_6px_16px_rgba(62,43,241,0.22)] hover:bg-brand-500 active:bg-brand-700",
        destructive:
          "bg-danger-500 text-white hover:bg-danger-600",
        outline:
          "border border-line bg-white text-navy-900 shadow-[0_1px_2px_rgba(27,38,86,0.05)] hover:bg-neutral-50 hover:border-neutral-300",
        secondary:
          "bg-brand-50 text-brand-700 hover:bg-brand-100",
        ghost: "text-navy-900 hover:bg-neutral-100",
        link: "text-brand-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 px-3.5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
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
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }