"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, FolderOpen, HelpCircle, Settings, Shield } from "lucide-react";
import { LocalOnlyBadge } from "@/components/design-system/local-only-badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/workspace/", label: "Workspace", icon: FileText },
  { href: "/projects/", label: "Projects", icon: FolderOpen },
  { href: "/settings/", label: "Settings", icon: Settings },
  { href: "/help/", label: "Help", icon: HelpCircle }
];

export function AppShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <header className="border-b bg-panel">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/workspace/" className="flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
            CSRForge
          </Link>
          <LocalOnlyBadge />
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[13rem_1fr]">
        <nav className="flex gap-2 overflow-x-auto md:block md:space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (pathname === "/" && item.href === "/workspace/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground",
                  active && "bg-muted text-foreground"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
