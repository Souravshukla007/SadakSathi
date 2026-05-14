"""
SadakSathi FastAPI Backend — Configuration
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # --- App ---
    APP_TITLE: str = "SadakSathi ML Backend"
    APP_VERSION: str = "0.2.0"
    DEBUG: bool = False

    # LOCAL: localhost. PRODUCTION: your Vercel URL is always allowed.
    # Add any additional origins (staging, preview) via EXTRA_CORS_ORIGINS env var.
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sadak-sathi-chi.vercel.app",
    ]
    EXTRA_CORS_ORIGINS: list[str] = []  # set in env for staging/preview URLs

    # --- Road Hazard Model ---
    # Detects: pothole, garbage, overflow_garbage, manhole_cover,
    #          broken_sign, broken_street_light, fallen_tree
    # Updated to best_municipal.pt — higher accuracy, improved garbage detection
    MODEL_PATH: str = str(Path(__file__).resolve().parent / "models" / "best_municipal.pt")
    CONF_THRESHOLD: float = 0.20  # Raised slightly — new model is more precise
    DEVICE: str = "auto"           # "auto" | "cpu" | "cuda"

    # --- Traffic Violation Model ---
    # Detects: helmet, no_helmet, number_plate, triple_riding, wrong_side_moving
    # Updated to best_traffic.pt — improved accuracy, proper number plate detection
    TRAFFIC_MODEL_PATH: str = str(Path(__file__).resolve().parent / "models" / "best_traffic.pt")

    # --- Object Tracking (Traffic Video) ---
    # "bytetrack.yaml" or "botsort.yaml" — Ultralytics built-in trackers
    TRACKER: str = "bytetrack.yaml"

    # --- OCR (Number Plate Reading) ---
    # Enabled: best_traffic.pt has dedicated number_plate class with proper bounding boxes
    OCR_ENABLED: bool = True
    OCR_LANGUAGES: list[str] = ["en"]  # EasyOCR language codes

    # --- Duplication Detection ---
    LOCATION_THRESHOLD: float = 0.1   # km — max distance to consider location similar
    TEXT_SIMILARITY_THRESHOLD: float = 0.65
    N_CLUSTERS: int | None = None      # K-Means clusters (None = auto)

    # --- Uploads ---
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 50

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — reads .env only once per process."""
    return Settings()


# Resolved paths (directory creation is handled in main.py lifespan, not at import time)
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_PATH = BASE_DIR / get_settings().UPLOAD_DIR

# ─────────────────────────────────────────────
#  Supported Class Labels (for documentation & validation)
# ─────────────────────────────────────────────

# Road hazard model classes — best_municipal.pt
# Improved: garbage and overflow_garbage detection significantly better in new model
ROAD_HAZARD_CLASSES: list[str] = [
    "pothole",
    "garbage",
    "overflow_garbage",
    "manhole_cover",
    "broken_sign",
    "broken_street_light",
    "fallen_tree",
]

# Traffic violation model classes — best_traffic.pt
# Improved: number_plate bounding boxes are accurate + OCR-ready in new model
TRAFFIC_VIOLATION_CLASSES: list[str] = [
    "helmet",
    "no_helmet",
    "number_plate",
    "number_plate_missing",
    "triple_riding",
    "wrong_side_moving",
    "vehicle",
    "motorcycle",
    "car",
    "bike",
    "truck",
    "bus",
]

ALL_DETECTION_CLASSES: list[str] = ROAD_HAZARD_CLASSES + TRAFFIC_VIOLATION_CLASSES
