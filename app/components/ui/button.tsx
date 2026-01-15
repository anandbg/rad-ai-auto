'use client';

import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/shared/cn";
import { Spinner } from "./spinner";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  asChild?: boolean;
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand/90 hover:shadow-md rounded-xl",
  secondary: "bg-surface text-text-primary border border-border shadow-sm hover:bg-surface-muted hover:shadow-md rounded-xl",
  outline: "border border-border bg-transparent text-text-primary hover:bg-surface-muted hover:border-border rounded-xl",
  ghost: "bg-transparent text-text-primary hover:bg-surface-muted/70 rounded-xl",
  danger: "bg-danger text-white shadow-sm hover:bg-danger/90 hover:shadow-md rounded-xl"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs rounded-lg min-h-[44px] min-w-[44px]",
  md: "px-4 py-2.5 text-sm rounded-xl min-h-[44px] min-w-[44px]",
  lg: "px-6 py-3 text-base rounded-xl min-h-[44px] min-w-[44px]"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, asChild = false, ...props }, ref) => {
    const combinedClassName = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

    if (asChild) {
      return (
        <Slot className={combinedClassName} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Spinner size="sm" aria-hidden="true" />}
        <span className="inline-flex items-center gap-1">{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
