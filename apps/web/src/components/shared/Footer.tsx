"use client";

import Link from "next/link";

const LINKS = {
  Platform: [
    { href: "/", label: "Overview" },
    { href: "/transparency", label: "Transparency" },
    { href: "/wallet/export/demo", label: "Student Wallet" },
  ],
  Trust: [
    { href: "/transparency", label: "Public Metrics" },
    { href: "/docs/data-model", label: "Data Model" },
    { href: "/docs/dispute-process", label: "Dispute Process" },
  ],
  Developers: [
    { href: "/docs/api", label: "API Reference" },
    { href: "/docs/did-spec", label: "DID / VC Spec" },
    { href: "/docs/open-source", label: "Open Source" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Use" },
    { href: "/gdpr", label: "GDPR" },
  ],
};

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-espresso)",
        borderTop: "1px solid rgba(244, 234, 220, 0.12)",
      }}
    >
      <div
        className="mx-auto grid grid-cols-2 gap-8 px-6 py-14 text-center sm:grid-cols-4 sm:text-left"
        style={{ maxWidth: "var(--page-max)" }}
      >
        {Object.entries(LINKS).map(([section, links]) => (
          <div key={section}>
            <p
              className="mb-4 font-semibold uppercase"
              style={{
                color: "var(--color-ceramic)",
                fontSize: 11,
                letterSpacing: "0.09em",
              }}
            >
              {section}
            </p>

            <ul className="space-y-2.5">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors duration-150 hover:text-[var(--color-ceramic)]"
                    style={{ color: "var(--color-taupe)", fontSize: 13 }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="mx-auto flex flex-col items-center justify-between gap-5 px-6 py-7 text-center sm:flex-row sm:text-right"
        style={{
          maxWidth: "var(--page-max)",
          borderTop: "1px solid rgba(244, 234, 220, 0.12)",
        }}
      >
        <p
          className="select-none font-bold tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 34,
            color: "var(--color-cedar)",
            letterSpacing: "-0.045em",
          }}
        >
          Exam<span style={{ color: "var(--color-amber-dim)" }}>Identity</span>
        </p>

        <div className="space-y-1">
          <p className="text-xs" style={{ color: "var(--color-taupe)", fontSize: 11 }}>
            Self-sovereign exam integrity. Students own their data.
          </p>
          <p className="text-xs" style={{ color: "var(--color-taupe)", fontSize: 11 }}>
            © {new Date().getFullYear()} ExamIdentity. Built on W3C DID and Verifiable Credentials.
          </p>
        </div>
      </div>
    </footer>
  );
}