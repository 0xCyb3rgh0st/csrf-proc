import { cn } from "@/lib/utils";

interface PropertyRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

export function PropertyRow({ label, value, mono }: PropertyRowProps): React.ReactElement {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 border-b py-2 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 break-words text-sm", mono && "font-mono")}>{value || "None"}</dd>
    </div>
  );
}
