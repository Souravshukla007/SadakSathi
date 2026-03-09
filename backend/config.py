"""
SadakSathi FastAPI Backend — Configuration
"""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    # --- App ---
    APP_TITLE: str = "SadakSathi ML Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # --- CORS ---
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # --- ML Model ---
    MODEL_PATH: str = "model.pt"  # Path to YOLO multi-class model file
    CONF_THRESHOLD: float = 0.25  # Default confidence threshold for detection
    DEVICE: str = "auto"  # "auto" | "cpu" | "cuda"

    # --- Duplication Detection ---
    LOCATION_THRESHOLD: float = 0.1  # km — max distance to consider location similar
    TEXT_SIMILARITY_THRESHOLD: float = 0.65  # Threshold for overall similarity
    N_CLUSTERS: int | None = None  # K-Means clusters (None = auto)

    # --- Uploads ---
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 50  # Max upload size in MB

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


def get_settings() -> Settings:
    return Settings()


# Resolved paths
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_PATH = BASE_DIR / get_settings().UPLOAD_DIR
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
