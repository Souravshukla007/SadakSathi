"""
SadakSathi — Detection API Router (best_municipal.pt)

Endpoints:
    POST /detect/image  — Upload an image for multi-class hazard detection
    POST /detect/video  — Upload a video for frame-by-frame hazard detection

Model: best_municipal.pt
  Improved detection for: pothole, garbage, overflow_garbage, manhole_cover,
  broken_sign, broken_street_light, fallen_tree
"""

from __future__ import annotations

import logging
import os
import uuid

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from config import UPLOAD_PATH
from ml.pool import pool_for
from ml.uploads import ensure_readable_video, save_video
from models.schemas import ImageAssessmentResponse, VideoAssessmentResponse

# NOTE: ml.detection imports are deferred to function level so the router module
# can be imported in lightweight environments (CI) where torch is not installed.

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/detect", tags=["Detection"])

# Max file sizes
MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB



@router.post("/image", response_model=ImageAssessmentResponse)
def detect_image(
    request: Request,
    file: UploadFile = File(..., description="Image file (JPG, PNG, WEBP)"),
    conf_threshold: float = Form(0.20, ge=0.0, le=1.0, description="Confidence threshold (0.0 - 1.0). Default 0.20 matches best_municipal.pt optimal sensitivity."),
    include_annotated: bool = Form(True, description="Include base64-encoded annotated image"),
):
    """
    Upload an image for multi-class hazard detection (best_municipal.pt).

    Detects: pothole, manhole_cover, garbage, overflow_garbage, fallen_tree,
    broken_sign, broken_street_light.

    Returns bounding boxes, confidence scores, depth scores, per-detection priority,
    overall road priority, and optionally an annotated image (base64).
    """
    model = getattr(request.app.state, "model", None)
    if model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded. Please place a .pt model file and restart.")

    from ml.detection import assess_road_image, encode_image_to_base64, get_device

    # Validate file type
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"Expected image file, got: {content_type}")

    # Read file bytes
    image_bytes = file.file.read(MAX_IMAGE_SIZE + 1)
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail=f"Image too large. Max {MAX_IMAGE_SIZE // (1024*1024)}MB.")

    # Run detection
    device = get_device()
    with pool_for(request.app.state, "model").acquire() as pooled:
        result, annotated = assess_road_image(
            image_bytes,
            model=pooled,
            conf_threshold=conf_threshold,
            device=device,
            return_annotated=include_annotated,
        )

    if not result.get("success"):
        message = result.get("message", "Detection failed")
        # A file that isn't a readable image is the caller's mistake (400), not a server fault (500).
        raise HTTPException(status_code=400 if "decode" in message.lower() else 500, detail=message)

    # Encode annotated image
    annotated_b64 = None
    if annotated is not None and include_annotated:
        annotated_b64 = encode_image_to_base64(annotated)

    # Clean detections for response (remove internal 'position' field)
    clean_detections = []
    for det in result.get("detections", []):
        clean_det = {k: v for k, v in det.items() if k != "position"}
        clean_detections.append(clean_det)

    response = ImageAssessmentResponse(
        success=True,
        total_detections=result.get("total_detections", 0),
        detections=clean_detections,
        road_priority=result.get("road_priority", "Low"),
        priority_counts=result.get("priority_counts", {}),
        annotated_image_base64=annotated_b64,
        message=result.get("message", ""),
    )

    return response


@router.post("/video", response_model=VideoAssessmentResponse)
def detect_video(
    request: Request,
    file: UploadFile = File(..., description="Video file (MP4, AVI, MOV)"),
    conf_threshold: float = Form(0.20, ge=0.0, le=1.0, description="Confidence threshold. Default 0.20 matches best_municipal.pt."),
    sample_rate: int = Form(5, ge=1, description="Process every Nth frame (default: 5)"),
):
    """
    Upload a video for hazard detection.

    Processes sampled frames, returns aggregate detection summary.
    """
    model = getattr(request.app.state, "model", None)
    if model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded.")

    from ml.detection import assess_road_video, get_device

    content_type = file.content_type or ""
    if not content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail=f"Expected video file, got: {content_type}")

    # Save to temp file (OpenCV needs file path for video)
    temp_filename = f"{uuid.uuid4().hex}.mp4"
    temp_path = UPLOAD_PATH / temp_filename

    try:
        save_video(file.file, temp_path)
        ensure_readable_video(temp_path)

        device = get_device()
        with pool_for(request.app.state, "model").acquire() as pooled:
            result = assess_road_video(
                str(temp_path),
                model=pooled,
                conf_threshold=conf_threshold,
                device=device,
                sample_rate=sample_rate,
            )

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message", "Video processing failed"))

        response = VideoAssessmentResponse(
            success=True,
            total_frames_analyzed=result.get("total_frames_analyzed", 0),
            total_detections=result.get("total_detections", 0),
            road_priority=result.get("road_priority", "Low"),
            priority_counts=result.get("priority_counts", {}),
            annotated_image_base64=result.get("annotated_image_base64"),
            summary=result.get("summary", {}),
            message=result.get("message", ""),
        )

        return response

    finally:
        # Cleanup temp file
        if temp_path.exists():
            try:
                os.remove(temp_path)
            except Exception:
                pass
