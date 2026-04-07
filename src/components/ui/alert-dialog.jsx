import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const springOpen = { type: 'spring', stiffness: 400, damping: 28 }
const tweenExit = { duration: 0.12, ease: [0.23, 1, 0.32, 1] }

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:duration-100",
      className
    )}
    {...props}
    ref={ref} />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const [uiState, setUiState] = React.useState('open')
  const innerRef = React.useRef(null)

  const mergedRef = React.useCallback((node) => {
    innerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }, [ref])

  React.useLayoutEffect(() => {
    const node = innerRef.current
    if (!node) return
    const sync = () => setUiState(node.getAttribute('data-state') || 'closed')
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(node, { attributes: true, attributeFilter: ['data-state'] })
    return () => mo.disconnect()
  }, [])

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content asChild {...props}>
        <motion.div
          ref={mergedRef}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
            className
          )}
          style={{ x: '-50%', y: '-50%' }}
          initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}
          animate={
            uiState === 'open'
              ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' }
              : { opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }
          }
          transition={uiState === 'open' ? springOpen : tweenExit}
        >
          {children}
        </motion.div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
})
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props} />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants(), className)} {...props} />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
    {...props} />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
