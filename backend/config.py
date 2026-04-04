"""
SadakSathi FastAPI Backend — Configuration
"""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # --- App ---
    APP_TITLE: str = "SadakSathi ML Backend"
    APP_VERSION: str = "0.2.0"
    DEBUG: bool = True

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # --- Road Hazard Model ---
    # Detects: pothole, garbage, overflow_garbage, manhole_cover,
    #          broken_sign, broken_street_light, fallen_tree
    MODEL_PATH: str = "model.pt"
    CONF_THRESHOLD: float = 0.25  # Default confidence threshold
    DEVICE: str = "auto"           # "auto" | "cpu" | "cuda"

    # --- Traffic Violation Model ---
    # Detects: helmet, no_helmet, number_plate, triple_riding, wrong_side_moving
    TRAFFIC_MODEL_PATH: str = "traffic_model.pt"

    # --- Object Tracking (Traffic Video) ---
    # "bytetrack.yaml" or "botsort.yaml" — Ultralytics built-in trackers
    TRACKER: str = "bytetrack.yaml"

    # --- OCR (Number Plate Reading) ---
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


def get_settings() -> Settings:
    return Settings()


# Resolved paths
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_PATH = BASE_DIR / get_settings().UPLOAD_DIR
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────
#  Supported Class Labels (for documentation & validation)
# ─────────────────────────────────────────────

# Road hazard model classes
ROAD_HAZARD_CLASSES: list[str] = [
    "pothole",
    "garbage",
    "overflow_garbage",
    "manhole_cover",
    "broken_sign",
    "broken_street_light",
    "fallen_tree",
]

# Traffic violation model classes
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
]

ALL_DETECTION_CLASSES: list[str] = ROAD_HAZARD_CLASSES + TRAFFIC_VIOLATION_CLASSES
