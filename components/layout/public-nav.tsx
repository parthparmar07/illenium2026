"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/events", label: "Programme" },
  { href: "/about", label: "The festival" },
  { href: "/register", label: "Register" }
];

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="public-nav">
      <Link href="/" className="festival-wordmark" onClick={() => setOpen(false)}>
        <span className="wordmark-symbol">✦</span>
        <span>
          ILLENIUM<small>2026 / MUMBAI</small>
        </span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="public-links">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={pathname.startsWith(link.href) ? "active" : ""}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="nav-actions">
        <Link href="/auth/login" className="nav-login">
          Log in
        </Link>
        <Link href="/register" className="nav-register">
          Get your ID <span>↗</span>
        </Link>
      </div>

      {/* Mobile Toggle Button */}
      <button className="nav-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
        {open ? "✕" : "☰"}
      </button>

      {/* Mobile Navigation Drawer */}
      {open && (
        <div className="mobile-nav-overlay" onClick={() => setOpen(false)}>
          <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <span className="wordmark-symbol">✦</span>
              <span>ILLENIUM 2026</span>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
            <nav className="mobile-nav-links">
              {links.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={pathname.startsWith(link.href) ? "active" : ""}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mobile-nav-buttons">
              <Link href="/auth/login" className="button button-outline" onClick={() => setOpen(false)}>
                Log in to portal
              </Link>
              <Link href="/register" className="button button-primary" onClick={() => setOpen(false)}>
                Get your ID ↗
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
