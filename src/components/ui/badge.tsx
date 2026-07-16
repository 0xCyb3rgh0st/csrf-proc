import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "local" | "sensitive" | "warning" | "compatible" | "conditional";
}

const tones = {
  default: "bg-muted text-foreground",
  local: "bg-local-only/15 text-local-only",
  sensitive: "bg-sensitive/15 text-sensitive",
  warning: "bg-warning/15 text-warning",
  compatible: "bg-compatible/15 text-compatible",
  conditional: "bg-conditional/15 text-conditional"
};

export function Badge({ className, tone = "default", ...props }: BadgeProps): React.ReactElement {
  return <span className={cn("inline-flex rounded-md px-2 py-1 text-xs font-medium", tones[tone], className)} {...props} />;
}
