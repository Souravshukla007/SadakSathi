"""
SadakSathi — FastAPI Backend Entry Point

Multi-class road hazard detection + duplicate complaint detection.
Run:  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import UPLOAD_PATH, get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("sadaksathi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup / shutdown lifecycle.

    On startup:
    - Load YOLO model (if model file exists)
    - Initialize duplicate detector
    """
    settings = get_settings()

    # Ensure upload dir exists
    UPLOAD_PATH.mkdir(parents=True, exist_ok=True)

    # ── Load YOLO Model ──
    from ml.detection import load_model

    device = settings.DEVICE
    model = load_model(settings.MODEL_PATH, device=device)
    app.state.model = model
    if model:
        logger.info(f"✅ YOLO model loaded from: {settings.MODEL_PATH}")
    else:
        logger.warning(f"⚠️  YOLO model not found at: {settings.MODEL_PATH}. Detection endpoints will be unavailable.")

    # ── Initialize Duplicate Detector ──
    from ml.duplication import create_detector

    detector = create_detector(
        location_threshold=settings.LOCATION_THRESHOLD,
        text_similarity_threshold=settings.TEXT_SIMILARITY_THRESHOLD,
        n_clusters=settings.N_CLUSTERS,
    )
    app.state.detector = detector
    logger.info("✅ Duplicate detector initialized.")

    logger.info("🚀 SadakSathi ML Backend is ready.")
    yield

    # ── Shutdown ──
    logger.info("Shutting down SadakSathi ML Backend.")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_TITLE,
        version=settings.APP_VERSION,
        description="AI-powered road hazard detection and duplicate complaint detection for SadakSathi.",
        lifespan=lifespan,
    )

    # ── CORS ──
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ──
    from routers.health import router as health_router
    from routers.detection import router as detection_router
    from routers.duplication import router as duplication_router

    app.include_router(health_router)
    app.include_router(detection_router)
    app.include_router(duplication_router)

    return app


app = create_app()
