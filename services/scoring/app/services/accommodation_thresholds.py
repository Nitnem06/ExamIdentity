"""Accommodation-aware policy thresholds.

Each flag type has a standard policy threshold (the value above which the
behaviour is flagged). Accommodations relax specific thresholds so that, for
example, a student with extended time is not penalised for longer pauses, and a
screen-reader user is not penalised for looking away from the screen.

This module is intentionally simple and deterministic for the MVP; in
production these thresholds would come from institutional policy configuration.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from app.schemas.explanation import AccommodationType, FlagType

# Standard policy thresholds keyed by flag type. Units are documented per flag.
BASE_THRESHOLDS: Dict[FlagType, float] = {
    FlagType.GAZE_AWAY: 8.0,  # seconds of continuous off-screen gaze
    FlagType.TYPING_IDENTITY_DRIFT: 0.35,  # 1 - similarity to baseline (0..1)
    FlagType.MULTIPLE_VOICES: 1.0,  # number of additional voices detected
    FlagType.SYSTEMIC_EVENT: 1.0,  # systemic anomaly indicator
    FlagType.DEVICE_INTEGRITY: 1.0,  # device integrity violations
}

# Multipliers applied to the base threshold per (flag type, accommodation).
# A multiplier > 1 relaxes the threshold (more tolerant). 1.0 = no change.
_ACCOMMODATION_MULTIPLIERS: Dict[AccommodationType, Dict[FlagType, float]] = {
    AccommodationType.NONE: {},
    AccommodationType.EXTENDED_TIME: {
        FlagType.GAZE_AWAY: 1.5,
        FlagType.TYPING_IDENTITY_DRIFT: 1.2,
    },
    AccommodationType.SCREEN_READER: {
        # Screen-reader users routinely look away from the screen.
        FlagType.GAZE_AWAY: 3.0,
    },
    AccommodationType.BREAKS_ALLOWED: {
        FlagType.GAZE_AWAY: 2.0,
    },
    AccommodationType.SEPARATE_ROOM: {
        FlagType.MULTIPLE_VOICES: 1.0,
    },
    AccommodationType.ASSISTIVE_TECH: {
        FlagType.GAZE_AWAY: 2.0,
        FlagType.DEVICE_INTEGRITY: 1.5,
    },
    AccommodationType.REDUCED_DISTRACTION: {
        FlagType.GAZE_AWAY: 1.25,
    },
}

# Human-readable notes explaining each adjustment shown on the flag card.
_ADJUSTMENT_NOTES: Dict[AccommodationType, str] = {
    AccommodationType.EXTENDED_TIME: "Extended-time accommodation relaxes pause and gaze thresholds.",
    AccommodationType.SCREEN_READER: "Screen-reader accommodation greatly relaxes the off-screen gaze threshold.",
    AccommodationType.BREAKS_ALLOWED: "Scheduled-breaks accommodation relaxes the off-screen gaze threshold.",
    AccommodationType.SEPARATE_ROOM: "Separate-room accommodation applied; standard audio threshold retained.",
    AccommodationType.ASSISTIVE_TECH: "Assistive-technology accommodation relaxes gaze and device-integrity thresholds.",
    AccommodationType.REDUCED_DISTRACTION: "Reduced-distraction accommodation slightly relaxes the gaze threshold.",
}


@dataclass(frozen=True)
class ResolvedThreshold:
    flag_type: FlagType
    accommodation: AccommodationType
    policy_threshold: float
    adjusted_threshold: float
    multiplier: float
    note: str


def base_threshold(flag_type: FlagType) -> float:
    """Return the standard (pre-accommodation) threshold for a flag type."""
    return BASE_THRESHOLDS.get(flag_type, 1.0)


def resolve_threshold(
    flag_type: FlagType,
    accommodation: AccommodationType = AccommodationType.NONE,
) -> ResolvedThreshold:
    """Resolve the policy and accommodation-adjusted thresholds for a flag."""
    policy = base_threshold(flag_type)
    multiplier = _ACCOMMODATION_MULTIPLIERS.get(accommodation, {}).get(flag_type, 1.0)
    adjusted = round(policy * multiplier, 4)
    note = "" if multiplier == 1.0 else _ADJUSTMENT_NOTES.get(accommodation, "")
    return ResolvedThreshold(
        flag_type=flag_type,
        accommodation=accommodation,
        policy_threshold=policy,
        adjusted_threshold=adjusted,
        multiplier=multiplier,
        note=note,
    )
