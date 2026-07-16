import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "CSRForge",
  description: "Local-first CSRF proof-of-concept workbench for authorized testing."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <AppShell>{children}</AppShell>
        <Toaster richColors />
      </body>
    </html>
  );
}
