import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const springOpen = { type: 'spring', stiffness: 400, damping: 28 }
const tweenExit = { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }
const sheetSpring = { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 }
/** Below 640px dialogs become iOS-style bottom sheets (thumb reach, native feel). */
function useSheetMode() {
  const get = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
  const [m, setM] = React.useState(get)
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-navy-900/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:duration-100",
      className
    )}
    {...props}
    ref={ref} />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const sheetMode = useSheetMode()
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
            "fixed z-50 grid w-full gap-4 bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-sheet max-h-[92dvh] overflow-y-auto inset-x-0 bottom-0 rounded-t-[20px] data-[state=open]:slide-in-from-bottom-full sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-lg sm:rounded-[20px] sm:border sm:border-line sm:p-6 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-[0.98] max-sm:!w-full max-sm:!max-w-none max-sm:!left-0 max-sm:!right-0 max-sm:!top-auto max-sm:!rounded-b-none max-sm:!rounded-t-[20px]",
            className
          )}
          style={sheetMode ? { x: 0, y: 0 } : { x: '-50%', y: '-50%' }}
          initial={sheetMode ? { opacity: 1, y: '100%', x: 0 } : { opacity: 0, scale: 0.97, x: '-50%', y: '-50%' }}
          animate={
            sheetMode
              ? (uiState === 'open' ? { opacity: 1, y: 0, x: 0 } : { opacity: 1, y: '100%', x: 0 })
              : (uiState === 'open'
                ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' }
                : { opacity: 0, scale: 0.97, x: '-50%', y: '-50%' })
          }
          transition={uiState === 'open' ? (sheetMode ? sheetSpring : springOpen) : tweenExit}
        >
          <div aria-hidden className="mx-auto -mt-2 mb-1 h-1.5 w-10 rounded-full bg-neutral-300 sm:hidden" />
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
    className={cn("flex flex-col space-y-2 text-start", className)}
    {...props} />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2", className)}
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
