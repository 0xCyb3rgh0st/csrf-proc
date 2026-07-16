import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityAlertProps {
  title: string;
  children: React.ReactNode;
  tone?: "info" | "warning";
}

export function SecurityAlert({ title, children, tone = "info" }: SecurityAlertProps): React.ReactElement {
  const Icon = tone === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-3 text-sm",
        tone === "warning" ? "border-warning/40 bg-warning/10" : "border-information/40 bg-information/10"
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4", tone === "warning" ? "text-warning" : "text-information")} aria-hidden="true" />
      <div>
        <p className="font-medium">{title}</p>
        <div className="mt-1 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
