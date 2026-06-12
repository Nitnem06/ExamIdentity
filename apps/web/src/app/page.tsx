"use client";

import Link from "next/link";
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/shared/Footer";
import { ExplainableFlagCard } from "@/components/exam/ExplainableFlagCard";
import { FlagEvidenceTimeline } from "@/components/exam/FlagEvidenceTimeline";
import { CountUp } from "@/components/anim/CountUp";
import type {
  ExplainableFlag,
  FlagExplanationResponse,
} from "@/types/explanations";

const DEMO_BASE_TIME = new Date("2026-06-11T10:00:00.000Z").getTime();

const DEMO_FLAGS: ExplainableFlag[] = [
  {
    id: "flag-001",
    sessionId: "session-demo",
    type: "gaze_deviation",
    severity: "medium",
    timeRange: {
      start: DEMO_BASE_TIME - 2_400_000,
      end: DEMO_BASE_TIME - 2_392_000,
    },
    observedValue: "34 deg",
    baselineValue: "8 deg",
    policyThreshold: "20 deg",
    adjustedThreshold: "20 deg",
    accommodation: { applied: false },
    confidence: 0.82,
    explanation:
      "Your gaze moved significantly outside the expected focal zone for 8 seconds. The model observed a mean deviation of 34 degrees from screen centre, compared to your personal baseline of 8 degrees. This occurred once during the session.",
    recommendedAction: "note_for_review",
    evidenceHashes: ["sha256:a1b2c3d4e5f6"],
    createdAt: new Date(DEMO_BASE_TIME - 2_392_000).toISOString(),
  },
  {
    id: "flag-002",
    sessionId: "session-demo",
    type: "audio_anomaly",
    severity: "low",
    timeRange: {
      start: DEMO_BASE_TIME - 1_800_000,
      end: DEMO_BASE_TIME - 1_796_000,
    },
    observedValue: "68 dB",
    baselineValue: "22 dB",
    policyThreshold: "55 dB",
    adjustedThreshold: "65 dB",
    accommodation: {
      applied: true,
      type: "Noise-Tolerant Environment",
      description:
        "Threshold raised by 10 dB due to approved accommodation for noisy environment.",
      adjustmentFactor: 1.18,
    },
    confidence: 0.64,
    explanation:
      "A brief audio spike was detected. Because you have an approved noise-tolerant environment accommodation, the policy threshold was raised to 65 dB. The observed 68 dB marginally exceeded this adjusted threshold.",
    recommendedAction: "auto_resolved",
    evidenceHashes: ["sha256:b2c3d4e5f6a1"],
    createdAt: new Date(DEMO_BASE_TIME - 1_796_000).toISOString(),
  },
];

const DEMO_SESSION: FlagExplanationResponse = {
  sessionId: "session-demo",
  studentDid: "did:key:z6Mkj8...",
  examId: "exam-calc-101",
  examTitle: "Calculus I - Midterm Exam",
  institutionName: "University of Delhi",
  sessionDate: new Date(DEMO_BASE_TIME - 2_400_000).toISOString(),
  flags: DEMO_FLAGS,
  totalFlags: 2,
  highSeverityCount: 0,
  reviewStatus: "pending",
};

const DEMO_ISSUED_DATE = new Date("2026-06-11").toLocaleDateString("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "UTC",
});

function FeatureTag({ text }: { text: string }) {
  return (
    <span
      className="badge badge-neutral"
      style={{ fontSize: 10, padding: "4px 11px", letterSpacing: "0.07em" }}
    >
      {text}
    </span>
  );
}

function SectionDivider() {
  return (
    <div
      style={{
        height: 1,
        background:
          "linear-gradient(90deg, transparent, rgba(244,234,220,0.16) 30%, rgba(244,234,220,0.16) 70%, transparent)",
      }}
    />
  );
}

function DomainCard({
  label,
  owner,
  examples,
  tone,
  note,
  delay,
}: {
  label: string;
  owner: string;
  examples: string[];
  tone: string;
  note?: string;
  delay?: 1 | 2 | 3;
}) {
  return (
    <div
      className={`card reveal-pop lift p-6 text-center${delay ? ` delay-${delay}` : ""}`}
    >
      <p className="label mb-2">{label}</p>
      <h3
        className="mb-4 font-bold"
        style={{
          fontFamily: "var(--font-display)",
          color: tone,
          fontSize: 22,
          letterSpacing: "-0.03em",
        }}
      >
        Owned by {owner}
      </h3>

      <ul className="mx-auto max-w-[240px] space-y-2 text-left">
        {examples.map((example) => (
          <li
            key={example}
            className="flex items-start gap-2 text-sm"
            style={{ color: "var(--color-parchment)" }}
          >
            <span style={{ color: tone, marginTop: 1 }}>•</span>
            {example}
          </li>
        ))}
      </ul>

      {note && (
        <p className="mt-4 text-xs font-semibold" style={{ color: tone }}>
          {note}
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Nav />

      <main>
        <section
          className="relative overflow-hidden py-24 sm:py-28"
          style={{ background: "var(--color-dark-roast)" }}
        >
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[rgba(217,154,78,0.16)] blur-3xl" />
          <div className="hero-aurora" />
          <div
            className="float-slow"
            style={{
              position: "absolute",
              top: "20%",
              left: "11%",
              width: 92,
              height: 92,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(240,194,123,0.28), transparent 70%)",
              filter: "blur(6px)",
              pointerEvents: "none",
            }}
          />
          <div
            className="float-slower"
            style={{
              position: "absolute",
              bottom: "16%",
              right: "13%",
              width: 124,
              height: 124,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(139,160,184,0.2), transparent 70%)",
              filter: "blur(8px)",
              pointerEvents: "none",
            }}
          />

          <div className="center-wrap relative z-10 text-center">
            <div className="fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(217,154,78,0.24)] bg-[rgba(217,154,78,0.1)] px-4 py-2">
              <span
                className="inline-block rounded-full"
                style={{
                  width: 7,
                  height: 7,
                  background: "var(--color-amber)",
                  animation: "pulse-amber 2s ease-in-out infinite",
                }}
              />
              <span className="label" style={{ color: "var(--color-amber-glow)" }}>
                Open-standard exam integrity
              </span>
            </div>

            <h1
              className="fade-up delay-1 text-balance mx-auto mb-7 max-w-5xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(46px, 7vw, 86px)",
                color: "var(--color-ivory)",
                letterSpacing: "-0.055em",
                lineHeight: 0.95,
              }}
            >
              Students own their{" "}
              <span className="animated-gradient-text">identity.</span>
              <br />
              Evidence stays in{" "}
              <span style={{ color: "var(--color-ceramic)" }}>neutral escrow.</span>
            </h1>

            <p
              className="fade-up delay-2 mx-auto mb-9 max-w-2xl leading-relaxed"
              style={{ color: "var(--color-sand)", fontSize: 18 }}
            >
              Provora replaces black-box proctoring with a self-sovereign,
              privacy-preserving platform for explainable flags, portable
              credentials, and public accountability.
            </p>

            <div className="fade-up delay-3 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="#features"
                className="btn-primary"
                style={{ padding: "13px 25px", fontSize: 15 }}
              >
                See how it works
              </Link>

              <Link
                href="/transparency"
                className="btn-ghost"
                style={{ padding: "13px 25px", fontSize: 15 }}
              >
                Public transparency report
              </Link>
            </div>
          </div>
        </section>

        <SectionDivider />

        <section className="py-20" style={{ background: "var(--color-mahogany)" }}>
          <div className="center-wrap text-center">
            <p className="label reveal mb-3">Three domains, zero ambiguity</p>

            <h2
              className="reveal mx-auto mb-11 max-w-2xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 4vw, 52px)",
                color: "var(--color-ivory)",
                letterSpacing: "-0.045em",
                lineHeight: 1,
              }}
            >
              A clearer ownership model for exam integrity.
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              <DomainCard
                label="Category A - Student data"
                owner="You"
                delay={1}
                tone="var(--color-amber-glow)"
                examples={[
                  "DID and key material",
                  "Biometric baseline",
                  "Exam wallet",
                  "Credential history",
                ]}
              />

              <DomainCard
                label="Category B - Integrity evidence"
                owner="Neutral escrow"
                delay={2}
                tone="var(--color-slate-blue)"
                examples={[
                  "Behavioural vectors",
                  "Flag evidence",
                  "Session traces",
                  "Dual-key encryption",
                ]}
                note="Deleted after 90 days"
              />

              <DomainCard
                label="Category C - Institutional data"
                owner="Institution"
                delay={3}
                tone="var(--color-ceramic)"
                examples={[
                  "Exam configuration",
                  "Academic thresholds",
                  "Session report",
                  "Grade decisions",
                ]}
              />
            </div>
          </div>
        </section>

        <SectionDivider />

        <section
          id="features"
          className="py-20"
          style={{ background: "var(--color-dark-roast)" }}
        >
          <div className="center-wrap">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div className="reveal-left text-center lg:sticky lg:top-28">
                <div className="mb-5 flex flex-wrap justify-center gap-2">
                  <FeatureTag text="Feature 01" />
                  <FeatureTag text="Explainability" />
                </div>

                <h2
                  className="mx-auto mb-5 max-w-xl font-bold"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(32px, 4vw, 54px)",
                    color: "var(--color-ivory)",
                    letterSpacing: "-0.045em",
                    lineHeight: 1,
                  }}
                >
                  Every flag explained. No vague suspicion labels.
                </h2>

                <p
                  className="mx-auto mb-7 max-w-xl leading-relaxed"
                  style={{ color: "var(--color-sand)", fontSize: 15 }}
                >
                  Students and reviewers see observed values, baselines, policy
                  thresholds, accommodation adjustments, model confidence, and
                  recommended action in one transparent card.
                </p>

                <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
                  {[
                    "Observed vs baseline",
                    "Policy threshold",
                    "Accommodation applied",
                    "Confidence score",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-1"
                      style={{
                        color: "var(--color-ceramic)",
                        borderColor: "rgba(244,234,220,0.12)",
                        background: "rgba(255,248,236,0.05)",
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="reveal-right space-y-4">
                <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row">
                  <p className="label">
                    Live preview - {DEMO_SESSION.examTitle}
                  </p>
                  <span className="badge badge-neutral px-3 py-1 text-[10px]">
                    {DEMO_FLAGS.length} flags
                  </span>
                </div>

                <div className="card p-4">
                  <FlagEvidenceTimeline
                    flags={DEMO_FLAGS}
                    sessionStart={DEMO_BASE_TIME - 3_600_000}
                    sessionEnd={DEMO_BASE_TIME - 600_000}
                  />
                </div>

                {DEMO_FLAGS.map((flag) => (
                  <ExplainableFlagCard
                    key={flag.id}
                    flag={flag}
                    defaultExpanded={flag.id === "flag-001"}
                    showDispute
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        <section className="py-20" style={{ background: "var(--color-mahogany)" }}>
          <div className="center-wrap">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="reveal-left text-center">
                <div className="mb-5 flex flex-wrap justify-center gap-2">
                  <FeatureTag text="Feature 02" />
                  <FeatureTag text="Portability" />
                </div>

                <h2
                  className="mx-auto mb-5 max-w-xl font-bold"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(32px, 4vw, 54px)",
                    color: "var(--color-ivory)",
                    letterSpacing: "-0.045em",
                    lineHeight: 1,
                  }}
                >
                  Your credential works outside our platform.
                </h2>

                <p
                  className="mx-auto mb-7 max-w-xl leading-relaxed"
                  style={{ color: "var(--color-sand)", fontSize: 15 }}
                >
                  Export a signed W3C Verifiable Credential, share a QR
                  verification link, or demo wallet portability through Apple
                  Wallet, Google Wallet, LinkedIn, and OID4VCI stubs.
                </p>

                <Link
                  href="/wallet/export/demo"
                  className="btn-primary"
                  style={{ padding: "12px 24px", fontSize: 14 }}
                >
                  Try export demo
                </Link>
              </div>

              <div className="ledger-card reveal-pop p-7 text-center">
                <p className="label mb-2">Verifiable Credential</p>

                <h3
                  className="mb-1 font-bold"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--color-ivory)",
                    fontSize: 28,
                    letterSpacing: "-0.04em",
                  }}
                >
                  Calculus I - Midterm Exam
                </h3>

                <p className="mb-7 text-sm" style={{ color: "var(--color-taupe)" }}>
                  University of Delhi
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Issued", DEMO_ISSUED_DATE],
                    ["Proof type", "Ed25519Signature2020"],
                    ["Subject DID", "did:key:z6Mkj8..."],
                    ["Integrity", "Verified"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[18px] border p-4 transition hover:-translate-y-1"
                      style={{
                        borderColor: "rgba(244,234,220,0.12)",
                        background: "rgba(255,248,236,0.045)",
                      }}
                    >
                      <p className="label mb-1">{label}</p>
                      <p
                        className="font-mono text-xs"
                        style={{ color: "var(--color-ceramic)" }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-5 truncate rounded-full border px-4 py-3 font-mono text-xs"
                  style={{
                    color: "var(--color-amber-glow)",
                    borderColor: "rgba(217,154,78,0.22)",
                    background: "rgba(31,21,14,0.5)",
                  }}
                >
                  proofValue: z58DAdFfa9...
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        <section className="py-20" style={{ background: "var(--color-dark-roast)" }}>
          <div className="center-wrap">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Exams protected", value: 18432, suffix: "", decimals: 0, color: "var(--color-amber-glow)" },
                  { label: "Credentials issued", value: 17890, suffix: "", decimals: 0, color: "var(--color-sage)" },
                  { label: "Overturn rate", value: 19.6, suffix: "%", decimals: 1, color: "var(--color-slate-blue)" },
                  { label: "Deletion compliance", value: 99.6, suffix: "%", decimals: 1, color: "var(--color-ceramic)" },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className={`card reveal-pop lift p-6 text-center delay-${(i % 3) + 1}`}
                  >
                    <p className="label mb-2">{s.label}</p>
                    <p
                      className="font-bold"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: s.color,
                        fontSize: 34,
                        letterSpacing: "-0.04em",
                      }}
                    >
                      <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals} />
                    </p>
                  </div>
                ))}
              </div>

              <div className="reveal-right text-center">
                <div className="mb-5 flex flex-wrap justify-center gap-2">
                  <FeatureTag text="Feature 03" />
                  <FeatureTag text="Accountability" />
                </div>

                <h2
                  className="mx-auto mb-5 max-w-xl font-bold"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(32px, 4vw, 54px)",
                    color: "var(--color-ivory)",
                    letterSpacing: "-0.045em",
                    lineHeight: 1,
                  }}
                >
                  Aggregate metrics, publicly auditable.
                </h2>

                <p
                  className="mx-auto mb-7 max-w-xl leading-relaxed"
                  style={{ color: "var(--color-sand)", fontSize: 15 }}
                >
                  Universities, students, and auditors can inspect flag rates,
                  dispute outcomes, deletion compliance, model drift, and
                  transparency log health without exposing personal data.
                </p>

                <Link
                  href="/transparency"
                  className="btn-primary"
                  style={{ padding: "12px 24px", fontSize: 14 }}
                >
                  View transparency report
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="get-started"
          className="py-20 text-center"
          style={{
            background: "var(--color-mahogany)",
            borderTop: "1px solid rgba(244,234,220,0.12)",
          }}
        >
          <div className="center-wrap reveal">
            <h2
              className="mx-auto mb-5 max-w-2xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(34px, 5vw, 62px)",
                color: "var(--color-ivory)",
                letterSpacing: "-0.05em",
                lineHeight: 1,
              }}
            >
              Exam integrity that respects the student.
            </h2>

            <p
              className="mx-auto mb-8 max-w-2xl leading-relaxed"
              style={{ color: "var(--color-sand)", fontSize: 16 }}
            >
              Build trust into online exams with owned identity, neutral
              evidence escrow, explainable decisions, and open transparency.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/enroll"
                className="btn-primary"
                style={{ padding: "13px 28px", fontSize: 15 }}
              >
                Get started
              </Link>

              <Link
                href="/transparency"
                className="btn-ghost"
                style={{ padding: "13px 28px", fontSize: 15 }}
              >
                Read transparency report
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}