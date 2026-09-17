import { PublicNav } from "@/components/layout/public-nav";
import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) { return <div className="festival-page"><PublicNav/>{children}<footer className="public-footer"><span>ILLENIUM 2026 · Atlas SkillTech University · Mumbai</span><span><Link href="/auth/login">Participant / OC login</Link></span></footer></div>; }
