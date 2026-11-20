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

    # Shared secret the web app sends as X-API-Key. Empty disables the check (local dev only);
    # always set it when this server is reachable from the internet.
    ML_API_KEY: str = ""

    # --- Parallel processing ---
    # false: one copy of each model, requests for the same model run one at a time (least RAM).
    # true:  PARALLEL_WORKERS copies of each YOLO model, so that many requests run at once
    #        (each copy adds ~50-100 MB of RAM; Florence OCR stays a single shared copy).
    PARALLEL_PROCESSING: bool = False
    PARALLEL_WORKERS: int = 2


    # --- Road Hazard Model ---
    # Committed YOLO26n road model. Classes: garbage, garbage_overflow, manhole_broken,
    #   manhole_lose, manhole_uncovered, pothole, fallen_tree (mAP50 0.813).
    # Override with MODEL_PATH env (e.g. models/best_municipal.pt if you have it locally).
    MODEL_PATH: str = str(Path(__file__).resolve().parent / "models" / "best_whole_model_nano.pt")
    DEVICE: str = "auto"           # "auto" | "cpu" | "cuda"

    # --- Traffic Violation Model ---
    # Committed YOLO26n traffic model. Classes: Plate, WithHelmet, WithoutHelmet, TripleRiding.
    # Override with TRAFFIC_MODEL_PATH env (e.g. models/best_traffic.pt if you have it locally).
    TRAFFIC_MODEL_PATH: str = str(Path(__file__).resolve().parent / "models" / "traffic_model_nano_worse.pt")

    # --- Object Tracking (Traffic Video) ---
    # "bytetrack.yaml" or "botsort.yaml" — Ultralytics built-in trackers
    TRACKER: str = "bytetrack.yaml"

    # --- OCR (Number Plate Reading) ---
    # false skips loading Florence-2 (~1 GB RAM, slow on CPU); plates are then detected but not read.
    OCR_ENABLED: bool = True

    # --- Duplication Detection ---
    LOCATION_THRESHOLD: float = 0.1   # km — max distance to consider location similar
    TEXT_SIMILARITY_THRESHOLD: float = 0.65
    N_CLUSTERS: int | None = None      # K-Means clusters (None = auto)

    # --- Uploads ---
    UPLOAD_DIR: str = "uploads"

    model_config = {"env_file": Path(__file__).resolve().parent / ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


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
