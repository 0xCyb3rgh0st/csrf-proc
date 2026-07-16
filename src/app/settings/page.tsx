import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Phase 1 preferences are intentionally small and local.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Design Tokens</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Badge tone="compatible">Compatible</Badge>
          <Badge tone="conditional">Conditional</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="sensitive">Sensitive</Badge>
          <Badge tone="local">Local only</Badge>
          <Badge>Unknown</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
