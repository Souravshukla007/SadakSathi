"""
SadakSathi — Pydantic Schemas for API request/response models.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────
#  Shared
# ─────────────────────────────────────────────


class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


# ─────────────────────────────────────────────
#  Road Hazard Detection
# ─────────────────────────────────────────────


class SingleDetection(BaseModel):
    """A single detected road hazard (pothole, garbage, manhole, broken sign, etc.)."""
    id: int
    class_name: str = Field(
        ...,
        description=(
            "Detected class: pothole | garbage | overflow_garbage | manhole_cover | "
            "broken_sign | broken_street_light | fallen_tree"
        ),
    )
    confidence: float
    bbox: BoundingBox
    area_pixels: int
    area_ratio: float
    depth_score: float
    priority: str = Field(..., description="High | Medium | Low")


class ImageAssessmentResponse(BaseModel):
    """Response from POST /detect/image."""
    success: bool = True
    total_detections: int
    detections: list[SingleDetection]
    road_priority: str = Field(..., description="Overall road hazard priority: High | Medium | Low")
    priority_counts: dict[str, int] = Field(default_factory=dict)
    annotated_image_base64: str | None = None
    message: str = ""


class VideoAssessmentResponse(BaseModel):
    """Response from POST /detect/video."""
    success: bool = True
    total_frames_analyzed: int
    total_detections: int
    road_priority: str = Field("Low", description="Overall road hazard priority across all frames: High | Medium | Low")
    priority_counts: dict[str, int] = Field(default_factory=dict)
    annotated_image_base64: str | None = Field(
        None,
        description="Base64-encoded JPEG of the most detection-rich frame, annotated with bounding boxes.",
    )
    summary: dict = Field(default_factory=dict)
    message: str = ""


# ─────────────────────────────────────────────
#  Traffic Violation Detection
# ─────────────────────────────────────────────


class TrafficDetection(BaseModel):
    """A single detected traffic object / violation in an image."""
    id: int
    class_name: str = Field(
        ...,
        description=(
            "Raw YOLO class: helmet | no_helmet | number_plate | "
            "triple_riding | wrong_side_moving | vehicle | motorcycle | car | bike"
        ),
    )
    display_name: str = Field(..., description="Human-readable class label")
    confidence: float
    bbox: BoundingBox
    priority: str = Field(..., description="High | Medium | Low")
    plate_text: str | None = Field(
        None,
        description="OCR-read number plate text (only set for number_plate class)",
    )


class TrafficAssessmentResponse(BaseModel):
    """Response from POST /detect/traffic/image."""
    success: bool = True
    total_detections: int
    detections: list[TrafficDetection]
    overall_priority: str = Field(..., description="Highest severity among all detections")
    priority_counts: dict[str, int] = Field(default_factory=dict)
    class_counts: dict[str, int] = Field(default_factory=dict)
    annotated_image_base64: str | None = None
    message: str = ""


class UniqueViolation(BaseModel):
    """De-duplicated violation record for a single tracked object (video only)."""
    track_id: int
    class_name: str
    display_name: str
    priority: str
    first_seen_frame: int
    first_seen_sec: float
    confidence: float
    plate_text: str | None = None


class TrafficVideoSummary(BaseModel):
    class_counts: dict[str, int] = Field(default_factory=dict)
    priority_counts: dict[str, int] = Field(default_factory=dict)
    fps: float = 0.0
    tracker: str = "bytetrack.yaml"


class TrafficVideoAssessmentResponse(BaseModel):
    """Response from POST /detect/traffic/video."""
    success: bool = True
    total_frames_analyzed: int
    total_frames: int
    total_detections: int
    unique_tracked_violations: int = Field(
        ...,
        description="Number of unique objects (by track_id) with High/Medium priority",
    )
    violations: list[UniqueViolation] = Field(
        default_factory=list,
        description="De-duplicated violation list — one entry per tracked object",
    )
    summary: TrafficVideoSummary = Field(default_factory=TrafficVideoSummary)
    message: str = ""


# ─────────────────────────────────────────────
#  Duplication Detection
# ─────────────────────────────────────────────


class DuplicateCheckRequest(BaseModel):
    """Request body for /duplicate/check."""
    text: str = Field(..., description="Description of the reported issue")
    location: list[float] = Field(..., min_length=2, max_length=2, description="[latitude, longitude]")
    issue_type: str = Field(
        ...,
        description=(
            "Type of issue: pothole | manhole_cover | garbage | broken_sign | "
            "broken_street_light | fallen_tree | helmet | triple_riding | wrong_side_moving"
        ),
    )
    image_base64: str | None = Field(None, description="Optional base64-encoded image")


class SimilarReport(BaseModel):
    id: str = "unknown"
    text: str = ""
    issue_type: str = ""
    location: list[float] = Field(default_factory=list)


class DuplicateCheckResponse(BaseModel):
    """Response from /duplicate/check."""
    is_duplicate: bool
    confidence: float = 0.0
    original_report_id: str | None = None
    similar_reports: list[SimilarReport] = Field(default_factory=list)


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
    traffic_model_loaded: bool = False
    traffic_model_path: str = ""
    ocr_loaded: bool = False
    gpu_available: bool = False
    device: str = "cpu"
    detector_reports: int = 0
