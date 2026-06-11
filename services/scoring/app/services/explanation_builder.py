"""Build human-readable flag explanations from raw behavioural signals.

The builder is deterministic: given the same signals it always produces the
same explanation. For the MVP it uses transparent rules (observed value vs.
accommodation-adjusted threshold vs. personal baseline) rather than an opaque
model, which is precisely the point of "explainable" flag cards.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Tuple

from app.schemas.explanation import (
    AccommodationType,
    BuildExplanationsRequest,
    FlagEvidencePoint,
    FlagExplanation,
    FlagReason,
    FlagSeverity,
    FlagType,
    RawFlagSignal,
    RecommendedAction,
    SessionFlagExplanations,
    TimeRange,
)
from app.services.accommodation_thresholds import resolve_threshold

MODEL_VERSION = "explain-rules-0.1.0"

# Per-flag-type copy used to render readable cards.
_FLAG_COPY: Dict[FlagType, Tuple[str, str, str]] = {
    # (unit, reason_code, reason_title)
    FlagType.GAZE_AWAY: ("seconds", "GAZE_OFFSCREEN_DURATION", "Looked away from screen"),
    FlagType.TYPING_IDENTITY_DRIFT: (
        "drift",
        "KEYSTROKE_DRIFT",
        "Typing rhythm differs from baseline",
    ),
    FlagType.MULTIPLE_VOICES: ("voices", "ADDITIONAL_VOICE", "Additional voice detected"),
    FlagType.SYSTEMIC_EVENT: ("events", "SYSTEMIC_ANOMALY", "Platform-wide anomaly"),
    FlagType.DEVICE_INTEGRITY: ("violations", "DEVICE_INTEGRITY", "Device integrity concern"),
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _duration_seconds(start: str, end: str) -> float:
    try:
        s = datetime.fromisoformat(start.replace("Z", "+00:00"))
        e = datetime.fromisoformat(end.replace("Z", "+00:00"))
        return max(0.0, (e - s).total_seconds())
    except ValueError:
        return 0.0


def _severity_for_ratio(ratio: float, auto_resolved: bool) -> FlagSeverity:
    if auto_resolved or ratio < 1.0:
        return FlagSeverity.LOW
    if ratio < 1.5:
        return FlagSeverity.MEDIUM
    if ratio < 2.5:
        return FlagSeverity.HIGH
    return FlagSeverity.CRITICAL


def _recommended_action(
    severity: FlagSeverity, auto_resolved: bool
) -> RecommendedAction:
    if auto_resolved:
        return RecommendedAction.AUTO_RESOLVED
    return {
        FlagSeverity.LOW: RecommendedAction.MONITOR,
        FlagSeverity.MEDIUM: RecommendedAction.STUDENT_REVIEW,
        FlagSeverity.HIGH: RecommendedAction.MANUAL_REVIEW,
        FlagSeverity.CRITICAL: RecommendedAction.ESCALATE,
    }[severity]


def _summary(
    flag_type: FlagType,
    observed: float,
    adjusted: float,
    accommodation: AccommodationType,
    auto_resolved: bool,
    unit: str,
) -> str:
    if auto_resolved:
        base = (
            f"Observed {observed:g} {unit}, within the "
            f"{adjusted:g} {unit} threshold"
        )
        if accommodation != AccommodationType.NONE:
            base += f" after applying the {accommodation.value.replace('_', ' ').lower()} accommodation"
        return base + ". No action required."
    over = observed - adjusted
    base = (
        f"Observed {observed:g} {unit}, which is {over:g} {unit} over the "
        f"{adjusted:g} {unit} threshold"
    )
    if accommodation != AccommodationType.NONE:
        base += f" (threshold already relaxed for the {accommodation.value.replace('_', ' ').lower()} accommodation)"
    return base + "."


def build_explanation(
    signal: RawFlagSignal,
    accommodation: AccommodationType,
    session_id: str,
    index: int,
) -> FlagExplanation:
    resolved = resolve_threshold(signal.type, accommodation)
    unit, reason_code, reason_title = _FLAG_COPY[signal.type]

    adjusted = resolved.adjusted_threshold
    ratio = signal.observedValue / adjusted if adjusted > 0 else signal.observedValue
    auto_resolved = signal.observedValue <= adjusted
    severity = _severity_for_ratio(ratio, auto_resolved)
    action = _recommended_action(severity, auto_resolved)

    duration = _duration_seconds(signal.startedAt, signal.endedAt)

    reasons: List[FlagReason] = [
        FlagReason(
            code=reason_code,
            title=reason_title,
            description=(
                f"Measured {signal.observedValue:g} {unit} versus a personal "
                f"baseline of {signal.baselineValue:g} {unit}."
            ),
            weight=1.0,
            observedValue=signal.observedValue,
            baselineValue=signal.baselineValue,
        )
    ]

    # If no per-sample timeline was supplied, synthesise a minimal one so the
    # UI timeline always has something to render.
    timeline = signal.samples or [
        FlagEvidencePoint(
            timestamp=signal.startedAt,
            label=f"{reason_title} started",
            observedValue=signal.observedValue,
            thresholdValue=adjusted,
            exceeded=not auto_resolved,
        ),
        FlagEvidencePoint(
            timestamp=signal.endedAt,
            label=f"{reason_title} ended",
            observedValue=signal.observedValue,
            thresholdValue=adjusted,
            exceeded=not auto_resolved,
        ),
    ]

    return FlagExplanation(
        flagId=signal.flagId or f"{session_id}-flag-{index + 1}",
        sessionId=session_id,
        type=signal.type,
        severity=severity,
        timeRange=TimeRange(
            startedAt=signal.startedAt,
            endedAt=signal.endedAt,
            durationSeconds=duration,
        ),
        observedValue=signal.observedValue,
        baselineValue=signal.baselineValue,
        policyThreshold=resolved.policy_threshold,
        adjustedThreshold=adjusted,
        accommodationApplied=accommodation,
        accommodationAdjustment=resolved.note or None,
        confidence=round(signal.confidence, 4),
        summary=_summary(
            signal.type,
            signal.observedValue,
            adjusted,
            accommodation,
            auto_resolved,
            unit,
        ),
        reasons=reasons,
        evidenceTimeline=timeline,
        recommendedAction=action,
        autoResolved=auto_resolved,
        disputable=not auto_resolved,
        modelVersion=MODEL_VERSION,
        generatedAt=_now_iso(),
    )


def build_session_explanations(
    request: BuildExplanationsRequest,
) -> SessionFlagExplanations:
    explanations = [
        build_explanation(signal, request.accommodation, request.sessionId, i)
        for i, signal in enumerate(request.signals)
    ]
    return SessionFlagExplanations(
        sessionId=request.sessionId,
        studentDid=request.studentDid,
        examId=request.examId,
        generatedAt=_now_iso(),
        explanations=explanations,
    )


def demo_signals() -> List[RawFlagSignal]:
    """Deterministic demo signals used by the GET demo endpoint."""
    return [
        RawFlagSignal(
            type=FlagType.GAZE_AWAY,
            startedAt="2026-06-10T10:14:02Z",
            endedAt="2026-06-10T10:14:14Z",
            observedValue=12.0,
            baselineValue=2.5,
            confidence=0.86,
        ),
        RawFlagSignal(
            type=FlagType.TYPING_IDENTITY_DRIFT,
            startedAt="2026-06-10T10:31:00Z",
            endedAt="2026-06-10T10:33:00Z",
            observedValue=0.41,
            baselineValue=0.08,
            confidence=0.73,
        ),
        # Within threshold once the screen-reader accommodation is applied.
        RawFlagSignal(
            type=FlagType.GAZE_AWAY,
            startedAt="2026-06-10T10:45:00Z",
            endedAt="2026-06-10T10:45:18Z",
            observedValue=18.0,
            baselineValue=15.0,
            confidence=0.9,
        ),
    ]
