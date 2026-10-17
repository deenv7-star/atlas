import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-[14px] border border-line bg-white px-3.5 py-2 text-base md:text-[15px] text-navy-900 transition-[border-color,box-shadow] duration-150 hover:border-neutral-300 focus-visible:border-brand-600 focus-visible:shadow-[0_0_0_3px_rgba(62,43,241,0.14)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }