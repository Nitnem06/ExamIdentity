"""Dispute triage routes (MVP stub).

Provides a deterministic AI recommendation for a disputed flag. Tier-2 and
human-panel review happen in the API service; this endpoint only produces the
first-pass recommendation and confidence.
"""

from __future__ import annotations

from typing import Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class DisputeRequest(BaseModel):
    flagId: str
    reason: str
    context: Optional[str] = None
    autoResolved: bool = False
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "MEDIUM"


class DisputeRecommendation(BaseModel):
    flagId: str
    recommendation: Literal["APPROVE", "REJECT", "ESCALATE"]
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str


@router.post("/triage", response_model=DisputeRecommendation)
async def triage_dispute(request: DisputeRequest) -> DisputeRecommendation:
    if request.autoResolved or request.severity == "LOW":
        return DisputeRecommendation(
            flagId=request.flagId,
            recommendation="APPROVE",
            confidence=0.92,
            reasoning="Low-severity or already auto-resolved; recommend approving the dispute.",
        )
    if request.severity == "CRITICAL":
        return DisputeRecommendation(
            flagId=request.flagId,
            recommendation="ESCALATE",
            confidence=0.61,
            reasoning="Critical severity requires human-panel review before resolution.",
        )
    return DisputeRecommendation(
        flagId=request.flagId,
        recommendation="REJECT",
        confidence=0.7,
        reasoning="Evidence exceeds the accommodation-adjusted threshold; recommend upholding the flag pending tier-2 review.",
    )
