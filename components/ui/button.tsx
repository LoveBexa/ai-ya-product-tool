import * as React from "react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger"
type Size = "sm" | "md" | "icon"

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-accent disabled:opacity-50",
  ghost: "text-foreground hover:bg-secondary disabled:opacity-50",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-secondary disabled:opacity-50",
  danger: "bg-transparent text-foreground hover:bg-secondary disabled:opacity-50",
}

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  icon: "h-8 w-8",
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = "Button"
