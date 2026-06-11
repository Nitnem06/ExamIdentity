"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Platform" },
  { href: "/transparency", label: "Transparency" },
];

function SealMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <circle
        cx="15"
        cy="15"
        r="14"
        fill="var(--color-amber-surface)"
        stroke="var(--color-amber-dim)"
      />
      <path
        d="M15 6.4 18.4 12l5.9 1.6-4.2 4.4.4 6-5.5-2.6L9.5 24l.4-6-4.2-4.4 5.9-1.6L15 6.4Z"
        fill="var(--color-amber)"
      />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        height: "var(--nav-height)",
        background: "rgba(28, 16, 10, 0.88)",
        borderBottom: "1px solid rgba(244, 234, 220, 0.12)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div
        className="mx-auto flex h-full items-center justify-between px-6"
        style={{ maxWidth: "var(--page-max)" }}
      >
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="ExamIdentity home"
        >
          <SealMark />
          <span
            className="font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              color: "var(--color-ivory)",
              letterSpacing: "-0.035em",
            }}
          >
            Exam<span style={{ color: "var(--color-amber-glow)" }}>Identity</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-[rgba(244,234,220,0.12)] bg-[rgba(255,248,236,0.045)] p-1 sm:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const active =
              pathname === href || (href !== "/" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200"
                style={{
                  color: active
                    ? "var(--color-espresso)"
                    : "var(--color-ceramic)",
                  background: active
                    ? "var(--color-amber-glow)"
                    : "transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/wallet/export/demo"
            className="btn-ghost hidden sm:inline-flex"
            style={{ padding: "9px 15px", fontSize: 13 }}
          >
            My Wallet
          </Link>

          <Link
            href="#get-started"
            className="btn-primary"
            style={{ padding: "9px 17px", fontSize: 13 }}
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}