"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [{ href: "/events", label: "Programme" }, { href: "/about", label: "The festival" }, { href: "/register", label: "Register" }];

export function PublicNav() {
  const pathname = usePathname();
  return <header className="public-nav"><Link href="/" className="festival-wordmark"><span className="wordmark-symbol">✦</span><span>ILLENIUM<small>2026 / MUMBAI</small></span></Link><nav className="public-links">{links.map((link)=><Link key={link.href} href={link.href} className={pathname.startsWith(link.href)?"active":""}>{link.label}</Link>)}</nav><div className="nav-actions"><Link href="/auth/login" className="nav-login">Log in</Link><Link href="/register" className="nav-register">Get your ID <span>↗</span></Link></div><button className="nav-menu" aria-label="Open navigation">☰</button></header>;
}
