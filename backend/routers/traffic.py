"""
SadakSathi — Traffic Violation Detection Router

Endpoints:
    POST /detect/traffic/image  — Upload image → detect violations (helmet, triple riding, etc.)
    POST /detect/traffic/video  — Upload video → ByteTrack/BoT-SORT tracking → unique violations
"""

from __future__ import annotations

import logging
import os
import uuid

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from config import UPLOAD_PATH
from models.schemas import TrafficAssessmentResponse, TrafficDetection, TrafficVideoAssessmentResponse
from routers.stats import record_detection

# NOTE: ml.traffic imports are deferred to function level so the router module
# can be imported in lightweight environments (CI) where torch is not installed.

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/detect/traffic", tags=["Traffic Detection"])

MAX_IMAGE_SIZE = 20 * 1024 * 1024   # 20 MB
MAX_VIDEO_SIZE = 200 * 1024 * 1024  # 200 MB (tracking needs full video)


# ─────────────────────────────────────────────────────────────────────────────
#  POST /detect/traffic/image
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/image", response_model=TrafficAssessmentResponse)
async def detect_traffic_image(
    request: Request,
    file: UploadFile = File(..., description="Image file (JPG, PNG, WEBP)"),
    conf_threshold: float = Form(0.25, ge=0.0, le=1.0, description="Confidence threshold"),
    include_annotated: bool = Form(True, description="Return base64 annotated image"),
    run_ocr: bool = Form(True, description="Run EasyOCR on detected number plates"),
):
    """
    Detect traffic violations in a single image.

    Detects:
      • **Helmet / No Helmet** — rider compliance
      • **Number Plate** — with optional OCR text extraction
      • **Triple Riding** — three or more persons on a two-wheeler
      • **Wrong Side Moving** — vehicle travelling against traffic

    Returns bounding boxes, confidence scores, per-detection priority
    (High / Medium / Low), and optionally an annotated image (base64).
    """
    # ── Model guard ──
    traffic_model = getattr(request.app.state, "traffic_model", None)
    if traffic_model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Traffic ML model not loaded. "
                "Place traffic_model.pt in backend/ and restart the server."
            ),
        )

    from ml.traffic import assess_traffic_image, encode_image_to_base64, get_traffic_device

    # ── Validate content type ──
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Expected an image file (image/*), got: {content_type}",
        )

    # ── Read bytes ──
    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Image too large. Maximum allowed size is {MAX_IMAGE_SIZE // (1024 * 1024)} MB.",
        )

    # ── Run detection ──
    device = get_traffic_device()

    result, annotated = assess_traffic_image(
        image_bytes,
        model=traffic_model,
        conf_threshold=conf_threshold,
        device=device,
        return_annotated=include_annotated,
        run_ocr=run_ocr,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("message", "Detection failed"))

    # ── Encode annotated image ──
    annotated_b64 = None
    if annotated is not None and include_annotated:
        annotated_b64 = encode_image_to_base64(annotated)

    # ── Build clean detections (strip internal 'position' field) ──
    clean_detections = []
    for det in result.get("detections", []):
        clean_detections.append(
            TrafficDetection(
                id=det["id"],
                class_name=det["class_name"],
                display_name=det["display_name"],
                confidence=det["confidence"],
                bbox=det["bbox"],
                priority=det["priority"],
                plate_text=det.get("plate_text"),
            )
        )

    response = TrafficAssessmentResponse(
        success=True,
        total_detections=result.get("total_detections", 0),
        detections=clean_detections,
        overall_priority=result.get("overall_priority", "Low"),
        priority_counts=result.get("priority_counts", {}),
        class_counts=result.get("class_counts", {}),
        annotated_image_base64=annotated_b64,
        message=result.get("message", ""),
    )

    # Update session-scoped stats
    record_detection(
        engine="traffic",
        total_detections=response.total_detections,
        priority_counts=result.get("priority_counts", {}),
        class_counts=result.get("class_counts", {}),
    )

    return response


# ─────────────────────────────────────────────────────────────────────────────
#  POST /detect/traffic/video
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/video", response_model=TrafficVideoAssessmentResponse)
async def detect_traffic_video(
    request: Request,
    file: UploadFile = File(..., description="Video file (MP4, AVI, MOV)"),
    conf_threshold: float = Form(0.25, ge=0.0, le=1.0, description="Confidence threshold"),
    tracker: str = Form(
        "bytetrack.yaml",
        description='Tracker config: "bytetrack.yaml" or "botsort.yaml"',
    ),
    run_ocr: bool = Form(True, description="Run EasyOCR on detected number plates"),
):
    """
    Detect traffic violations across an entire video using object tracking.

    Uses **ByteTrack** (default) or **BoT-SORT** to assign persistent `track_id`s
    to vehicles and riders across frames.  The same vehicle is counted as one
    violation regardless of how many frames it appears in.

    Returns:
      - `unique_tracked_violations` — de-duplicated count (one per track_id)
      - `violations[]` — list of unique violations with first-seen timestamp
      - `summary.class_counts` / `priority_counts` — frame-level aggregates
    """
    traffic_model = getattr(request.app.state, "traffic_model", None)
    if traffic_model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Traffic ML model not loaded. "
                "Place traffic_model.pt in backend/ and restart the server."
            ),
        )

    from ml.traffic import assess_traffic_video, get_traffic_device

    content_type = file.content_type or ""
    if not content_type.startswith("video/"):
        raise HTTPException(
            status_code=400,
            detail=f"Expected a video file (video/*), got: {content_type}",
        )

    # Validate tracker choice
    allowed_trackers = {"bytetrack.yaml", "botsort.yaml"}
    if tracker not in allowed_trackers:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tracker '{tracker}'. Choose from: {sorted(allowed_trackers)}",
        )

    video_bytes = await file.read()
    if len(video_bytes) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Video too large. Maximum allowed size is {MAX_VIDEO_SIZE // (1024 * 1024)} MB.",
        )

    # Save to temp file (Ultralytics tracker needs a file path)
    temp_filename = f"traffic_{uuid.uuid4().hex}.mp4"
    temp_path     = UPLOAD_PATH / temp_filename

    try:
        with open(temp_path, "wb") as f:
            f.write(video_bytes)

        device = get_traffic_device()

        result = assess_traffic_video(
            str(temp_path),
            model=traffic_model,
            conf_threshold=conf_threshold,
            device=device,
            tracker=tracker,
            run_ocr=run_ocr,
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("message", "Video processing failed"),
            )

        response = TrafficVideoAssessmentResponse(
            success=True,
            total_frames_analyzed=result.get("total_frames_analyzed", 0),
            total_frames=result.get("total_frames", 0),
            total_detections=result.get("total_detections", 0),
            unique_tracked_violations=result.get("unique_tracked_violations", 0),
            violations=result.get("violations", []),
            summary=result.get("summary", {}),
            message=result.get("message", ""),
        )

        # Update session-scoped stats
        summary = result.get("summary", {})
        record_detection(
            engine="traffic",
            total_detections=response.total_detections,
            priority_counts=summary.get("priority_counts", {}),
            class_counts=summary.get("class_counts", {}),
        )

        return response

    finally:
        if temp_path.exists():
            try:
                os.remove(temp_path)
            except Exception:
                pass
