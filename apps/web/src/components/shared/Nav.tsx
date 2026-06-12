"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

const NAV_LINKS = [
  { href: "/", label: "Platform" },
  { href: "/transparency", label: "Transparency" },
];

function SealMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle
        cx="17"
        cy="17"
        r="15.5"
        fill="var(--color-amber-surface)"
        stroke="var(--color-amber-dim)"
      />
      <path
        d="M17 7.2 20.9 14l6.4 1.7-4.7 4.8.5 6.6-6.1-2.9-6.1 2.9.5-6.6-4.7-4.8 6.4-1.7L17 7.2Z"
        fill="var(--color-amber)"
      />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { me, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full ${scrolled ? "nav-scrolled" : ""}`}
      style={{
        height: scrolled ? "64px" : "var(--nav-height)",
        background: "rgba(44, 30, 21, 0.9)",
        borderBottom: "1px solid rgba(244, 234, 220, 0.12)",
        backdropFilter: "blur(18px)",
        transition:
          "height 260ms cubic-bezier(0.16,1,0.3,1), background 260ms ease, box-shadow 260ms ease, border-color 260ms ease",
      }}
    >
      <div
        className="mx-auto flex h-full items-center justify-between px-6"
        style={{ maxWidth: "var(--page-max)" }}
      >
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label="Provora home"
        >
          <SealMark />
          <span
            className="font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 23,
              color: "var(--color-ivory)",
              letterSpacing: "-0.045em",
            }}
          >
            Prov<span style={{ color: "var(--color-amber-glow)" }}>ora</span>
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
            href="/wallet"
            className="btn-ghost hidden sm:inline-flex"
            style={{ padding: "9px 15px", fontSize: 13 }}
          >
            My Wallet
          </Link>

          {me ? (
            <>
              <span
                className="hidden items-center sm:inline-flex"
                style={{ fontSize: 12, fontWeight: 700, color: "var(--color-sand)" }}
              >
                {me.role === "student" ? "Signed in" : me.role}
              </span>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  router.push("/");
                }}
                className="btn-ghost"
                style={{ padding: "9px 15px", fontSize: 13 }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-ghost hidden sm:inline-flex"
                style={{ padding: "9px 15px", fontSize: 13 }}
              >
                Log in
              </Link>
              <Link
                href="/enroll"
                className="btn-primary"
                style={{ padding: "9px 17px", fontSize: 13 }}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}