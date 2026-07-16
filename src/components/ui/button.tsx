import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-muted text-foreground hover:bg-muted/80",
  ghost: "hover:bg-muted",
  danger: "bg-blocked text-white hover:opacity-90"
};

export function Button({ asChild, className, variant = "secondary", ...props }: ButtonProps): React.ReactElement {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
