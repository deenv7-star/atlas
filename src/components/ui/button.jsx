import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"
// v7: pill buttons everywhere (owner refs 17.10), springy press via .press
const RADIUS = "rounded-full"

const buttonVariants = cva(
  `press inline-flex items-center justify-center gap-2 whitespace-nowrap ${RADIUS} text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0 select-none touch-manipulation`,
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-white shadow-[0_1px_2px_rgba(42,26,201,0.3),0_8px_20px_-8px_rgba(62,43,241,0.6)] hover:bg-brand-500 active:bg-brand-700",
        destructive:
          "bg-danger-500 text-white hover:bg-danger-600",
        outline:
          "border border-line bg-white text-navy-900 hover:bg-[#F7F8FC] hover:border-[#D9DCE6]",
        secondary:
          "bg-[#EEF0FF] text-brand-700 hover:bg-[#E4E6FF]",
        ghost: "text-navy-900 hover:bg-[#EEF0F6]",
        link: "text-brand-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-11 px-3.5 text-sm",
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