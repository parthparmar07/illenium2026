"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

type Role = "participant" | "oc" | "admin";

const configs = {
  participant: {
    label: "Participant portal",
    title: "Your ILLENIUM passport",
    nav: [
      { href: "/participant/dashboard", label: "Overview", icon: "◈" },
      { href: "/events", label: "Programme", icon: "✦" },
      { href: "/participant/id", label: "Digital ID", icon: "⌁" }
    ],
    accent: "violet"
  },
  oc: {
    label: "OC operations",
    title: "Field operations",
    nav: [
      { href: "/oc/dashboard", label: "My shift", icon: "◈" },
      { href: "/oc/scanner", label: "Scan pass", icon: "⌁" },
      { href: "/oc/check-ins", label: "Check-ins", icon: "✓" }
    ],
    accent: "blue"
  },
  admin: {
    label: "Festival control room",
    title: "Operations console",
    nav: [
      { href: "/admin/dashboard", label: "Overview", icon: "◈" },
      { href: "/admin/verification", label: "Verification", icon: "✓" },
      { href: "/admin/participants", label: "Participants", icon: "◎" },
      { href: "/admin/events", label: "Events", icon: "✦" }
    ],
    accent: "violet"
  }
} as const;

export function RoleShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const config = configs[role];
  const [open, setOpen] = useState(false);

  async function signOut() {
    try {
      await createClient().auth.signOut();
    } catch {
      /* ignore */
    }
    window.location.href = "/auth/login";
  }

  return (
    <div className={`workspace-shell workspace-${role}`}>
      {/* Mobile Sidebar Backdrop */}
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      {/* Sidebar Drawer */}
      <aside className={`workspace-sidebar ${open ? "open" : ""}`}>
        <div className="workspace-brand">
          <span className="workspace-mark">✦</span>
          <span>
            ILLENIUM<small>2026</small>
          </span>
          <button className="sidebar-close-btn" onClick={() => setOpen(false)} aria-label="Close sidebar">
            ✕
          </button>
        </div>

        <div className="workspace-context">
          <span className="context-dot" /> {config.label}
        </div>

        <nav className="workspace-nav">
          {config.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href || pathname.startsWith(item.href + "/") ? "selected" : ""}
              onClick={() => setOpen(false)}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link href="/" className="sidebar-link" onClick={() => setOpen(false)}>
            <span>↗</span> Public site
          </Link>
          <button className="sidebar-link" onClick={signOut}>
            <span>⇥</span> Log out
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="workspace-main">
        <header className="workspace-topbar">
          <button className="sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
            ☰
          </button>
          <div>
            <span className="topbar-kicker">{config.label}</span>
            <span className="topbar-title">{config.title}</span>
          </div>
          <div className="topbar-right">
            <span className="live-pill">
              <i /> Live system
            </span>
            <button className="avatar-button" onClick={signOut} aria-label="Log out" title="Log out">
              ↪
            </button>
          </div>
        </header>

        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}
