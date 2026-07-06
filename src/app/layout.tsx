import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/ui/navigation";

export const metadata: Metadata = {
  title: "Find Your Vibe — Relationship Discovery Platform",
  description: "Find meaningful compatibility built on lifestyle tempos, values, and communication styles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg-light">
        <Navigation />
        <main className="flex-1 w-full">{children}</main>
      </body>
    </html>
  );
}

