import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const topics = [
  ["What CSRF is", "Cross-site request forgery is a browser-driven request that may include ambient credentials such as cookies."],
  ["Generated versus confirmed", "A generated PoC is a representation to support validation. It is not proof that the server accepted a state change."],
  ["SameSite cookies", "SameSite may reduce exposure in some browser contexts, but it does not independently prove an endpoint is protected."],
  ["JSON requests", "Normal HTML forms cannot emit application/json exactly, so JSON endpoints often require representation changes or CORS diagnostics."],
  ["Authorized testing", "Only test systems you own or are explicitly authorized to assess."]
];

export default function HelpPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Help</h1>
        <p className="text-sm text-muted-foreground">Neutral guidance for safe, authorized CSRF validation.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {topics.map(([title, body]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
