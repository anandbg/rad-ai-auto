'use client';

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/shared/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

// Animation variants for overlay
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

// Animation variants for content
const contentVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <DialogPrimitive.Overlay
        ref={ref}
        className={cn("fixed inset-0 z-40 bg-black/50 backdrop-blur-sm", className)}
        {...props}
      />
    );
  }

  return (
    <DialogPrimitive.Overlay ref={ref} asChild {...props}>
      <motion.div
        className={cn("fixed inset-0 z-40 bg-black/50 backdrop-blur-sm", className)}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ duration: 0.15 }}
      />
    </DialogPrimitive.Overlay>
  );
});
DialogOverlay.displayName = "DialogOverlay";

export interface DialogContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** For AnimatePresence to work - managed by Dialog.Root */
  forceMount?: true;
}

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, forceMount, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion();

  // For reduced motion, use simple CSS transitions
  if (shouldReduceMotion) {
    return (
      <DialogPortal forceMount={forceMount}>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface shadow-xl focus-visible:outline-none",
            className
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-all duration-200 hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
            <X className="h-4 w-4" />
            <span className="sr-only">Close dialog</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }

  // With motion: use AnimatePresence for enter/exit animations
  return (
    <DialogPortal forceMount={forceMount}>
      <DialogPrimitive.Overlay asChild>
        <motion.div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.15 }}
        />
      </DialogPrimitive.Overlay>
      <DialogPrimitive.Content ref={ref} asChild {...props}>
        <motion.div
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface shadow-xl focus-visible:outline-none",
            className
          )}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.15 }}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-all duration-200 hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
            <X className="h-4 w-4" />
            <span className="sr-only">Close dialog</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = "DialogContent";

/**
 * AnimatedDialogContent - For controlled dialogs that need AnimatePresence exit animations.
 *
 * Usage:
 * ```tsx
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <AnimatePresence>
 *     {open && (
 *       <AnimatedDialogContent forceMount>
 *         ...content
 *       </AnimatedDialogContent>
 *     )}
 *   </AnimatePresence>
 * </Dialog>
 * ```
 */
export const AnimatedDialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <DialogPortal forceMount>
      <DialogPrimitive.Overlay asChild>
        <motion.div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
        />
      </DialogPrimitive.Overlay>
      <DialogPrimitive.Content ref={ref} asChild {...props}>
        <motion.div
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface shadow-xl focus-visible:outline-none",
            className
          )}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-all duration-200 hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
            <X className="h-4 w-4" />
            <span className="sr-only">Close dialog</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
AnimatedDialogContent.displayName = "AnimatedDialogContent";

export const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 border-b border-border/40 px-6 py-5 text-left", className)} {...props} />
);

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-text-primary leading-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-secondary leading-relaxed", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end", className)} {...props} />
);

// Re-export AnimatePresence for convenience
export { AnimatePresence } from "framer-motion";
