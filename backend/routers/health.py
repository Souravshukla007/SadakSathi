"""
SadakSathi — Health Check Router
"""

from fastapi import APIRouter, Request

from models.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    """
    Health check — returns model status, GPU availability, and detector stats.
    """
    import torch
    from config import get_settings

    settings = get_settings()
    model_loaded = getattr(request.app.state, "model", None) is not None
    detector = getattr(request.app.state, "detector", None)

    return HealthResponse(
        status="ok",
        model_loaded=model_loaded,
        model_path=settings.MODEL_PATH,
        gpu_available=torch.cuda.is_available(),
        device="cuda" if torch.cuda.is_available() else "cpu",
        detector_reports=len(detector.reports_db) if detector else 0,
    )
