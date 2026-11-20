"""
SadakSathi — FastAPI Backend Entry Point

Dual-model road intelligence system:
  • Road Hazard Model  — pothole, garbage, manhole, broken sign, broken street light
  • Traffic Model      — helmet, no_helmet, number_plate, triple_riding, wrong_side_moving

Run:  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging
import secrets
import sys
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException

from config import UPLOAD_PATH, get_settings

# Windows consoles and pipes default to cp1252, which garbles the emoji in log lines.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Reject calls without the shared ML_API_KEY (skipped when no key is configured)."""
    expected = get_settings().ML_API_KEY
    # Compare bytes: compare_digest raises TypeError on non-ASCII str, which would answer 500, not 401.
    if expected and not secrets.compare_digest((x_api_key or "").encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Missing or invalid X-API-Key header.")


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
      1. Ensure upload directory exists.
      2. Load road hazard YOLO model (model.pt)        → app.state.model
      3. Load traffic violation YOLO model              → app.state.traffic_model
      4. Initialize EasyOCR reader                      → app.state.ocr_reader
      5. Initialize duplicate complaint detector        → app.state.detector

    All ML loading is guarded — the server starts even if heavy
    dependencies (torch, ultralytics, etc.) are not installed.
    """
    settings = get_settings()

    # ── 1. Upload directory ──
    UPLOAD_PATH.mkdir(parents=True, exist_ok=True)

    from ml.pool import ModelPool

    copies = max(1, settings.PARALLEL_WORKERS) if settings.PARALLEL_PROCESSING else 1
    logger.info(f"Parallel processing {'on' if copies > 1 else 'off'}: {copies} copy/copies of each detection model.")

    def build_pool(first, load):
        # First copy is already loaded; load the rest only when parallel processing is on.
        return ModelPool([first] + [load() for _ in range(copies - 1)]) if first else None

    # ── 2. Road Hazard Model ──
    try:
        from ml.detection import load_model

        device = settings.DEVICE
        model  = load_model(settings.MODEL_PATH, device=device)
        app.state.model = model
        app.state.model_pool = build_pool(model, lambda: load_model(settings.MODEL_PATH, device=device))
        if model:
            logger.info(f"✅ Road hazard model loaded: {settings.MODEL_PATH}")
        else:
            logger.warning(
                f"⚠️  Road hazard model not found at: {settings.MODEL_PATH}. "
                "POST /detect/image and /detect/video will return HTTP 503."
            )
    except ImportError as e:
        app.state.model = None
        logger.warning(f"⚠️  ML dependencies not installed ({e}). Road hazard detection disabled.")

    # ── 3. Traffic Violation Model ──
    try:
        from ml.traffic import load_traffic_model

        traffic_model = load_traffic_model(settings.TRAFFIC_MODEL_PATH, device=settings.DEVICE)
        app.state.traffic_model = traffic_model
        app.state.traffic_model_pool = build_pool(traffic_model, lambda: load_traffic_model(settings.TRAFFIC_MODEL_PATH, device=settings.DEVICE))
        if traffic_model:
            logger.info(f"✅ Traffic violation model loaded: {settings.TRAFFIC_MODEL_PATH}")
        else:
            logger.warning(
                f"⚠️  Traffic model not found at: {settings.TRAFFIC_MODEL_PATH}. "
                "POST /detect/traffic/image and /detect/traffic/video will return HTTP 503."
            )
    except ImportError as e:
        app.state.traffic_model = None
        logger.warning(f"⚠️  ML dependencies not installed ({e}). Traffic detection disabled.")

    # ── 4. Florence-2 OCR Reader (for number plate text extraction) ──
    if settings.OCR_ENABLED:
        try:
            from ml.traffic import load_ocr_reader

            ocr_reader = load_ocr_reader()
            app.state.ocr_reader = ocr_reader
            if ocr_reader:
                logger.info(f"✅ Florence-2 OCR initialized")
            else:
                logger.warning("⚠️  Florence-2 OCR failed to initialize — number plate text will not be extracted.")
        except ImportError as e:
            app.state.ocr_reader = None
            logger.warning(f"⚠️  Florence-2 OCR not installed ({e}). OCR disabled.")
    else:
        app.state.ocr_reader = None
        logger.info("ℹ️  OCR disabled via OCR_ENABLED=false.")

    # ── 5. Duplicate Complaint Detector ──
    try:
        from ml.duplication import create_detector

        detector = create_detector(
            location_threshold=settings.LOCATION_THRESHOLD,
            text_similarity_threshold=settings.TEXT_SIMILARITY_THRESHOLD,
            n_clusters=settings.N_CLUSTERS,
        )
        app.state.detector = detector
        logger.info("✅ Duplicate detector initialized.")
    except ImportError as e:
        app.state.detector = None
        logger.warning(f"⚠️  ML dependencies not installed ({e}). Duplicate detection disabled.")

    logger.info("🚀 SadakSathi ML Backend is ready.")
    yield

    # ── Shutdown ──
    logger.info("Shutting down SadakSathi ML Backend.")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_TITLE,
        version=settings.APP_VERSION,
        description=(
            "SadakSathi AI Backend — dual-model road intelligence.\n\n"
            "**Road Hazard Detection** (`/detect/image`, `/detect/video`):\n"
            "Pothole · Garbage accumulation · Manhole cover · Broken sign · Broken street light · Fallen tree\n\n"
            "**Traffic Violation Detection** (`/detect/traffic/image`, `/detect/traffic/video`):\n"
            "Helmet compliance · Number plate + OCR · Triple riding · Wrong side moving\n\n"
            "> ⚠️ Model endpoints return HTTP 503 when the corresponding `.pt` file is not present."
        ),
        lifespan=lifespan,
        # The interactive docs map the whole API; expose them only while developing.
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
    )
    # No CORS middleware: browsers never call this server directly; the web app does, server-side.


    # ── Routers ──
    from routers.health      import router as health_router
    from routers.detection   import router as detection_router
    from routers.duplication import router as duplication_router
    from routers.traffic     import router as traffic_router

    if not settings.ML_API_KEY:
        logger.warning("ML_API_KEY is not set: detection and duplicate endpoints are open to anyone who can reach this server.")

    # /health stays open for uptime probes; everything else needs the shared key.
    protected = [Depends(require_api_key)]
    app.include_router(health_router)
    app.include_router(detection_router, dependencies=protected)
    app.include_router(duplication_router, dependencies=protected)
    app.include_router(traffic_router, dependencies=protected)

    return app


app = create_app()
