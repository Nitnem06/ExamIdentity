"""Minimal integrity-scoring routes (MVP stub).

Computes a deterministic integrity score band from a behavioural summary. The
full ML model lives behind this interface and can be swapped in without
changing the route contract.
"""

from __future__ import annotations

from typing import List, Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class ScoreRequest(BaseModel):
    sessionId: str
    flagCount: int = Field(default=0, ge=0)
    criticalFlags: int = Field(default=0, ge=0)
    accommodationAdjustedSessions: int = Field(default=0, ge=0)


class ScoreResponse(BaseModel):
    sessionId: str
    integrityScore: int = Field(ge=0, le=100)
    scoreBand: Literal["HIGH", "MEDIUM", "LOW"]
    factors: List[str]


@router.post("/score", response_model=ScoreResponse)
async def score_session(request: ScoreRequest) -> ScoreResponse:
    penalty = request.flagCount * 8 + request.criticalFlags * 20
    score = max(0, 100 - penalty)
    band: Literal["HIGH", "MEDIUM", "LOW"]
    if score >= 80:
        band = "HIGH"
    elif score >= 50:
        band = "MEDIUM"
    else:
        band = "LOW"
    factors = [f"{request.flagCount} flags", f"{request.criticalFlags} critical flags"]
    return ScoreResponse(
        sessionId=request.sessionId,
        integrityScore=score,
        scoreBand=band,
        factors=factors,
    )
