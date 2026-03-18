"""
SadakSathi — Pydantic Schemas for API request/response models.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────
#  Detection
# ─────────────────────────────────────────────


class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class SingleDetection(BaseModel):
    """A single detected object in an image."""
    id: int
    class_name: str = Field(..., description="Detected class: pothole, manhole_cover, garbage, fallen_tree, etc.")
    confidence: float
    bbox: BoundingBox
    area_pixels: int
    area_ratio: float
    depth_score: float
    priority: str = Field(..., description="High / Medium / Low")


class ImageAssessmentResponse(BaseModel):
    """Response from /detect/image endpoint."""
    success: bool = True
    total_detections: int
    detections: list[SingleDetection]
    road_priority: str
    priority_counts: dict[str, int] = Field(default_factory=dict)
    annotated_image_base64: str | None = None
    message: str = ""


class VideoAssessmentResponse(BaseModel):
    """Response from /detect/video endpoint."""
    success: bool = True
    total_frames_analyzed: int
    total_detections: int
    summary: dict = Field(default_factory=dict)
    message: str = ""


# ─────────────────────────────────────────────
#  Duplication Detection
# ─────────────────────────────────────────────


class DuplicateCheckRequest(BaseModel):
    """Request body for /duplicate/check."""
    text: str = Field(..., description="Description of the reported issue")
    location: list[float] = Field(..., min_length=2, max_length=2, description="[latitude, longitude]")
    issue_type: str = Field(..., description="Type of issue: pothole, manhole_cover, garbage, fallen_tree, etc.")
    image_base64: str | None = Field(None, description="Optional base64-encoded image")


class DuplicateCheckResponse(BaseModel):
    """Response from /duplicate/check."""
    is_duplicate: bool
    confidence: float = 0.0
    original_report_id: str | None = None
    similar_reports: list[SimilarReport] = Field(default_factory=list)


class SimilarReport(BaseModel):
    id: str = "unknown"
    text: str = ""
    issue_type: str = ""
    location: list[float] = Field(default_factory=list)


# Fix forward ref
DuplicateCheckResponse.model_rebuild()


class AddReportRequest(BaseModel):
    """Request body for /duplicate/add-report."""
    id: str = Field(..., description="Unique report ID (from the complaint's DB ID)")
    text: str = Field(..., description="Description of the reported issue")
    location: list[float] = Field(..., min_length=2, max_length=2, description="[latitude, longitude]")
    issue_type: str = Field(..., description="Type of issue")
    image_base64: str | None = Field(None, description="Optional base64-encoded image")


class AddReportResponse(BaseModel):
    success: bool
    index: int | None = None
    message: str = ""


class DuplicateStatsResponse(BaseModel):
    total_reports: int
    issue_types: dict[str, int] = Field(default_factory=dict)
    xgboost_trained: bool
    clusters_built: bool


# ─────────────────────────────────────────────
#  Health
# ─────────────────────────────────────────────


class HealthResponse(BaseModel):
    status: str = "ok"
    model_loaded: bool = False
    model_path: str = ""
    gpu_available: bool = False
    device: str = "cpu"
    detector_reports: int = 0
