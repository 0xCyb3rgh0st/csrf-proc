import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function LocalOnlyBadge(): React.ReactElement {
  return (
    <Badge tone="local" className="items-center gap-1">
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Local only
    </Badge>
  );
}
