'use client';

import { motion, useReducedMotion } from "framer-motion";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/shared/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** When true, adds hover lift animation for interactive cards */
  interactive?: boolean;
}

// Motion variants for hover elevation
const cardHoverVariants = {
  rest: { y: 0 },
  hover: { y: -2, transition: { duration: 0.2 } }
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    const baseClassName = cn(
      "rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-lg",
      className
    );

    // Non-interactive cards or reduced motion preference: use static div
    if (!interactive || shouldReduceMotion) {
      return (
        <div
          ref={ref}
          className={baseClassName}
          {...props}
        />
      );
    }

    // Interactive cards get hover lift animation
    // Extract drag handlers to avoid type conflicts with Framer Motion
    const { onDrag, onDragStart, onDragEnd, onDragOver, onDragEnter, onDragLeave, onDrop, onAnimationStart, onAnimationEnd, ...safeProps } = props;

    return (
      <motion.div
        ref={ref}
        className={baseClassName}
        variants={cardHoverVariants}
        initial="rest"
        whileHover="hover"
        {...safeProps}
      />
    );
  }
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 border-b border-border/40 px-6 py-5", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-base font-semibold text-text-primary leading-tight truncate", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-text-secondary leading-relaxed", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("px-6 py-5", className)} {...props} />
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-end gap-3 border-t border-border/40 px-6 py-4", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";
