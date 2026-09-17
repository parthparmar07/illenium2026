import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ILLENIUM 2026 | One identity. Every moment.",
  description: "The official identity and operations platform for ILLENIUM 2026.",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
