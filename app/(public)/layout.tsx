import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="shell"><header className="nav"><Link href="/" className="brand"><span className="brand-mark"><span>✦</span></span> ILLENIUM 2026</Link><nav className="nav-links"><Link href="/events">Events</Link><Link href="/about">About</Link><Link href="/register">Registration</Link></nav><Link href="/auth/login" className="btn btn-ghost">Log in</Link></header>{children}<footer className="footer"><span>ILLENIUM 2026 · ONE IDENTITY. EVERY MOMENT.</span><span>Mumbai · 2026</span></footer></div>;
}
