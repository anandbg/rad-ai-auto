import type { SVGAttributes } from "react";
import { cn } from "@/lib/shared/cn";

type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends SVGAttributes<SVGSVGElement> {
  size?: SpinnerSize;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8"
};

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <svg
      className={cn("animate-spin text-brand", sizeMap[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
      {...props}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
