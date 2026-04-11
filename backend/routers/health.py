"""
SadakSathi — Health Check Router
"""

from fastapi import APIRouter, Request

from models.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    """
    Health check — returns status of both ML models, EasyOCR, GPU, and detector.

    Use this endpoint to confirm the server is ready to serve detection requests.
    """
    from config import get_settings

    settings = get_settings()

    model          = getattr(request.app.state, "model",          None)
    traffic_model  = getattr(request.app.state, "traffic_model",  None)
    ocr_reader     = getattr(request.app.state, "ocr_reader",     None)
    detector       = getattr(request.app.state, "detector",       None)

    # Guard torch import — health probes should never crash
    gpu_available = False
    device = "cpu"
    try:
        import torch
        gpu_available = torch.cuda.is_available()
        device = "cuda" if gpu_available else "cpu"
    except ImportError:
        pass

    return HealthResponse(
        status="ok",
        model_loaded=model is not None,
        model_path=settings.MODEL_PATH,
        traffic_model_loaded=traffic_model is not None,
        traffic_model_path=settings.TRAFFIC_MODEL_PATH,
        ocr_loaded=ocr_reader is not None,
        gpu_available=gpu_available,
        device=device,
        detector_reports=len(detector.reports_db) if detector else 0,
    )
