"""Routes for Explainable Flag Cards."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.explanation import (
    AccommodationType,
    BuildExplanationsRequest,
    SessionFlagExplanations,
)
from app.services.explanation_builder import (
    build_session_explanations,
    demo_signals,
)

router = APIRouter()


@router.post("/build", response_model=SessionFlagExplanations)
async def build_explanations(request: BuildExplanationsRequest) -> SessionFlagExplanations:
    """Turn raw behavioural signals into explainable flag cards."""
    return build_session_explanations(request)


@router.get("/demo/{session_id}", response_model=SessionFlagExplanations)
async def demo_explanations(
    session_id: str,
    accommodation: AccommodationType = AccommodationType.NONE,
) -> SessionFlagExplanations:
    """Return deterministic demo explanations for a session.

    Pass ``?accommodation=SCREEN_READER`` to see how accommodation-adjusted
    thresholds change which signals become flags vs. auto-resolve.
    """
    request = BuildExplanationsRequest(
        sessionId=session_id,
        studentDid="did:key:zDemoStudent",
        examId="exam-calculus-ii",
        accommodation=accommodation,
        signals=demo_signals(),
    )
    return build_session_explanations(request)
