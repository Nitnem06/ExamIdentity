"""Pydantic schemas for Explainable Flag Cards.

These mirror the TypeScript domain types in
``packages/shared-types/src/explanations.ts`` so the scoring service, the API
and the web client all agree on the explanation contract.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class FlagType(str, Enum):
    GAZE_AWAY = "GAZE_AWAY"
    TYPING_IDENTITY_DRIFT = "TYPING_IDENTITY_DRIFT"
    MULTIPLE_VOICES = "MULTIPLE_VOICES"
    SYSTEMIC_EVENT = "SYSTEMIC_EVENT"
    DEVICE_INTEGRITY = "DEVICE_INTEGRITY"


class FlagSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AccommodationType(str, Enum):
    NONE = "NONE"
    EXTENDED_TIME = "EXTENDED_TIME"
    SCREEN_READER = "SCREEN_READER"
    BREAKS_ALLOWED = "BREAKS_ALLOWED"
    SEPARATE_ROOM = "SEPARATE_ROOM"
    ASSISTIVE_TECH = "ASSISTIVE_TECH"
    REDUCED_DISTRACTION = "REDUCED_DISTRACTION"


class RecommendedAction(str, Enum):
    NO_ACTION = "NO_ACTION"
    AUTO_RESOLVED = "AUTO_RESOLVED"
    STUDENT_REVIEW = "STUDENT_REVIEW"
    MONITOR = "MONITOR"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    ESCALATE = "ESCALATE"


class TimeRange(BaseModel):
    startedAt: str
    endedAt: str
    durationSeconds: float


class FlagEvidencePoint(BaseModel):
    timestamp: str
    label: str
    observedValue: float
    thresholdValue: float
    exceeded: bool
    detail: Optional[str] = None


class FlagReason(BaseModel):
    code: str
    title: str
    description: str
    weight: float = Field(ge=0.0, le=1.0)
    observedValue: float
    baselineValue: float


class FlagExplanation(BaseModel):
    flagId: str
    sessionId: str
    type: FlagType
    severity: FlagSeverity
    timeRange: TimeRange
    observedValue: float
    baselineValue: float
    policyThreshold: float
    adjustedThreshold: float
    accommodationApplied: AccommodationType
    accommodationAdjustment: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str
    reasons: List[FlagReason]
    evidenceTimeline: List[FlagEvidencePoint]
    recommendedAction: RecommendedAction
    autoResolved: bool
    disputable: bool
    modelVersion: str
    generatedAt: str


class SessionFlagExplanations(BaseModel):
    sessionId: str
    studentDid: str
    examId: str
    generatedAt: str
    explanations: List[FlagExplanation]


# ---- Request schemas ------------------------------------------------------


class RawFlagSignal(BaseModel):
    """A raw behavioural observation the builder turns into an explanation."""

    flagId: Optional[str] = None
    type: FlagType
    startedAt: str
    endedAt: str
    observedValue: float
    baselineValue: float
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    samples: List[FlagEvidencePoint] = Field(default_factory=list)


class BuildExplanationsRequest(BaseModel):
    sessionId: str
    studentDid: str = "did:key:zUnknown"
    examId: str = "exam-unknown"
    accommodation: AccommodationType = AccommodationType.NONE
    signals: List[RawFlagSignal] = Field(default_factory=list)
