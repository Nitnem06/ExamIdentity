"""Flag detection routes (MVP stub).

Wraps the explanation builder so a caller can submit raw behavioural signals
and receive explainable flags in one step.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.explanation import (
    BuildExplanationsRequest,
    SessionFlagExplanations,
)
from app.services.explanation_builder import build_session_explanations

router = APIRouter()


@router.post("/detect", response_model=SessionFlagExplanations)
async def detect_flags(request: BuildExplanationsRequest) -> SessionFlagExplanations:
    """Detect flags from raw signals and return explainable flag cards."""
    return build_session_explanations(request)
